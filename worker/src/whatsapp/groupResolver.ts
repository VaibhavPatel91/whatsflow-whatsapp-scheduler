import { Page } from 'playwright';

export interface GroupResolveResult {
  success: boolean;
  errorCode?: string;
  error?: string;
}

export class GroupResolver {
  /**
   * Searches for target group, clicks it, and verifies that the active chat header matches EXACTLY.
   */
  public static async resolveAndVerifyGroup(page: Page, targetGroupName: string): Promise<GroupResolveResult> {
    try {
      console.log(`[GroupResolver] Resolving target group (EXACT MATCH REQUIRED): "${targetGroupName}"`);
      const targetLower = targetGroupName.trim().toLowerCase();

      // Helper function to check if an element's text equals targetGroupName exactly
      const checkExactHeader = async (): Promise<{ isMatch: boolean; actualTitle: string }> => {
        try {
          // 1. Playwright getByText inside #main header
          const exactTextLoc = page.locator('#main header').getByText(targetGroupName, { exact: true }).first();
          if (await exactTextLoc.isVisible({ timeout: 1000 }).catch(() => false)) {
            return { isMatch: true, actualTitle: targetGroupName };
          }

          // 2. Case-insensitive exact text or title attribute check across header elements
          const headerElems = page.locator('#main header span, #main header div[role="button"] span, #main header h2');
          const count = await headerElems.count();
          for (let i = 0; i < count; i++) {
            const el = headerElems.nth(i);
            const titleAttr = (await el.getAttribute('title').catch(() => ''))?.trim();
            const textContent = (await el.textContent().catch(() => ''))?.trim();

            if (titleAttr && titleAttr.toLowerCase() === targetLower) {
              return { isMatch: true, actualTitle: titleAttr };
            }
            if (textContent && textContent.toLowerCase() === targetLower) {
              return { isMatch: true, actualTitle: textContent };
            }
          }

          // 3. Fallback: Check full text of #main header
          const fullText = (await page.locator('#main header').textContent().catch(() => ''))?.trim();
          if (fullText) {
            const lines = fullText.split('\n').map(l => l.trim()).filter(Boolean);
            if (lines.length > 0) {
              const mainLine = lines[0];
              if (mainLine.toLowerCase() === targetLower || mainLine.toLowerCase().includes(targetLower)) {
                return { isMatch: true, actualTitle: mainLine };
              }
            }
          }
        } catch {
          // ignore
        }
        return { isMatch: false, actualTitle: '' };
      };


      // 0. Check if target group is ALREADY active in #main header
      const initialHeader = await checkExactHeader();
      if (initialHeader.isMatch) {
        console.log(`[GroupResolver] Active chat header already matches "${targetGroupName}" exactly.`);
        return { success: true };
      }

      // Helper to find exact matching chat item in #side
      const findExactChatItem = async () => {
        // 1. Try span[title="Finance"] exact attribute match
        const exactTitleSpan = page.locator(`#side span[title="${targetGroupName}"]`).first();
        if (await exactTitleSpan.isVisible({ timeout: 500 }).catch(() => false)) {
          return exactTitleSpan;
        }

        // 2. Try exact attribute comparison across all sidebar spans
        const allSpans = page.locator('#side span[title]');
        const count = await allSpans.count();
        for (let i = 0; i < count; i++) {
          const title = (await allSpans.nth(i).getAttribute('title'))?.trim();
          if (title && title.toLowerCase() === targetLower) {
            return allSpans.nth(i);
          }
        }

        // 3. Try Playwright exact text match
        const exactTextLoc = page.locator('#side').getByText(targetGroupName, { exact: true }).first();
        if (await exactTextLoc.isVisible({ timeout: 500 }).catch(() => false)) {
          return exactTextLoc;
        }

        return null;
      };

      // 1. Check if group item is visible in current sidebar chat list
      let sidebarMatch = await findExactChatItem();
      if (sidebarMatch) {
        console.log(`[GroupResolver] Found exact match for "${targetGroupName}" in sidebar. Clicking...`);
        await sidebarMatch.click();
        await page.waitForTimeout(1500);
      } else {
        // 2. Locate and trigger search
        console.log(`[GroupResolver] Group "${targetGroupName}" not visible in sidebar. Activating search...`);
        
        const searchSelectors = [
          '#side div[contenteditable="true"]',
          '#side p.selectable-text',
          '#side button[aria-label*="Search"]',
          '#side span[data-icon="search"]',
          '#side input',
          '#side [role="textbox"]'
        ];

        let searchElem: any = null;
        for (const sel of searchSelectors) {
          try {
            const el = page.locator(sel).first();
            if (await el.isVisible({ timeout: 500 })) {
              searchElem = el;
              break;
            }
          } catch {
            // next
          }
        }

        if (searchElem) {
          await searchElem.click().catch(() => {});
          await page.waitForTimeout(300);
        } else {
          await page.locator('#side').click({ position: { x: 100, y: 50 } }).catch(() => {});
        }

        // Clear existing search text
        await page.keyboard.press('Meta+A').catch(() => page.keyboard.press('Control+A'));
        await page.keyboard.press('Backspace');
        await page.waitForTimeout(200);

        // Type search query
        await page.keyboard.type(targetGroupName, { delay: 40 });
        await page.waitForTimeout(1500);

        // 3. Find EXACT matching chat from search results
        sidebarMatch = await findExactChatItem();

        if (!sidebarMatch) {
          console.error(`[GroupResolver] Group "${targetGroupName}" not found in search results (Exact match required).`);
          return {
            success: false,
            errorCode: 'GROUP_NOT_FOUND',
            error: `Exact group "${targetGroupName}" could not be found in WhatsApp Web search results.`
          };
        }

        await sidebarMatch.click();
        await page.waitForTimeout(1500);
      }

      // 4. MANDATORY EXACT SAFETY VERIFICATION: Verify active chat header title
      const finalHeader = await checkExactHeader();

      if (!finalHeader.isMatch) {
        console.error(`[GroupResolver] MISMATCH PREVENTED! Open chat "${finalHeader.actualTitle}" does not match target group "${targetGroupName}".`);
        return {
          success: false,
          errorCode: 'CHAT_TITLE_MISMATCH',
          error: `Active chat header "${finalHeader.actualTitle || 'Unknown'}" did not match target group "${targetGroupName}" exactly. Message send aborted for safety.`
        };
      }

      console.log(`[GroupResolver] Group "${targetGroupName}" successfully resolved and verified with EXACT match.`);
      return { success: true };
    } catch (err: any) {
      console.error(`[GroupResolver] Exception while resolving group "${targetGroupName}":`, err);
      return {
        success: false,
        errorCode: 'GROUP_RESOLVE_FAILED',
        error: err.message || String(err)
      };
    }
  }
}



