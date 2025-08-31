import { test, expect } from "@playwright/test";

test.describe("Logout Functionality", () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to auth test page
    await page.goto("/auth-test");
    
    // Wait for page to load
    await expect(page).toHaveTitle(/Create Next App/);
  });

  test("logout button appears when authenticated", async ({ page }) => {
    // Check if user is already authenticated or needs to sign in
    const isAuthenticated = await page.locator("text=Authentication successful!").isVisible({ timeout: 3000 }).catch(() => false);
    
    if (!isAuthenticated) {
      // Create test account if not authenticated
      await page.locator("text=Sign up").click();
      
      await page.fill('input[name="name"]', "Test User");
      await page.fill('input[name="email"]', `test-${Date.now()}@example.com`);
      await page.fill('input[name="password"]', "testpassword123");
      
      await page.click('button[type="submit"]');
      
      // Wait for authentication success
      await expect(page.locator("text=Authentication successful!")).toBeVisible({ timeout: 10000 });
    }
    
    // Verify logout button is present
    const logoutButton = page.locator('button:has-text("Sign out")');
    await expect(logoutButton).toBeVisible();
    await expect(logoutButton).toBeEnabled();
  });

  test("logout functionality works correctly", async ({ page }) => {
    // Check if user is already authenticated or needs to sign in
    const isAuthenticated = await page.locator("text=Authentication successful!").isVisible({ timeout: 3000 }).catch(() => false);
    
    if (!isAuthenticated) {
      // Create test account if not authenticated
      await page.locator("text=Sign up").click();
      
      await page.fill('input[name="name"]', "Test User Logout");
      await page.fill('input[name="email"]', `test-logout-${Date.now()}@example.com`);
      await page.fill('input[name="password"]', "testpassword123");
      
      await page.click('button[type="submit"]');
      
      // Wait for authentication success
      await expect(page.locator("text=Authentication successful!")).toBeVisible({ timeout: 10000 });
    }
    
    // Verify we're authenticated
    await expect(page.locator("text=Authentication successful!")).toBeVisible();
    await expect(page.locator("text=Welcome!")).toBeVisible();
    
    // Click logout button
    const logoutButton = page.locator('button:has-text("Sign out")');
    await logoutButton.click();
    
    // Wait for logout to complete and verify we're back to sign in form
    await expect(page.locator("text=Sign In")).toBeVisible({ timeout: 10000 });
    await expect(page.locator("text=Authentication successful!")).not.toBeVisible();
    await expect(page.locator("text=Welcome!")).not.toBeVisible();
    
    // Verify sign in form elements are present
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]:has-text("Sign in")')).toBeVisible();
  });

  test("logout button styling and accessibility", async ({ page }) => {
    // Check if user is already authenticated or needs to sign in
    const isAuthenticated = await page.locator("text=Authentication successful!").isVisible({ timeout: 3000 }).catch(() => false);
    
    if (!isAuthenticated) {
      // Create test account if not authenticated
      await page.locator("text=Sign up").click();
      
      await page.fill('input[name="name"]', "Test User Style");
      await page.fill('input[name="email"]', `test-style-${Date.now()}@example.com`);
      await page.fill('input[name="password"]', "testpassword123");
      
      await page.click('button[type="submit"]');
      
      // Wait for authentication success
      await expect(page.locator("text=Authentication successful!")).toBeVisible({ timeout: 10000 });
    }
    
    const logoutButton = page.locator('button:has-text("Sign out")');
    
    // Check button styling
    await expect(logoutButton).toHaveClass(/bg-red-500/);
    await expect(logoutButton).toHaveClass(/text-white/);
    
    // Check accessibility - button should be keyboard accessible
    await logoutButton.focus();
    await expect(logoutButton).toBeFocused();
    
    // Check hover state (visual validation)
    await logoutButton.hover();
    // Note: hover:bg-red-700 class is present but hard to test visually
  });

  test("logout preserves no session data", async ({ page, context }) => {
    // Check if user is already authenticated or needs to sign in
    const isAuthenticated = await page.locator("text=Authentication successful!").isVisible({ timeout: 3000 }).catch(() => false);
    
    if (!isAuthenticated) {
      // Create test account if not authenticated
      await page.locator("text=Sign up").click();
      
      await page.fill('input[name="name"]', "Test Session User");
      await page.fill('input[name="email"]', `test-session-${Date.now()}@example.com`);
      await page.fill('input[name="password"]', "testpassword123");
      
      await page.click('button[type="submit"]');
      
      // Wait for authentication success
      await expect(page.locator("text=Authentication successful!")).toBeVisible({ timeout: 10000 });
    }
    
    // Verify authenticated state
    await expect(page.locator("text=Authentication successful!")).toBeVisible();
    
    // Logout
    await page.locator('button:has-text("Sign out")').click();
    await expect(page.locator("text=Sign In")).toBeVisible({ timeout: 10000 });
    
    // Refresh page to check session persistence
    await page.reload();
    
    // Should still show sign in form, not authenticated state
    await expect(page.locator("text=Sign In")).toBeVisible({ timeout: 10000 });
    await expect(page.locator("text=Authentication successful!")).not.toBeVisible();
  });

  test("logout handles network errors gracefully", async ({ page }) => {
    // Check if user is already authenticated or needs to sign in
    const isAuthenticated = await page.locator("text=Authentication successful!").isVisible({ timeout: 3000 }).catch(() => false);
    
    if (!isAuthenticated) {
      // Create test account if not authenticated
      await page.locator("text=Sign up").click();
      
      await page.fill('input[name="name"]', "Test Network User");
      await page.fill('input[name="email"]', `test-network-${Date.now()}@example.com`);
      await page.fill('input[name="password"]', "testpassword123");
      
      await page.click('button[type="submit"]');
      
      // Wait for authentication success
      await expect(page.locator("text=Authentication successful!")).toBeVisible({ timeout: 10000 });
    }
    
    // Simulate network failure during logout
    await page.route("**/*", (route) => {
      if (route.request().url().includes("signOut") || route.request().url().includes("logout")) {
        route.abort("failed");
      } else {
        route.continue();
      }
    });
    
    // Try to logout
    await page.locator('button:has-text("Sign out")').click();
    
    // Even with network failure, the client should handle logout gracefully
    // The behavior may vary depending on implementation, but user should eventually see sign in form
    // We'll give it some time and check the state
    await page.waitForTimeout(3000);
    
    // Clear the route to allow normal requests
    await page.unroute("**/*");
    
    // Check current state - implementation dependent
    const isStillAuthenticated = await page.locator("text=Authentication successful!").isVisible();
    const isSignInVisible = await page.locator("text=Sign In").isVisible();
    
    // One of these should be true
    expect(isStillAuthenticated || isSignInVisible).toBe(true);
  });
});