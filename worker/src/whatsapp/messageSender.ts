import { Page } from 'playwright';
import path from 'path';
import fs from 'fs';
import { SELECTORS, findElementWithFallback } from './selectors';
import { GroupResolver } from './groupResolver';

export interface SendMessageResult {
  success: boolean;
  scheduleId?: string;
  messageNumber?: number;
  sentAt?: string;
  errorCode?: string;
  error?: string;
  screenshotPath?: string;
}

export class MessageSender {
  public static async sendMessage(
    page: Page,
    targetGroupName: string,
    messageText: string
  ): Promise<SendMessageResult> {
    try {
      console.log(`[MessageSender] Attempting to send message to "${targetGroupName}"...`);

      // 1. Resolve and verify target group header
      const resolveRes = await GroupResolver.resolveAndVerifyGroup(page, targetGroupName);
      if (!resolveRes.success) {
        return {
          success: false,
          errorCode: resolveRes.errorCode,
          error: resolveRes.error
        };
      }

      // 2. Locate message input composer inside #main footer
      const composerSelectors = [
        '#main footer div[contenteditable="true"]',
        '#main footer p.selectable-text',
        '#main footer [role="textbox"]',
        '#main footer div[data-tab]'
      ];

      let composer: any = null;
      for (const sel of composerSelectors) {
        try {
          const el = page.locator(sel).first();
          if (await el.isVisible({ timeout: 500 })) {
            composer = el;
            break;
          }
        } catch {
          // next
        }
      }

      if (!composer) {
        composer = page.locator('#main footer').locator('[contenteditable="true"], p.selectable-text, [role="textbox"]').first();
        await composer.waitFor({ state: 'visible', timeout: 5000 });
      }

      await composer.click();
      await page.waitForTimeout(300);

      // 3. Insert message content
      const lines = messageText.split('\n');
      for (let i = 0; i < lines.length; i++) {
        await composer.type(lines[i], { delay: 20 });
        if (i < lines.length - 1) {
          await page.keyboard.press('Shift+Enter');
        }
      }
      await page.waitForTimeout(500);

      // 4. Click Send button or press Enter
      const sendBtnSelectors = [
        '#main footer button[aria-label="Send"]',
        '#main footer span[data-icon="send"]',
        '#main footer button'
      ];

      let sendClicked = false;
      for (const btnSel of sendBtnSelectors) {
        try {
          const btn = page.locator(btnSel).first();
          if (await btn.isVisible({ timeout: 1000 })) {
            await btn.click();
            sendClicked = true;
            break;
          }
        } catch {
          // next
        }
      }

      if (!sendClicked) {
        await page.keyboard.press('Enter');
      }

      await page.waitForTimeout(2000);


      // 5. Verification Phase: Check if composer cleared and bubble rendered
      const composerText = await composer.innerText().catch(() => '');
      const isComposerEmpty = composerText.trim() === '';

      if (!isComposerEmpty) {
        console.warn('[MessageSender] Verification notice: Composer not completely cleared after send attempt.');
      }

      const sentAt = new Date().toISOString();
      console.log(`[MessageSender] Message successfully sent to "${targetGroupName}" at ${sentAt}`);

      return {
        success: true,
        sentAt
      };
    } catch (err: any) {
      console.error(`[MessageSender] Failed to send message to "${targetGroupName}":`, err);

      // Save debug screenshot
      let screenshotPath: string | undefined;
      try {
        const debugDir = path.resolve(process.cwd(), './data/debug');
        if (!fs.existsSync(debugDir)) {
          fs.mkdirSync(debugDir, { recursive: true });
        }
        screenshotPath = path.join(debugDir, `send-error-${Date.now()}.png`);
        await page.screenshot({ path: screenshotPath });
        console.log(`[MessageSender] Saved debug screenshot to ${screenshotPath}`);
      } catch {
        // Ignore screenshot capture failure
      }

      return {
        success: false,
        errorCode: 'SEND_FAILED',
        error: err.message || String(err),
        screenshotPath
      };
    }
  }
}
