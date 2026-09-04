/**
 * Centralized WhatsApp Web DOM selectors with fallback candidates.
 * Update selectors here when WhatsApp Web UI changes.
 */

export const SELECTORS = {
  // Main chat list & loading states
  sideBar: [
    '#side',
    '#pane-side',
    'div[id="side"]',
    'div[id="pane-side"]',
    'div[data-testid="chat-list-sidebar"]',
    'div[aria-label="Chat list"]',
    'header[data-testid="chatlist-header"]',
    '#app header',
    'div[contenteditable="true"][data-tab="3"]',
    'div[aria-label="Search or start new chat"]'
  ],
  qrContainer: [
    'div[data-ref]',
    'canvas',
    'div[data-testid="qrcode"]',
    'div[aria-label="Scan this QR code to use WhatsApp Web"]',
    'div[data-testid="qr-code"]'
  ],

  // Search Box
  searchInput: [
    '#side div[contenteditable="true"]',
    '#side p.selectable-text',
    'div[contenteditable="true"][data-tab="3"]',
    'div[contenteditable="true"][aria-label="Search input box"]',
    'div[aria-label="Search or start new chat"]',
    'div[contenteditable="true"][role="textbox"]',
    'div[data-testid="chat-list-search"]'
  ],

  // Chat Item in Search Results / Side Panel
  chatItemTitle: [
    '#side span[title]',
    'span[title]',
    'div[data-testid="cell-frame-title"] span',
    'span.aria-label'
  ],

  // Active Chat Header Group Name
  activeChatHeaderTitle: [
    '#main header span[title]',
    '#main header div[role="button"] span[title]',
    'header div[data-testid="conversation-info-header"] span[title]',
    '#main header div span[title]'
  ],

  // Message Input Composer
  messageComposer: [
    '#main footer div[contenteditable="true"]',
    '#main footer p.selectable-text',
    '#main div[contenteditable="true"][data-tab="10"]',
    'div[contenteditable="true"][aria-label="Type a message"]',
    '#main div[role="textbox"]'
  ],

  // Send Button
  sendButton: [
    '#main footer button[aria-label="Send"]',
    '#main footer span[data-icon="send"]',
    'button[data-testid="compose-btn-send"]',
    '#main footer button'
  ],

  // Sent Message Bubble Verification
  sentMessageBubble: [
    '#main div[data-id] div.message-out',
    '#main div[data-testid="msg-container"]',
    '#main div.focusable-list-item:last-child'
  ]
};

export async function findElementWithFallback(page: any, selectors: string[], timeout = 5000) {
  const startTime = Date.now();
  while (Date.now() - startTime < timeout) {
    for (const selector of selectors) {
      try {
        const element = page.locator(selector).first();
        if (await element.isVisible({ timeout: 250 })) {
          return { element, selector };
        }
      } catch {
        // Continue checking next selector
      }
    }
    await page.waitForTimeout(250);
  }

  throw new Error(`Could not find any visible element matching selectors: [${selectors.join(', ')}]`);
}

