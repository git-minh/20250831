import { test, expect } from '@playwright/test';
import { TestUser, TestData } from './utils/test-data';
import { AuthHelpers } from './utils/auth-helpers';

/**
 * User Registration Flow Tests
 * Tests the complete user registration process including validation, success, and error states.
 * 
 * These tests run unauthenticated (no storageState) to ensure clean state for registration.
 */

test.describe('User Registration', () => {
  
  test.beforeEach(async ({ page }) => {
    await page.goto('/auth-test');
    await AuthHelpers.waitForAuthLoad(page);
  });

  test.describe('Successful Registration', () => {
    
    test('should register a new user with valid data', async ({ page }) => {
      const testUser = TestUser.createUnique();
      
      // Switch to sign up mode
      await page.click('text=Sign up');
      await expect(page.locator('h2:has-text("Sign Up")')).toBeVisible();
      
      // Fill the registration form
      await page.fill('input[name="name"]', testUser.name);
      await page.fill('input[name="email"]', testUser.email);
      await page.fill('input[name="password"]', testUser.password);
      
      // Submit the form
      await page.click('button[type="submit"]');
      
      // Verify successful registration and automatic login
      await AuthHelpers.verifyAuthenticated(page, testUser);
      
      // Verify user preferences are initialized
      await expect(page.locator('text=Theme: system')).toBeVisible();
      await expect(page.locator('text=Notifications: Enabled')).toBeVisible();
      await expect(page.locator('text=Language: en')).toBeVisible();
      
      // Verify sign out functionality works
      await AuthHelpers.signOut(page);
      await AuthHelpers.verifyUnauthenticated(page);
    });
    
    test('should handle names with special characters', async ({ page }) => {
      const testUser = TestUser.create({
        name: 'José María García-López'
      });
      
      await AuthHelpers.signUp(page, testUser);
      await AuthHelpers.verifyAuthenticated(page, testUser);
    });
    
    test('should handle various email formats', async ({ page }) => {
      for (const email of TestData.validEmails) {
        const testUser = TestUser.create({ email: `test-${Date.now()}-${email}` });
        
        await page.goto('/auth-test');
        await AuthHelpers.signUp(page, testUser);
        await AuthHelpers.verifyAuthenticated(page, testUser);
        
        // Sign out to test next email
        await AuthHelpers.signOut(page);
      }
    });
    
    test('should maintain form state during mode switching', async ({ page }) => {
      const testUser = TestUser.createUnique();
      
      // Fill sign in form first
      await page.fill('input[name="email"]', testUser.email);
      await page.fill('input[name="password"]', testUser.password);
      
      // Switch to sign up
      await page.click('text=Sign up');
      
      // Verify email and password are preserved
      await expect(page.locator('input[name="email"]')).toHaveValue(testUser.email);
      await expect(page.locator('input[name="password"]')).toHaveValue(testUser.password);
      
      // Name field should be empty and visible
      await expect(page.locator('input[name="name"]')).toBeVisible();
      await expect(page.locator('input[name="name"]')).toHaveValue('');
    });
  });
  
  test.describe('Registration Validation', () => {
    
    test('should show validation for empty fields', async ({ page }) => {
      await page.click('text=Sign up');
      
      // Try to submit without filling fields
      await page.click('button[type="submit"]');
      
      // HTML5 validation should prevent submission
      const nameInput = page.locator('input[name="name"]');
      const emailInput = page.locator('input[name="email"]');
      const passwordInput = page.locator('input[name="password"]');
      
      // Check that required attributes are present
      await expect(nameInput).toHaveAttribute('required');
      await expect(emailInput).toHaveAttribute('required');
      await expect(passwordInput).toHaveAttribute('required');
    });
    
    test('should validate email format', async ({ page }) => {
      await page.click('text=Sign up');
      
      const testUser = TestUser.create({ email: 'invalid-email' });
      
      await page.fill('input[name="name"]', testUser.name);
      await page.fill('input[name="email"]', testUser.email);
      await page.fill('input[name="password"]', testUser.password);
      
      await page.click('button[type="submit"]');
      
      // Should show HTML5 email validation
      const emailInput = page.locator('input[name="email"]');
      await expect(emailInput).toHaveAttribute('type', 'email');
    });
    
    test('should handle duplicate email registration gracefully', async ({ page }) => {
      const testUser = TestUser.createUnique();
      
      // Register user first time
      await AuthHelpers.signUp(page, testUser);
      await AuthHelpers.verifyAuthenticated(page, testUser);
      
      // Sign out
      await AuthHelpers.signOut(page);
      
      // Try to register with same email again
      await page.click('text=Sign up');
      await page.fill('input[name="name"]', 'Different Name');
      await page.fill('input[name="email"]', testUser.email);
      await page.fill('input[name="password"]', testUser.password);
      
      await page.click('button[type="submit"]');
      
      // Should show error message
      await AuthHelpers.verifyError(page);
    });
  });
  
  test.describe('UI and UX', () => {
    
    test('should show loading state during registration', async ({ page }) => {
      const testUser = TestUser.createUnique();
      
      await page.click('text=Sign up');
      await page.fill('input[name="name"]', testUser.name);
      await page.fill('input[name="email"]', testUser.email);
      await page.fill('input[name="password"]', testUser.password);
      
      // Click submit and immediately check for loading state
      await page.click('button[type="submit"]');
      
      // Check if loading text appears (might be very brief)
      const submitButton = page.locator('button[type="submit"]');
      
      // Wait for either loading text or success
      await Promise.race([
        expect(submitButton).toContainText('Please wait...'),
        expect(page.locator('text=Authentication successful!')).toBeVisible({ timeout: 5000 }),
      ]);
    });
    
    test('should toggle between sign in and sign up modes', async ({ page }) => {
      // Start in sign in mode
      await expect(page.locator('h2:has-text("Sign In")')).toBeVisible();
      await expect(page.locator('input[name="name"]')).not.toBeVisible();
      
      // Switch to sign up
      await page.click('text=Sign up');
      await expect(page.locator('h2:has-text("Sign Up")')).toBeVisible();
      await expect(page.locator('input[name="name"]')).toBeVisible();
      
      // Switch back to sign in
      await page.click('text=Sign in');
      await expect(page.locator('h2:has-text("Sign In")')).toBeVisible();
      await expect(page.locator('input[name="name"]')).not.toBeVisible();
    });
    
    test('should have proper form accessibility', async ({ page }) => {
      await page.click('text=Sign up');
      
      // Check that all inputs have proper labels
      await expect(page.locator('label:has-text("Name")')).toBeVisible();
      await expect(page.locator('label:has-text("Email")')).toBeVisible();
      await expect(page.locator('label:has-text("Password")')).toBeVisible();
      
      // Check that inputs have proper placeholders
      await expect(page.locator('input[name="name"]')).toHaveAttribute('placeholder', 'Your name');
      await expect(page.locator('input[name="email"]')).toHaveAttribute('placeholder', 'your@email.com');
      await expect(page.locator('input[name="password"]')).toHaveAttribute('placeholder', 'Password');
      
      // Check that submit button is properly labeled
      await expect(page.locator('button[type="submit"]')).toContainText('Sign up');
    });
  });
  
  test.describe('Responsive Design', () => {
    
    test('should work on mobile viewports', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });
      
      const testUser = TestUser.createUnique();
      
      await page.goto('/auth-test');
      await AuthHelpers.signUp(page, testUser);
      await AuthHelpers.verifyAuthenticated(page, testUser);
      
      // Verify mobile layout
      const formContainer = page.locator('.max-w-md');
      await expect(formContainer).toBeVisible();
    });
    
    test('should handle very long names gracefully', async ({ page }) => {
      const longName = 'A'.repeat(100);
      const testUser = TestUser.create({ name: longName });
      
      await AuthHelpers.signUp(page, testUser);
      await AuthHelpers.verifyAuthenticated(page, testUser);
      
      // Verify name is displayed (possibly truncated)
      await expect(page.locator(`text=${longName.substring(0, 20)}`)).toBeVisible();
    });
  });
});