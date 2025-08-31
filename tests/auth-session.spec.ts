import { test, expect } from '@playwright/test';
import { TestUser } from './utils/test-data';
import { AuthHelpers } from './utils/auth-helpers';

/**
 * Session Management Tests
 * Tests login, logout, and session persistence functionality.
 */

test.describe('Authentication Session Management', () => {
  
  test.describe('User Login (Unauthenticated)', () => {
    // Use a fresh context without stored auth state
    test.use({ storageState: { cookies: [], origins: [] } });
    
    test('should login existing user with correct credentials', async ({ page }) => {
      // First create a user to login with
      const testUser = TestUser.createUnique();
      
      await page.goto('/auth-test');
      await AuthHelpers.signUp(page, testUser);
      await AuthHelpers.verifyAuthenticated(page, testUser);
      
      // Sign out
      await AuthHelpers.signOut(page);
      await AuthHelpers.verifyUnauthenticated(page);
      
      // Now test login
      await AuthHelpers.signIn(page, testUser);
      await AuthHelpers.verifyAuthenticated(page, testUser);
    });
    
    test('should show error for invalid credentials', async ({ page }) => {
      const testUser = TestUser.createUnique();
      
      await page.goto('/auth-test');
      
      // Try to login with non-existent user
      await page.fill('input[name="email"]', testUser.email);
      await page.fill('input[name="password"]', testUser.password);
      await page.click('button[type="submit"]');
      
      // Should show error
      await AuthHelpers.verifyError(page);
      
      // Should remain unauthenticated
      await AuthHelpers.verifyUnauthenticated(page);
    });
    
    test('should show error for wrong password', async ({ page }) => {
      // Create a user first
      const testUser = TestUser.createUnique();
      
      await page.goto('/auth-test');
      await AuthHelpers.signUp(page, testUser);
      await AuthHelpers.signOut(page);
      
      // Try to login with wrong password
      await page.fill('input[name="email"]', testUser.email);
      await page.fill('input[name="password"]', 'WrongPassword123!');
      await page.click('button[type="submit"]');
      
      // Should show error
      await AuthHelpers.verifyError(page);
      await AuthHelpers.verifyUnauthenticated(page);
    });
    
    test('should preserve email when switching between forms', async ({ page }) => {
      const testUser = TestUser.createUnique();
      
      await page.goto('/auth-test');
      
      // Fill email in sign in form
      await page.fill('input[name="email"]', testUser.email);
      
      // Switch to sign up
      await page.click('text=Sign up');
      
      // Email should be preserved
      await expect(page.locator('input[name="email"]')).toHaveValue(testUser.email);
      
      // Switch back to sign in
      await page.click('text=Sign in');
      
      // Email should still be preserved
      await expect(page.locator('input[name="email"]')).toHaveValue(testUser.email);
    });
    
    test('should handle rapid form submissions gracefully', async ({ page }) => {
      const testUser = TestUser.createUnique();
      
      await page.goto('/auth-test');
      await page.fill('input[name="email"]', testUser.email);
      await page.fill('input[name="password"]', testUser.password);
      
      // Click submit multiple times rapidly
      await Promise.all([
        page.click('button[type="submit"]'),
        page.click('button[type="submit"]'),
        page.click('button[type="submit"]'),
      ]);
      
      // Should handle gracefully (likely with an error message)
      await page.waitForTimeout(2000);
      
      // Should either show error or remain in loading state
      const authState = await AuthHelpers.getAuthState(page);
      expect(['unauthenticated', 'loading']).toContain(authState);
    });
  });
  
  test.describe('User Logout (Authenticated)', () => {
    // These tests use the authenticated state from setup
    
    test('should successfully log out authenticated user', async ({ page }) => {
      await page.goto('/auth-test');
      
      // Verify we start authenticated
      await AuthHelpers.verifyAuthenticated(page);
      
      // Click logout
      await AuthHelpers.signOut(page);
      
      // Verify we're now unauthenticated
      await AuthHelpers.verifyUnauthenticated(page);
    });
    
    test('should clear user data on logout', async ({ page }) => {
      await page.goto('/auth-test');
      await AuthHelpers.verifyAuthenticated(page);
      
      // Note the user data visible
      const userEmail = await page.locator('text=/Email: .+/').textContent();
      const userName = await page.locator('text=/Name: .+/').textContent();
      
      // Logout
      await AuthHelpers.signOut(page);
      
      // Verify user data is no longer visible
      if (userEmail) await expect(page.locator(`text=${userEmail}`)).not.toBeVisible();
      if (userName) await expect(page.locator(`text=${userName}`)).not.toBeVisible();
    });
    
    test('should handle logout during loading gracefully', async ({ page }) => {
      await page.goto('/auth-test');
      
      // Wait for auth to load
      await AuthHelpers.waitForAuthLoad(page);
      await AuthHelpers.verifyAuthenticated(page);
      
      // Trigger logout
      await page.click('text=Sign out');
      
      // Should successfully log out
      await AuthHelpers.verifyUnauthenticated(page);
    });
  });
  
  test.describe('Session Persistence', () => {
    
    test('should maintain authentication across page refreshes', async ({ page }) => {
      await page.goto('/auth-test');
      await AuthHelpers.verifyAuthenticated(page);
      
      // Reload the page
      await page.reload();
      await AuthHelpers.waitForAuthLoad(page);
      
      // Should still be authenticated
      await AuthHelpers.verifyAuthenticated(page);
    });
    
    test('should maintain authentication across navigation', async ({ page }) => {
      await page.goto('/auth-test');
      await AuthHelpers.verifyAuthenticated(page);
      
      // Navigate to home page
      await page.goto('/');
      
      // Navigate back to auth test
      await page.goto('/auth-test');
      await AuthHelpers.waitForAuthLoad(page);
      
      // Should still be authenticated
      await AuthHelpers.verifyAuthenticated(page);
    });
    
    test('should handle browser back/forward navigation', async ({ page }) => {
      await page.goto('/auth-test');
      await AuthHelpers.verifyAuthenticated(page);
      
      // Navigate to home
      await page.goto('/');
      
      // Go back
      await page.goBack();
      await AuthHelpers.waitForAuthLoad(page);
      
      // Should still be authenticated
      await AuthHelpers.verifyAuthenticated(page);
      
      // Go forward
      await page.goForward();
      
      // Go back again
      await page.goBack();
      await AuthHelpers.waitForAuthLoad(page);
      
      // Should still be authenticated
      await AuthHelpers.verifyAuthenticated(page);
    });
    
    test('should persist user preferences across sessions', async ({ page }) => {
      await page.goto('/auth-test');
      await AuthHelpers.verifyAuthenticated(page);
      
      // Note current preferences
      await expect(page.locator('text=Theme: system')).toBeVisible();
      await expect(page.locator('text=Notifications: Enabled')).toBeVisible();
      await expect(page.locator('text=Language: en')).toBeVisible();
      
      // Reload page
      await page.reload();
      await AuthHelpers.waitForAuthLoad(page);
      
      // Preferences should still be there
      await expect(page.locator('text=Theme: system')).toBeVisible();
      await expect(page.locator('text=Notifications: Enabled')).toBeVisible();
      await expect(page.locator('text=Language: en')).toBeVisible();
    });
  });
  
  test.describe('Multiple Tabs/Windows', () => {
    
    test('should maintain authentication across multiple tabs', async ({ browser }) => {
      const context = await browser.newContext({ 
        storageState: 'tests/auth/.auth/user.json' 
      });
      
      // Open first tab
      const page1 = await context.newPage();
      await page1.goto('/auth-test');
      await AuthHelpers.verifyAuthenticated(page1);
      
      // Open second tab
      const page2 = await context.newPage();
      await page2.goto('/auth-test');
      await AuthHelpers.verifyAuthenticated(page2);
      
      // Logout from first tab
      await AuthHelpers.signOut(page1);
      
      // Second tab should also become unauthenticated (eventually)
      await page2.reload();
      await AuthHelpers.waitForAuthLoad(page2);
      
      const authState = await AuthHelpers.getAuthState(page2);
      expect(['unauthenticated', 'loading']).toContain(authState);
      
      await context.close();
    });
    
    test('should sync authentication state across tabs', async ({ browser }) => {
      // Start with unauthenticated context
      const context = await browser.newContext();
      
      const page1 = await context.newPage();
      const page2 = await context.newPage();
      
      // Both tabs should be unauthenticated
      await page1.goto('/auth-test');
      await page2.goto('/auth-test');
      
      await AuthHelpers.verifyUnauthenticated(page1);
      await AuthHelpers.verifyUnauthenticated(page2);
      
      // Login in first tab
      const testUser = TestUser.createUnique();
      await AuthHelpers.signUp(page1, testUser);
      await AuthHelpers.verifyAuthenticated(page1);
      
      // Refresh second tab - should now be authenticated
      await page2.reload();
      await AuthHelpers.waitForAuthLoad(page2);
      
      const authState = await AuthHelpers.getAuthState(page2);
      expect(['authenticated', 'loading']).toContain(authState);
      
      await context.close();
    });
  });
  
  test.describe('Loading States and Transitions', () => {
    
    test('should show appropriate loading states', async ({ page }) => {
      await page.goto('/auth-test');
      
      // Check that loading state appears initially
      await Promise.race([
        expect(page.locator('text=Loading...')).toBeVisible({ timeout: 1000 }),
        AuthHelpers.waitForAuthLoad(page),
      ]);
      
      // Eventually should resolve to authenticated state
      await AuthHelpers.verifyAuthenticated(page);
    });
    
    test('should handle slow network conditions gracefully', async ({ page }) => {
      // Simulate slow network
      await page.route('**/*', async route => {
        await new Promise(resolve => setTimeout(resolve, 100));
        route.continue();
      });
      
      await page.goto('/auth-test');
      
      // Should eventually load
      await AuthHelpers.waitForAuthLoad(page);
      await AuthHelpers.verifyAuthenticated(page);
    });
  });
});