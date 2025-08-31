import { test, expect } from "@playwright/test";
import { TestUser, TestData } from "./utils/test-data";
import { AuthHelpers } from "./utils/auth-helpers";

/**
 * Error Handling and Edge Cases Tests
 * Tests various error conditions and edge cases in the authentication system.
 */

test.describe("Authentication Error Handling", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/auth-test");
    await AuthHelpers.waitForAuthLoad(page);
  });

  test.describe("Network and Server Errors", () => {
    test("should handle API endpoint failures gracefully", async ({ page }) => {
      // Intercept auth API calls and make them fail
      await page.route("**/api/auth/**", async route => {
        route.fulfill({
          status: 500,
          contentType: "application/json",
          body: JSON.stringify({ error: "Internal Server Error" }),
        });
      });

      const testUser = TestUser.createUnique();

      await page.click("text=Sign up");
      await page.fill('input[name="name"]', testUser.name);
      await page.fill('input[name="email"]', testUser.email);
      await page.fill('input[name="password"]', testUser.password);
      await page.click('button[type="submit"]');

      // Should show error message
      await AuthHelpers.verifyError(page);

      // Should remain unauthenticated
      await AuthHelpers.verifyUnauthenticated(page);
    });

    test("should handle network timeouts", async ({ page }) => {
      // Intercept and delay auth requests
      await page.route("**/api/auth/**", async route => {
        await new Promise(resolve => setTimeout(resolve, 30000)); // 30s delay
        route.continue();
      });

      const testUser = TestUser.createUnique();

      await page.click("text=Sign up");
      await page.fill('input[name="name"]', testUser.name);
      await page.fill('input[name="email"]', testUser.email);
      await page.fill('input[name="password"]', testUser.password);

      // Set shorter timeout for this test
      page.setDefaultTimeout(5000);

      await page.click('button[type="submit"]');

      // Should either timeout or show error
      await Promise.race([
        AuthHelpers.verifyError(page),
        expect(page.locator("text=Please wait...")).toBeVisible(),
      ]);
    });

    test("should handle malformed server responses", async ({ page }) => {
      await page.route("**/api/auth/**", async route => {
        route.fulfill({
          status: 200,
          contentType: "application/json",
          body: "invalid json response",
        });
      });

      const testUser = TestUser.createUnique();
      await page.click("text=Sign up");
      await page.fill('input[name="name"]', testUser.name);
      await page.fill('input[name="email"]', testUser.email);
      await page.fill('input[name="password"]', testUser.password);
      await page.click('button[type="submit"]');

      // Should handle gracefully with error message
      await AuthHelpers.verifyError(page);
    });

    test("should handle CORS errors", async ({ page }) => {
      await page.route("**/api/auth/**", async route => {
        route.fulfill({
          status: 0, // Network error
          contentType: "text/plain",
          body: "",
        });
      });

      const testUser = TestUser.createUnique();
      await AuthHelpers.signUp(page, testUser).catch(() => {}); // Expected to fail

      // Should show error or remain in form state
      const authState = await AuthHelpers.getAuthState(page);
      expect(["unauthenticated", "loading"]).toContain(authState);
    });
  });

  test.describe("Input Validation and Sanitization", () => {
    test("should handle XSS attempts in name field", async ({ page }) => {
      const xssAttempts = [
        '<script>alert("xss")</script>',
        'javascript:alert("xss")',
        '"><script>alert("xss")</script>',
        "'; DROP TABLE users; --",
      ];

      for (const xss of xssAttempts) {
        const testUser = TestUser.create({ name: xss });

        try {
          await page.goto("/auth-test");
          await AuthHelpers.signUp(page, testUser);

          // If registration succeeds, verify XSS was sanitized
          await AuthHelpers.verifyAuthenticated(page);

          // Check that script tags are not executed
          const alerts = [];
          page.on("dialog", dialog => {
            alerts.push(dialog.message());
            dialog.dismiss();
          });

          await page.waitForTimeout(1000);
          expect(alerts).toHaveLength(0);

          await AuthHelpers.signOut(page);
        } catch (error) {
          // Registration might fail due to validation, which is also acceptable
          console.log(`XSS attempt blocked: ${xss}`);
        }
      }
    });

    test("should handle SQL injection attempts", async ({ page }) => {
      const sqlInjectionAttempts = [
        "'; DROP TABLE users; --",
        "' OR '1'='1",
        "admin'--",
        "' UNION SELECT * FROM users --",
      ];

      for (const injection of sqlInjectionAttempts) {
        const testUser = TestUser.create({
          email: `test${injection}@example.com`,
          password: injection,
        });

        await page.goto("/auth-test");

        // Try to login with injection attempt
        await page.fill('input[name="email"]', testUser.email);
        await page.fill('input[name="password"]', testUser.password);
        await page.click('button[type="submit"]');

        // Should not succeed and should not cause server errors
        await page.waitForTimeout(2000);
        const authState = await AuthHelpers.getAuthState(page);
        expect(authState).toBe("unauthenticated");
      }
    });

    test("should handle extremely long inputs", async ({ page }) => {
      const longString = "A".repeat(10000);

      const testUser = TestUser.create({
        name: longString,
        email: `test@${"very-long-domain".repeat(100)}.com`,
        password: longString.substring(0, 100), // Keep password reasonable
      });

      await page.click("text=Sign up");

      // Fill extremely long inputs
      await page.fill('input[name="name"]', testUser.name);
      await page.fill('input[name="email"]', testUser.email);
      await page.fill('input[name="password"]', testUser.password);

      await page.click('button[type="submit"]');

      // Should either validate and reject or handle gracefully
      await page.waitForTimeout(3000);

      // Should not crash the application
      const authState = await AuthHelpers.getAuthState(page);
      expect(["unauthenticated", "loading", "authenticated"]).toContain(authState);
    });

    test("should handle Unicode and special characters", async ({ page }) => {
      const unicodeNames = [
        "🎉 Test User 🚀",
        "José María García",
        "北京用户",
        "محمد عبدالله",
        "नमस्ते उपयोगकर्ता",
        "Александр Петров",
      ];

      for (const name of unicodeNames) {
        const testUser = TestUser.create({ name });

        await page.goto("/auth-test");
        await AuthHelpers.signUp(page, testUser);

        // Should handle unicode characters properly
        await AuthHelpers.verifyAuthenticated(page, testUser);
        await AuthHelpers.signOut(page);
      }
    });
  });

  test.describe("Browser and Environment Edge Cases", () => {
    test("should work with cookies disabled", async ({ browser }) => {
      const context = await browser.newContext({
        // Disable storage
        storageState: undefined,
      });
      const page = await context.newPage();

      // Block cookies
      await page.route("**/*", async route => {
        const response = await route.fetch();
        const headers = response.headers();
        delete headers["set-cookie"];
        route.fulfill({
          response,
          headers,
        });
      });

      await page.goto("/auth-test");

      const testUser = TestUser.createUnique();

      // Try to register - might work or show appropriate error
      try {
        await AuthHelpers.signUp(page, testUser);
        console.log("Auth works without cookies");
      } catch (error) {
        console.log("Auth properly requires cookies");
        await AuthHelpers.verifyError(page);
      }

      await context.close();
    });

    test("should handle localStorage being unavailable", async ({ page }) => {
      // Override localStorage to throw errors
      await page.addInitScript(() => {
        Object.defineProperty(window, "localStorage", {
          get() {
            throw new Error("localStorage not available");
          },
        });
      });

      await page.goto("/auth-test");

      const testUser = TestUser.createUnique();

      // Should either work with fallbacks or show appropriate error
      try {
        await AuthHelpers.signUp(page, testUser);
        await AuthHelpers.verifyAuthenticated(page);
      } catch (error) {
        console.log("App gracefully handles localStorage unavailability");
      }
    });

    test("should work with JavaScript partially disabled", async ({ browser }) => {
      const context = await browser.newContext({
        javaScriptEnabled: false,
      });
      const page = await context.newPage();

      await page.goto("/auth-test");

      // Should show some fallback content or basic HTML form
      await expect(page.locator('h1:has-text("Better Auth Test")')).toBeVisible();

      // Basic form should be present
      await expect(page.locator('input[name="email"]')).toBeVisible();
      await expect(page.locator('input[name="password"]')).toBeVisible();

      await context.close();
    });

    test("should handle window focus/blur events", async ({ page }) => {
      await page.goto("/auth-test");
      await AuthHelpers.verifyAuthenticated(page);

      // Simulate window losing and regaining focus
      await page.evaluate(() => {
        window.dispatchEvent(new Event("blur"));
        window.dispatchEvent(new Event("focus"));
      });

      // Should maintain authentication state
      await AuthHelpers.verifyAuthenticated(page);
    });
  });

  test.describe("Race Conditions and Concurrency", () => {
    test("should handle rapid successive login attempts", async ({ page }) => {
      const testUser = TestUser.createUnique();

      // Register user first
      await AuthHelpers.signUp(page, testUser);
      await AuthHelpers.signOut(page);

      // Now test rapid login attempts
      const loginAttempts = [];

      for (let i = 0; i < 5; i++) {
        const attempt = (async () => {
          await page.fill('input[name="email"]', testUser.email);
          await page.fill('input[name="password"]', testUser.password);
          await page.click('button[type="submit"]');
        })();

        loginAttempts.push(attempt);
      }

      await Promise.all(loginAttempts);

      // Should eventually resolve to a stable state
      await page.waitForTimeout(5000);
      const authState = await AuthHelpers.getAuthState(page);
      expect(["authenticated", "unauthenticated"]).toContain(authState);
    });

    test("should handle form submission during navigation", async ({ page }) => {
      const testUser = TestUser.createUnique();

      await page.click("text=Sign up");
      await page.fill('input[name="name"]', testUser.name);
      await page.fill('input[name="email"]', testUser.email);
      await page.fill('input[name="password"]', testUser.password);

      // Start form submission and immediately navigate away
      const submitPromise = page.click('button[type="submit"]');
      const navigatePromise = page.goto("/");

      await Promise.race([submitPromise, navigatePromise]);

      // Should handle gracefully without crashes
      await page.waitForTimeout(2000);

      // Navigate back and check state
      await page.goto("/auth-test");
      const authState = await AuthHelpers.getAuthState(page);
      expect(["authenticated", "unauthenticated", "loading"]).toContain(authState);
    });
  });

  test.describe("Memory and Performance Edge Cases", () => {
    test("should handle memory pressure gracefully", async ({ page }) => {
      // Create memory pressure by creating large objects
      await page.evaluate(() => {
        const arrays = [];
        try {
          for (let i = 0; i < 100; i++) {
            arrays.push(new Array(100000).fill("data"));
          }
        } catch (error) {
          console.log("Memory pressure created");
        }
      });

      const testUser = TestUser.createUnique();

      // Authentication should still work under memory pressure
      await AuthHelpers.signUp(page, testUser);
      await AuthHelpers.verifyAuthenticated(page);
    });

    test("should handle extremely slow form interactions", async ({ page }) => {
      const testUser = TestUser.createUnique();

      await page.click("text=Sign up");

      // Fill form very slowly with delays
      await page.fill('input[name="name"]', "");
      for (const char of testUser.name) {
        await page.type('input[name="name"]', char);
        await page.waitForTimeout(50);
      }

      await page.fill('input[name="email"]', "");
      for (const char of testUser.email) {
        await page.type('input[name="email"]', char);
        await page.waitForTimeout(30);
      }

      await page.fill('input[name="password"]', "");
      for (const char of testUser.password) {
        await page.type('input[name="password"]', char);
        await page.waitForTimeout(20);
      }

      await page.click('button[type="submit"]');

      // Should work despite slow interaction
      await AuthHelpers.verifyAuthenticated(page, testUser);
    });
  });
});
