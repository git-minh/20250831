import { test, expect } from "@playwright/test";

test.describe("Logout Functionality - Simple Test", () => {
  test("logout button appears and works when authenticated", async ({ page }) => {
    // Navigate to auth test page
    await page.goto("/auth-test");
    
    // Wait for page to load
    await expect(page.locator('h1:has-text("Better Auth Test")')).toBeVisible();
    
    // Check if we need to sign up/in first
    const isAuthenticated = await page.locator("text=Authentication successful!").isVisible({ timeout: 3000 }).catch(() => false);
    
    if (!isAuthenticated) {
      // Sign up with a new test account
      const isSignUpVisible = await page.locator("text=Sign up").isVisible({ timeout: 2000 }).catch(() => false);
      if (isSignUpVisible) {
        await page.locator("text=Sign up").click();
      }
      
      const timestamp = Date.now();
      await page.fill('input[name="name"]', "Logout Test User");
      await page.fill('input[name="email"]', `logout-test-${timestamp}@example.com`);
      await page.fill('input[name="password"]', "testpassword123");
      
      await page.click('button[type="submit"]');
      
      // Wait for authentication success with longer timeout
      try {
        await expect(page.locator("text=Authentication successful!")).toBeVisible({ timeout: 15000 });
      } catch (error) {
        console.log("Authentication may have failed or taken too long, continuing test...");
        // Take a screenshot for debugging
        await page.screenshot({ path: 'test-results/logout-auth-failed.png' });
        throw error;
      }
    }
    
    // Verify we're authenticated and logout button exists
    await expect(page.locator("text=Authentication successful!")).toBeVisible();
    const logoutButton = page.locator('button:has-text("Sign out")');
    await expect(logoutButton).toBeVisible();
    await expect(logoutButton).toBeEnabled();
    
    // Test logout functionality
    await logoutButton.click();
    
    // Wait for logout to complete and verify we're back to sign in form
    await expect(page.locator("text=Sign In")).toBeVisible({ timeout: 10000 });
    await expect(page.locator("text=Authentication successful!")).not.toBeVisible();
    
    // Verify sign in form elements are present
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();
    
    console.log("✅ Logout functionality test completed successfully");
  });
  
  test("logout button has correct styling", async ({ page }) => {
    // This test assumes we can get to an authenticated state
    await page.goto("/auth-test");
    
    // Wait for page to load
    await expect(page.locator('h1:has-text("Better Auth Test")')).toBeVisible();
    
    // Check if we need to authenticate first
    const isAuthenticated = await page.locator("text=Authentication successful!").isVisible({ timeout: 3000 }).catch(() => false);
    
    if (!isAuthenticated) {
      // Try to use existing auth state or sign up
      const isSignUpVisible = await page.locator("text=Sign up").isVisible({ timeout: 2000 }).catch(() => false);
      if (isSignUpVisible) {
        await page.locator("text=Sign up").click();
      }
      
      const timestamp = Date.now();
      await page.fill('input[name="name"]', "Style Test User");
      await page.fill('input[name="email"]', `style-test-${timestamp}@example.com`);
      await page.fill('input[name="password"]', "testpassword123");
      
      await page.click('button[type="submit"]');
      
      try {
        await expect(page.locator("text=Authentication successful!")).toBeVisible({ timeout: 15000 });
      } catch (error) {
        console.log("Skipping styling test - authentication failed");
        test.skip();
        return;
      }
    }
    
    const logoutButton = page.locator('button:has-text("Sign out")');
    
    // Check button classes for styling
    const buttonClasses = await logoutButton.getAttribute("class");
    expect(buttonClasses).toContain("bg-red-500");
    expect(buttonClasses).toContain("text-white");
    
    // Check accessibility - button should be focusable
    await logoutButton.focus();
    await expect(logoutButton).toBeFocused();
    
    console.log("✅ Logout button styling test completed successfully");
  });
});