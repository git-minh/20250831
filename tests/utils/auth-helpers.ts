import { Page, expect, Locator } from "@playwright/test";
import { ITestUser } from "./test-data";

/**
 * Authentication helper utilities for Playwright tests
 */
export class AuthHelpers {
  /**
   * Sign up a new user via the UI
   */
  static async signUp(page: Page, user: ITestUser): Promise<void> {
    await page.goto("/auth-test");

    // Switch to sign up mode if needed
    const signUpButton = page.locator("text=Sign up");
    if (await signUpButton.isVisible()) {
      await signUpButton.click();
    }

    // Fill the form
    await page.fill('input[name="name"]', user.name);
    await page.fill('input[name="email"]', user.email);
    await page.fill('input[name="password"]', user.password);

    // Submit
    await page.click('button[type="submit"]');

    // Wait for success
    await expect(page.locator("text=Authentication successful!")).toBeVisible({ timeout: 10000 });
  }

  /**
   * Sign in an existing user via the UI
   */
  static async signIn(page: Page, user: ITestUser): Promise<void> {
    await page.goto("/auth-test");

    // Ensure we're in sign in mode
    const signInText = page.locator('h2:has-text("Sign In")');
    if (!(await signInText.isVisible())) {
      await page.click("text=Sign in");
    }

    // Fill the form
    await page.fill('input[name="email"]', user.email);
    await page.fill('input[name="password"]', user.password);

    // Submit
    await page.click('button[type="submit"]');

    // Wait for success
    await expect(page.locator("text=Authentication successful!")).toBeVisible({ timeout: 10000 });
  }

  /**
   * Sign out the current user
   */
  static async signOut(page: Page): Promise<void> {
    await page.click("text=Sign out");

    // Wait for sign in form to appear
    await expect(page.locator('h2:has-text("Sign In")')).toBeVisible({ timeout: 5000 });
  }

  /**
   * Verify user is authenticated and profile is displayed
   */
  static async verifyAuthenticated(page: Page, user?: ITestUser): Promise<void> {
    await expect(page.locator("text=Authentication successful!")).toBeVisible();

    if (user) {
      await expect(page.locator(`text=${user.email}`)).toBeVisible();
      await expect(page.locator(`text=${user.name}`)).toBeVisible();
    }

    // Verify preferences are displayed
    await expect(page.locator("text=Theme:")).toBeVisible();
    await expect(page.locator("text=Notifications:")).toBeVisible();
    await expect(page.locator("text=Language:")).toBeVisible();
  }

  /**
   * Verify user is not authenticated (sign in form is shown)
   */
  static async verifyUnauthenticated(page: Page): Promise<void> {
    await expect(page.locator('h2:has-text("Sign In")')).toBeVisible();
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();
  }

  /**
   * Wait for loading state to complete
   */
  static async waitForAuthLoad(page: Page): Promise<void> {
    // Wait for either auth success or sign in form
    await Promise.race([
      page.waitForSelector("text=Authentication successful!", { timeout: 10000 }),
      page.waitForSelector('h2:has-text("Sign In")', { timeout: 10000 }),
    ]);
  }

  /**
   * Verify error message is displayed
   */
  static async verifyError(page: Page, expectedError?: string): Promise<void> {
    const errorDiv = page.locator(".bg-red-100");
    await expect(errorDiv).toBeVisible();

    if (expectedError) {
      await expect(errorDiv).toContainText(expectedError);
    }
  }

  /**
   * Clear all form fields
   */
  static async clearForm(page: Page): Promise<void> {
    await page.fill('input[name="name"]', "");
    await page.fill('input[name="email"]', "");
    await page.fill('input[name="password"]', "");
  }

  /**
   * Get the current authentication state from the page
   */
  static async getAuthState(page: Page): Promise<"authenticated" | "unauthenticated" | "loading"> {
    // Check for loading state
    const loadingSpinner = page.locator(".animate-spin");
    if (await loadingSpinner.isVisible()) {
      return "loading";
    }

    // Check for authenticated state
    const authSuccess = page.locator("text=Authentication successful!");
    if (await authSuccess.isVisible()) {
      return "authenticated";
    }

    // Check for unauthenticated state
    const signInForm = page.locator('h2:has-text("Sign In")');
    if (await signInForm.isVisible()) {
      return "unauthenticated";
    }

    // Default to loading if unclear
    return "loading";
  }
}
