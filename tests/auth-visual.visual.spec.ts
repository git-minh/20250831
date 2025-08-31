import { test, expect } from "@playwright/test";
import { TestUser } from "./utils/test-data";
import { AuthHelpers } from "./utils/auth-helpers";

/**
 * Visual Regression Tests
 * Tests the visual appearance and layout of authentication components.
 */

test.describe("Authentication Visual Tests", () => {
  test.describe("Sign In Form", () => {
    test("should match sign in form screenshot", async ({ page }) => {
      await page.goto("/auth-test");
      await AuthHelpers.waitForAuthLoad(page);

      // Ensure we're in sign in mode
      await AuthHelpers.verifyUnauthenticated(page);

      // Take screenshot of sign in form
      await expect(page.locator(".max-w-md")).toHaveScreenshot("sign-in-form.png");
    });

    test("should match sign in form with validation errors", async ({ page }) => {
      await page.goto("/auth-test");

      // Try to submit empty form to trigger validation
      await page.click('button[type="submit"]');

      // Wait a moment for any validation states
      await page.waitForTimeout(500);

      await expect(page.locator(".max-w-md")).toHaveScreenshot("sign-in-form-validation.png");
    });

    test("should match sign in form loading state", async ({ page }) => {
      // Slow down auth requests to capture loading state
      await page.route("**/api/auth/**", async route => {
        await new Promise(resolve => setTimeout(resolve, 2000));
        route.continue();
      });

      await page.goto("/auth-test");

      const testUser = TestUser.createUnique();
      await page.fill('input[name="email"]', testUser.email);
      await page.fill('input[name="password"]', testUser.password);

      // Submit form
      await page.click('button[type="submit"]');

      // Capture loading state
      await expect(page.locator('button:has-text("Please wait")')).toBeVisible({ timeout: 1000 });
      await expect(page.locator(".max-w-md")).toHaveScreenshot("sign-in-form-loading.png");
    });
  });

  test.describe("Sign Up Form", () => {
    test("should match sign up form screenshot", async ({ page }) => {
      await page.goto("/auth-test");
      await AuthHelpers.waitForAuthLoad(page);

      // Switch to sign up mode
      await page.click("text=Sign up");
      await expect(page.locator('h2:has-text("Sign Up")')).toBeVisible();

      // Take screenshot of sign up form
      await expect(page.locator(".max-w-md")).toHaveScreenshot("sign-up-form.png");
    });

    test("should match form toggle animation", async ({ page }) => {
      await page.goto("/auth-test");
      await AuthHelpers.waitForAuthLoad(page);

      // Take screenshot of sign in form
      await expect(page.locator(".max-w-md")).toHaveScreenshot("form-toggle-signin.png");

      // Switch to sign up
      await page.click("text=Sign up");
      await page.waitForTimeout(300); // Wait for any animations

      // Take screenshot of sign up form
      await expect(page.locator(".max-w-md")).toHaveScreenshot("form-toggle-signup.png");
    });
  });

  test.describe("Authenticated State", () => {
    test("should match authenticated dashboard", async ({ page }) => {
      await page.goto("/auth-test");
      await AuthHelpers.verifyAuthenticated(page);

      // Take screenshot of authenticated state
      await expect(page.locator(".space-y-4")).toHaveScreenshot("authenticated-dashboard.png");
    });

    test("should match user profile display", async ({ page }) => {
      await page.goto("/auth-test");
      await AuthHelpers.verifyAuthenticated(page);

      // Focus on user profile section
      await expect(page.locator(".bg-white.shadow-md")).toHaveScreenshot("user-profile-card.png");
    });

    test("should match success message", async ({ page }) => {
      await page.goto("/auth-test");
      await AuthHelpers.verifyAuthenticated(page);

      // Focus on success banner
      await expect(page.locator(".bg-green-100")).toHaveScreenshot("success-banner.png");
    });
  });

  test.describe("Error States", () => {
    test("should match error message display", async ({ page }) => {
      await page.goto("/auth-test");

      // Trigger an error by trying to login with invalid credentials
      await page.fill('input[name="email"]', "invalid@example.com");
      await page.fill('input[name="password"]', "wrongpassword");
      await page.click('button[type="submit"]');

      // Wait for error message
      await AuthHelpers.verifyError(page);

      // Take screenshot of error state
      await expect(page.locator(".max-w-md")).toHaveScreenshot("error-message.png");
    });
  });

  test.describe("Responsive Design", () => {
    test("should match mobile viewport - sign in", async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 }); // iPhone SE

      await page.goto("/auth-test");
      await AuthHelpers.waitForAuthLoad(page);

      await expect(page).toHaveScreenshot("mobile-sign-in.png", { fullPage: true });
    });

    test("should match mobile viewport - sign up", async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 }); // iPhone SE

      await page.goto("/auth-test");
      await page.click("text=Sign up");

      await expect(page).toHaveScreenshot("mobile-sign-up.png", { fullPage: true });
    });

    test("should match mobile viewport - authenticated", async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 }); // iPhone SE

      await page.goto("/auth-test");
      await AuthHelpers.verifyAuthenticated(page);

      await expect(page).toHaveScreenshot("mobile-authenticated.png", { fullPage: true });
    });

    test("should match tablet viewport", async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 }); // iPad

      await page.goto("/auth-test");
      await AuthHelpers.waitForAuthLoad(page);

      await expect(page).toHaveScreenshot("tablet-view.png", { fullPage: true });
    });

    test("should match desktop wide viewport", async ({ page }) => {
      await page.setViewportSize({ width: 1920, height: 1080 }); // Desktop

      await page.goto("/auth-test");
      await AuthHelpers.waitForAuthLoad(page);

      await expect(page).toHaveScreenshot("desktop-wide-view.png", { fullPage: true });
    });
  });

  test.describe("Theme and Styling", () => {
    test("should match component styling consistency", async ({ page }) => {
      await page.goto("/auth-test");
      await AuthHelpers.waitForAuthLoad(page);

      // Test form elements
      const formElements = [
        'input[name="email"]',
        'input[name="password"]',
        'button[type="submit"]',
        "h2",
        ".text-sm",
      ];

      for (const selector of formElements) {
        await expect(page.locator(selector).first()).toHaveScreenshot(
          `element-${selector.replace(/[^a-z0-9]/gi, "-")}.png`
        );
      }
    });

    test("should match focus states", async ({ page }) => {
      await page.goto("/auth-test");
      await AuthHelpers.waitForAuthLoad(page);

      // Focus email input
      await page.focus('input[name="email"]');
      await expect(page.locator('input[name="email"]')).toHaveScreenshot("email-input-focused.png");

      // Focus password input
      await page.focus('input[name="password"]');
      await expect(page.locator('input[name="password"]')).toHaveScreenshot(
        "password-input-focused.png"
      );

      // Focus submit button
      await page.focus('button[type="submit"]');
      await expect(page.locator('button[type="submit"]')).toHaveScreenshot(
        "submit-button-focused.png"
      );
    });

    test("should match hover states", async ({ page }) => {
      await page.goto("/auth-test");
      await AuthHelpers.waitForAuthLoad(page);

      // Hover submit button
      await page.hover('button[type="submit"]');
      await expect(page.locator('button[type="submit"]')).toHaveScreenshot(
        "submit-button-hovered.png"
      );

      // Hover toggle link
      await page.hover("text=Sign up");
      await expect(page.locator("text=Sign up")).toHaveScreenshot("toggle-link-hovered.png");
    });
  });

  test.describe("Accessibility Visual Indicators", () => {
    test("should show proper contrast ratios", async ({ page }) => {
      await page.goto("/auth-test");
      await AuthHelpers.waitForAuthLoad(page);

      // Test with high contrast
      await page.emulateMedia({ forcedColors: "active" });
      await expect(page.locator(".max-w-md")).toHaveScreenshot("high-contrast-mode.png");
    });

    test("should work with increased text size", async ({ page }) => {
      // Simulate user preference for larger text
      await page.addInitScript(() => {
        document.documentElement.style.fontSize = "20px";
      });

      await page.goto("/auth-test");
      await AuthHelpers.waitForAuthLoad(page);

      await expect(page.locator(".max-w-md")).toHaveScreenshot("large-text-mode.png");
    });

    test("should show keyboard navigation indicators", async ({ page }) => {
      await page.goto("/auth-test");
      await AuthHelpers.waitForAuthLoad(page);

      // Navigate with keyboard
      await page.keyboard.press("Tab");
      await expect(page).toHaveScreenshot("keyboard-nav-first-tab.png");

      await page.keyboard.press("Tab");
      await expect(page).toHaveScreenshot("keyboard-nav-second-tab.png");

      await page.keyboard.press("Tab");
      await expect(page).toHaveScreenshot("keyboard-nav-third-tab.png");
    });
  });

  test.describe("Animation and Transitions", () => {
    test("should capture loading spinner animation", async ({ page }) => {
      await page.goto("/auth-test");

      // Look for loading spinner if present
      const spinner = page.locator(".animate-spin");
      if (await spinner.isVisible()) {
        await expect(spinner).toHaveScreenshot("loading-spinner.png");
      }
    });

    test("should capture form transition states", async ({ page }) => {
      await page.goto("/auth-test");
      await AuthHelpers.waitForAuthLoad(page);

      // Capture before transition
      await expect(page.locator(".max-w-md")).toHaveScreenshot("before-transition.png");

      // Trigger transition
      await page.click("text=Sign up");

      // Capture after transition (with small delay for animation)
      await page.waitForTimeout(200);
      await expect(page.locator(".max-w-md")).toHaveScreenshot("after-transition.png");
    });
  });
});
