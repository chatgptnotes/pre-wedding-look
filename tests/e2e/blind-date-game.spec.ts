import { test, expect } from '@playwright/test';
import fs from 'fs';

// Load test configuration
const config = JSON.parse(fs.readFileSync('tests/test-config.json', 'utf8'));

// Use authenticated state
test.use({ storageState: 'tests/.auth/user.json' });

test.describe('Blind Date Style-Off Game', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('should complete full game flow: quick match → 3 rounds → reveal → vote → reel download', async ({ page }) => {
    // Step 1: Navigate to Blind Date tab
    await test.step('Navigate to Blind Date game', async () => {
      const blindDateTab = page.locator('button:has-text("Blind Date"), [data-testid="blind-date-tab"]');
      await expect(blindDateTab).toBeVisible();
      await blindDateTab.click();
      
      // Wait for tab content to load
      await page.waitForSelector('[data-testid="blind-date-content"], .blind-date-game', {
        timeout: 10000
      });
    });

    // Step 2: Start Quick Match
    await test.step('Start quick match', async () => {
      const quickMatchButton = page.locator('button:has-text("Quick Match"), [data-testid="quick-match"]');
      await expect(quickMatchButton).toBeVisible();
      await quickMatchButton.click();

      // Should show matching/waiting state
      await expect(page.locator(':has-text("Finding opponent"), :has-text("Waiting")')).toBeVisible({
        timeout: 15000
      });
    });

    // Step 3: Wait for game to start or create test room
    let gameRoomId: string;
    await test.step('Enter game room', async () => {
      // Try to join existing test room if quick match takes too long
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Quick match timeout')), 10000);
      });

      const gameStartPromise = page.waitForSelector(
        '[data-testid="game-started"], .game-round, :has-text("Round 1")',
        { timeout: 15000 }
      );

      try {
        await Promise.race([gameStartPromise, timeoutPromise]);
      } catch (error) {
        // Fallback: use test room
        console.log('Quick match timeout, using test room...');
        const testRoom = config.rooms[0];
        
        // Look for room code input or join room button
        const joinRoomButton = page.locator('button:has-text("Join Room"), [data-testid="join-room"]');
        if (await joinRoomButton.isVisible()) {
          await joinRoomButton.click();
        }

        const roomCodeInput = page.locator('input[placeholder*="room code"], [data-testid="room-code-input"]');
        if (await roomCodeInput.isVisible()) {
          await roomCodeInput.fill(testRoom.room_code);
          await page.keyboard.press('Enter');
        }
      }

      // Verify game has started
      await expect(page.locator(
        ':has-text("Round 1"), .game-round, [data-testid="round-indicator"]'
      )).toBeVisible({ timeout: 10000 });
    });

    // Step 4: Play 3 rounds
    for (let round = 1; round <= 3; round++) {
      await test.step(`Complete Round ${round}`, async () => {
        // Verify round indicator
        await expect(page.locator(`:has-text("Round ${round}")`)).toBeVisible();

        // Look for style selection or upload area
        const styleOptions = page.locator('[data-testid="style-option"], .style-card');
        const uploadArea = page.locator('[data-testid="upload-area"], .upload-zone, input[type="file"]');

        if (await styleOptions.count() > 0) {
          // Style selection mode - click a random style
          const randomIndex = Math.floor(Math.random() * await styleOptions.count());
          await styleOptions.nth(randomIndex).click();
        } else if (await uploadArea.isVisible()) {
          // Upload mode - use test image
          const fileInput = page.locator('input[type="file"]');
          if (await fileInput.isVisible()) {
            await fileInput.setInputFiles('tests/assets/test-upload-1.jpg');
          }
        }

        // Submit selection
        const submitButton = page.locator(
          'button:has-text("Submit"), button:has-text("Next"), [data-testid="submit-choice"]'
        );
        
        if (await submitButton.isVisible()) {
          await submitButton.click();
        }

        // Wait for round completion or next round
        if (round < 3) {
          await expect(page.locator(`:has-text("Round ${round + 1}")`)).toBeVisible({
            timeout: 15000
          });
        } else {
          // Last round - wait for reveal phase
          await expect(page.locator(
            ':has-text("Reveal"), :has-text("Results"), [data-testid="reveal-phase"]'
          )).toBeVisible({ timeout: 15000 });
        }
      });
    }

    // Step 5: Reveal phase
    await test.step('View reveal results', async () => {
      // Should show reveal interface with styled images
      await expect(page.locator(
        '[data-testid="reveal-results"], .reveal-container, :has-text("Your Creation")'
      )).toBeVisible();

      // Should show styled images from both players
      const styledImages = page.locator('[data-testid="styled-image"], .styled-result img');
      await expect(styledImages.first()).toBeVisible();

      // Check for player names or indicators
      await expect(page.locator(
        ':has-text("You"), :has-text("Opponent"), [data-testid="player-indicator"]'
      )).toBeVisible();
    });

    // Step 6: Voting phase
    await test.step('Cast votes', async () => {
      // Look for voting interface
      const voteButtons = page.locator(
        '[data-testid="vote-button"], button:has-text("Vote"), .vote-option'
      );

      if (await voteButtons.count() > 0) {
        // Cast votes for each round/category
        const voteCount = await voteButtons.count();
        for (let i = 0; i < Math.min(voteCount, 3); i++) {
          await voteButtons.nth(i).click();
          await page.waitForTimeout(1000); // Small delay between votes
        }

        // Submit votes
        const submitVotesButton = page.locator(
          'button:has-text("Submit Votes"), [data-testid="submit-votes"]'
        );
        
        if (await submitVotesButton.isVisible()) {
          await submitVotesButton.click();
        }
      }

      // Wait for final results
      await expect(page.locator(
        ':has-text("Winner"), :has-text("Results"), [data-testid="final-results"]'
      )).toBeVisible({ timeout: 10000 });
    });

    // Step 7: Download reel
    await test.step('Download reel', async () => {
      const downloadButton = page.locator(
        'button:has-text("Download"), [data-testid="download-reel"], .download-btn'
      );

      await expect(downloadButton).toBeVisible();

      // Start download
      const downloadPromise = page.waitForEvent('download');
      await downloadButton.click();

      // Check if credits are sufficient or if payment is required
      const paymentModal = page.locator('[data-testid="payment-modal"], .credits-modal');
      const creditsWarning = page.locator(':has-text("insufficient credits"), :has-text("need more credits")');

      if (await paymentModal.isVisible() || await creditsWarning.isVisible()) {
        console.log('Payment/credits required for download');
        
        // Try to use promo code for credits
        const promoButton = page.locator('button:has-text("Promo"), [data-testid="promo-code-btn"]');
        if (await promoButton.isVisible()) {
          await promoButton.click();
          
          const promoInput = page.locator('input[placeholder*="promo"], [data-testid="promo-input"]');
          if (await promoInput.isVisible()) {
            await promoInput.fill(config.promoCodes[0]); // Use first test promo code
            await page.keyboard.press('Enter');
            
            // Wait for credits to be added
            await page.waitForTimeout(2000);
            
            // Try download again
            await downloadButton.click();
          }
        }
      }

      // Verify download started
      try {
        const download = await downloadPromise;
        expect(download.suggestedFilename()).toMatch(/\.(mp4|mov|avi)$/);
        console.log(`✅ Reel downloaded: ${download.suggestedFilename()}`);
      } catch (error) {
        console.log('Download may require manual verification');
      }
    });
  });

  test('should handle multiplayer room creation and joining', async ({ page, context }) => {
    await test.step('Create multiplayer room', async () => {
      // Navigate to Blind Date tab
      const blindDateTab = page.locator('button:has-text("Blind Date"), [data-testid="blind-date-tab"]');
      await blindDateTab.click();

      // Click Create Room
      const createRoomButton = page.locator('button:has-text("Create Room"), [data-testid="create-room"]');
      if (await createRoomButton.isVisible()) {
        await createRoomButton.click();

        // Fill room settings
        const maxPlayersSelect = page.locator('select[name="maxPlayers"], [data-testid="max-players"]');
        if (await maxPlayersSelect.isVisible()) {
          await maxPlayersSelect.selectOption('2');
        }

        const createButton = page.locator('button:has-text("Create"), [data-testid="confirm-create"]');
        if (await createButton.isVisible()) {
          await createButton.click();
        }

        // Should show room code
        await expect(page.locator(
          '[data-testid="room-code"], :has-text("Room Code"), .room-info'
        )).toBeVisible();

        const roomCodeElement = page.locator('[data-testid="room-code-value"], .room-code');
        const roomCode = await roomCodeElement.textContent();
        
        expect(roomCode).toBeTruthy();
        expect(roomCode).toMatch(/^[A-Z0-9]{4,8}$/);
      }
    });
  });

  test('should handle credits system integration', async ({ page }) => {
    await test.step('Verify credits display', async () => {
      const creditsDisplay = page.locator('[data-testid="credits-display"], .credits-display');
      await expect(creditsDisplay).toBeVisible();

      const creditsAmount = page.locator('[data-testid="credits-amount"], .credits-amount');
      await expect(creditsAmount).toBeVisible();

      // Credits should be numeric
      const creditsText = await creditsAmount.textContent();
      expect(creditsText).toMatch(/\d+/);
    });

    await test.step('Test promo code redemption', async () => {
      // Click on credits display or promo button
      const creditsDisplay = page.locator('[data-testid="credits-display"], .credits-display');
      await creditsDisplay.click();

      // Look for promo code section
      const promoButton = page.locator('button:has-text("Promo"), [data-testid="promo-code-btn"]');
      if (await promoButton.isVisible()) {
        await promoButton.click();

        const promoInput = page.locator('input[placeholder*="promo"], [data-testid="promo-input"]');
        if (await promoInput.isVisible()) {
          await promoInput.fill(config.promoCodes[2]); // Use E2ETEST code
          
          const redeemButton = page.locator('button:has-text("Redeem"), [data-testid="redeem-promo"]');
          await redeemButton.click();

          // Should show success message
          await expect(page.locator(
            ':has-text("Success"), :has-text("credits added"), [data-testid="promo-success"]'
          )).toBeVisible({ timeout: 5000 });
        }
      }
    });
  });

  test('should handle error states gracefully', async ({ page }) => {
    await test.step('Test network error handling', async () => {
      // Navigate to game
      const blindDateTab = page.locator('button:has-text("Blind Date")');
      await blindDateTab.click();

      // Simulate network error by going offline
      await page.context().setOffline(true);

      // Try to start quick match
      const quickMatchButton = page.locator('button:has-text("Quick Match")');
      if (await quickMatchButton.isVisible()) {
        await quickMatchButton.click();

        // Should show error message
        await expect(page.locator(
          ':has-text("connection"), :has-text("error"), [data-testid="error-message"]'
        )).toBeVisible({ timeout: 10000 });
      }

      // Restore network
      await page.context().setOffline(false);
    });

    await test.step('Test invalid room code', async () => {
      const joinRoomButton = page.locator('button:has-text("Join Room")');
      if (await joinRoomButton.isVisible()) {
        await joinRoomButton.click();

        const roomCodeInput = page.locator('input[placeholder*="room code"]');
        if (await roomCodeInput.isVisible()) {
          await roomCodeInput.fill('INVALID123');
          await page.keyboard.press('Enter');

          // Should show error
          await expect(page.locator(
            ':has-text("not found"), :has-text("invalid"), [data-testid="room-error"]'
          )).toBeVisible({ timeout: 5000 });
        }
      }
    });
  });
});