import { test, expect } from "@playwright/test";

// Run this test without auth setup dependencies
test.describe("Logout Functionality - Standalone", () => {
  test.use({
    // Don't use any auth setup
    storageState: undefined
  });

  test("manual logout test", async ({ page }) => {
    // Navigate directly to the auth test page
    await page.goto("http://localhost:3000/auth-test");
    
    // Wait for the page to load
    await expect(page.locator('h1:has-text("Better Auth Test")')).toBeVisible({ timeout: 10000 });
    
    // Check current state - if already authenticated, test logout directly
    const authSuccessVisible = await page.locator("text=Authentication successful!").isVisible({ timeout: 2000 }).catch(() => false);
    const signInVisible = await page.locator("text=Sign In").isVisible({ timeout: 2000 }).catch(() => false);
    
    console.log(`Auth success visible: ${authSuccessVisible}`);
    console.log(`Sign in visible: ${signInVisible}`);
    
    if (authSuccessVisible) {
      // Already authenticated, test logout
      console.log("Already authenticated, testing logout...");
      
      const logoutButton = page.locator('button:has-text("Sign out")');
      await expect(logoutButton).toBeVisible();
      await logoutButton.click();
      
      // Verify logout worked
      await expect(page.locator("text=Sign In")).toBeVisible({ timeout: 10000 });
      await expect(page.locator("text=Authentication successful!")).not.toBeVisible();
      
      console.log("✅ Logout test completed successfully!");
      
    } else if (signInVisible) {
      // Need to authenticate first, then test logout
      console.log("Not authenticated, signing up first...");
      
      // Click "Sign up" if visible
      const signUpButton = page.locator("text=Sign up");
      const isSignUpVisible = await signUpButton.isVisible({ timeout: 2000 }).catch(() => false);
      if (isSignUpVisible) {
        await signUpButton.click();
      }
      
      // Fill the form
      const timestamp = Date.now();
      await page.fill('input[name="name"]', "Logout Test User");
      await page.fill('input[name="email"]', `logout-test-${timestamp}@example.com`);
      await page.fill('input[name="password"]', "testpassword123");
      
      // Submit the form
      await page.click('button[type="submit"]');
      
      // Wait for authentication - give it extra time
      try {
        await expect(page.locator("text=Authentication successful!")).toBeVisible({ timeout: 20000 });
        console.log("✅ Authentication successful!");
        
        // Now test logout
        const logoutButton = page.locator('button:has-text("Sign out")');
        await expect(logoutButton).toBeVisible();
        await logoutButton.click();
        
        // Verify logout worked
        await expect(page.locator("text=Sign In")).toBeVisible({ timeout: 10000 });
        await expect(page.locator("text=Authentication successful!")).not.toBeVisible();
        
        console.log("✅ Logout test completed successfully!");
        
      } catch (error) {
        console.log("❌ Authentication failed or timed out");
        // Take a screenshot for debugging
        await page.screenshot({ path: 'test-results/auth-debug.png', fullPage: true });
        
        // Check what's actually on the page
        const pageContent = await page.locator("body").textContent();
        console.log("Current page content:", pageContent?.substring(0, 500));
        
        throw error;
      }
      
    } else {
      console.log("❌ Unexpected page state - neither authenticated nor showing sign in");
      await page.screenshot({ path: 'test-results/unexpected-state.png', fullPage: true });
      throw new Error("Unexpected page state");
    }
  });
});