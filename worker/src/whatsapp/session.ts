import { chromium, BrowserContext, Page } from 'playwright';
import path from 'path';
import fs from 'fs';
import { connectionRepository, getProjectRoot } from '../../../shared/src/db';
import { SELECTORS, findElementWithFallback } from './selectors';
import { WhatsAppStatus } from '../../../shared/src/types';

export class WhatsAppSession {
  private static instance: WhatsAppSession;
  private context: BrowserContext | null = null;
  private page: Page | null = null;
  private isInitializing = false;

  private constructor() {}

  public static getInstance(): WhatsAppSession {
    if (!WhatsAppSession.instance) {
      WhatsAppSession.instance = new WhatsAppSession();
    }
    return WhatsAppSession.instance;
  }

  public async init(profilePath?: string, headless = false): Promise<WhatsAppStatus> {
    if (this.isInitializing) return connectionRepository.get().status;
    this.isInitializing = true;

    try {
      if (this.context && this.page && !this.page.isClosed()) {
        const currentStatus = await this.checkAuthStatus();
        if (currentStatus === 'CONNECTED' || currentStatus === 'WAITING_FOR_QR') {
          this.isInitializing = false;
          return currentStatus;
        }
      }

      // Close old context if present
      if (this.context) {
        await this.context.close().catch(() => {});
        this.context = null;
        this.page = null;
      }

      connectionRepository.updateStatus('CONNECTING');

      const targetProfilePath = profilePath
        ? path.resolve(getProjectRoot(), profilePath)
        : process.env.WHATSAPP_PROFILE_PATH
        ? path.resolve(getProjectRoot(), process.env.WHATSAPP_PROFILE_PATH)
        : path.join(getProjectRoot(), 'data/whatsapp-profile');

      if (!fs.existsSync(targetProfilePath)) {
        fs.mkdirSync(targetProfilePath, { recursive: true });
      }

      // Clean up stale Chromium lock files if present
      const lockFiles = [
        path.join(targetProfilePath, 'SingletonLock'),
        path.join(targetProfilePath, 'SingletonCookie'),
        path.join(targetProfilePath, 'SingletonSocket'),
        path.join(targetProfilePath, 'Default', 'LOCK')
      ];
      for (const lf of lockFiles) {
        if (fs.existsSync(lf)) {
          try {
            fs.unlinkSync(lf);
          } catch {
            // ignore if locked by active OS file handle
          }
        }
      }

      // Purge non-essential Chromium disk cache folders to keep profile lightweight
      purgeChromiumCache(targetProfilePath);

      console.log(`[WhatsAppSession] Launching persistent Chromium context at ${targetProfilePath}...`);

      this.context = await chromium.launchPersistentContext(targetProfilePath, {
        headless: process.env.HEADLESS_BROWSER === 'true' || headless,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--disable-gpu',
          '--disk-cache-size=1048576',
          '--media-cache-size=1048576',
          '--disable-application-cache',
          '--disable-gpu-shader-disk-cache',
          '--aggressive-cache-discard',
          '--disable-component-update'
        ],
        viewport: { width: 1280, height: 800 },
        userAgent:
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
      });

      const pages = this.context.pages();
      let whatsappPage = pages.find(p => p.url().includes('web.whatsapp.com'));

      if (!whatsappPage) {
        whatsappPage = pages.length > 0 ? pages[0] : await this.context.newPage();
        console.log('[WhatsAppSession] Navigating to https://web.whatsapp.com...');
        await whatsappPage.goto('https://web.whatsapp.com', { waitUntil: 'domcontentloaded', timeout: 60000 });
      } else {
        console.log('[WhatsAppSession] Re-attaching to existing WhatsApp Web tab...');
      }

      // Close all extra about:blank tabs so only WhatsApp Web remains open
      for (const p of this.context.pages()) {
        if (p !== whatsappPage && (p.url() === 'about:blank' || p.url() === '')) {
          await p.close().catch(() => {});
        }
      }

      this.page = whatsappPage;
      await this.page.bringToFront().catch(() => {});

      // Check authentication status with polling loop (up to 20s) for initial page load
      let status: WhatsAppStatus = 'CONNECTING';
      const maxRetries = 10;
      for (let i = 0; i < maxRetries; i++) {
        status = await this.checkAuthStatus();
        if (status === 'CONNECTED' || status === 'WAITING_FOR_QR') {
          break;
        }
        if (i < maxRetries - 1) {
          await this.page.waitForTimeout(2000).catch(() => {});
        }
      }
      this.isInitializing = false;
      return status;
    } catch (err: any) {
      console.error('[WhatsAppSession] Initialization error:', err);
      this.isInitializing = false;
      connectionRepository.updateStatus('ERROR', err.message || String(err));
      return 'ERROR';
    }
  }

  public async checkAuthStatus(): Promise<WhatsAppStatus> {
    if (!this.page || this.page.isClosed()) {
      this.context = null;
      this.page = null;
      return 'DISCONNECTED';
    }

    if (this.page.url() === 'about:blank' || this.page.url() === '') {
      await this.page.goto('https://web.whatsapp.com', { waitUntil: 'domcontentloaded', timeout: 60000 }).catch(() => {});
      await this.page.bringToFront().catch(() => {});
    }

    try {
      // Check if sidebar / main chat list exists (CONNECTED)
      const sideBarLocators = SELECTORS.sideBar;
      for (const sel of sideBarLocators) {
        if (await this.page.locator(sel).isVisible({ timeout: 2000 }).catch(() => false)) {
          connectionRepository.updateStatus('CONNECTED');
          return 'CONNECTED';
        }
      }

      // Check if QR code container is visible (WAITING_FOR_QR)
      const qrLocators = SELECTORS.qrContainer;
      for (const sel of qrLocators) {
        if (await this.page.locator(sel).isVisible({ timeout: 2000 }).catch(() => false)) {
          connectionRepository.updateStatus('WAITING_FOR_QR');
          return 'WAITING_FOR_QR';
        }
      }

      // Give WhatsApp Web DOM up to 3 extra seconds to finish rendering
      await this.page.waitForTimeout(3000).catch(() => {});

      for (const sel of sideBarLocators) {
        if (await this.page.locator(sel).isVisible({ timeout: 1000 }).catch(() => false)) {
          connectionRepository.updateStatus('CONNECTED');
          return 'CONNECTED';
        }
      }

      for (const sel of qrLocators) {
        if (await this.page.locator(sel).isVisible({ timeout: 1000 }).catch(() => false)) {
          connectionRepository.updateStatus('WAITING_FOR_QR');
          return 'WAITING_FOR_QR';
        }
      }

      connectionRepository.updateStatus('CONNECTING');
      return 'CONNECTING';
    } catch (err: any) {
      console.error('[WhatsAppSession] Auth status check error:', err);
      if (err.message && err.message.includes('closed')) {
        this.context = null;
        this.page = null;
        connectionRepository.updateStatus('DISCONNECTED');
        return 'DISCONNECTED';
      }
      connectionRepository.updateStatus('ERROR', err.message || String(err));
      return 'ERROR';
    }
  }

  public async disconnect(): Promise<void> {
    try {
      if (this.context) {
        await this.context.close().catch(() => {});
        this.context = null;
        this.page = null;
      }
      connectionRepository.updateStatus('DISCONNECTED');
    } catch (err: any) {
      console.error('[WhatsAppSession] Disconnect error:', err);
    }
  }

  public async closeBrowser(): Promise<void> {
    try {
      if (this.context) {
        await this.context.close().catch(() => {});
        this.context = null;
        this.page = null;
      }
    } catch (err: any) {
      console.error('[WhatsAppSession] Error closing browser window:', err);
    }
  }




  public getPage(): Page | null {
    return this.page;
  }

  public async getAvailableGroups(): Promise<Array<{ id: string; name: string }>> {
    if (!this.page || connectionRepository.get().status !== 'CONNECTED') {
      return [];
    }

    try {
      // Scrape open visible chat titles from sidebar without storing phone contacts
      const chatTitles = await this.page.evaluate(() => {
        const titles: string[] = [];
        const titleElements = document.querySelectorAll('#side span[title]');
        titleElements.forEach((el) => {
          const t = el.getAttribute('title')?.trim();
          if (t && !titles.includes(t)) {
            titles.push(t);
          }
        });
        return titles;
      });

      return chatTitles.map((title, idx) => ({
        id: title, // Using group name as stable identifier
        name: title
      }));
    } catch (err) {
      console.error('[WhatsAppSession] Error retrieving available groups:', err);
      return [];
    }
  }
}

function purgeChromiumCache(targetProfilePath: string): void {
  try {
    const cacheDirs = [
      path.join(targetProfilePath, 'Default', 'Cache'),
      path.join(targetProfilePath, 'Default', 'Code Cache'),
      path.join(targetProfilePath, 'Default', 'GPUCache'),
      path.join(targetProfilePath, 'Default', 'DawnWebGPUCache'),
      path.join(targetProfilePath, 'Default', 'DawnGraphiteCache'),
      path.join(targetProfilePath, 'Default', 'Service Worker', 'CacheStorage'),
      path.join(targetProfilePath, 'component_crx_cache'),
      path.join(targetProfilePath, 'extensions_crx_cache'),
      path.join(targetProfilePath, 'GPUPersistentCache'),
    ];

    for (const dir of cacheDirs) {
      if (fs.existsSync(dir)) {
        fs.rmSync(dir, { recursive: true, force: true });
      }
    }

    if (fs.existsSync(targetProfilePath)) {
      const files = fs.readdirSync(targetProfilePath);
      for (const file of files) {
        if (file.startsWith('BrowserMetrics') || file.startsWith('.com.google.chrome')) {
          try {
            fs.unlinkSync(path.join(targetProfilePath, file));
          } catch {
            // ignore
          }
        }
      }
    }
  } catch (e) {
    console.warn('[WhatsAppSession] Cache purge warning:', e);
  }
}
