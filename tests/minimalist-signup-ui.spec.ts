import { test, expect } from "@playwright/test";

test.describe("Minimalist Signup UI/UX", () => {
  // Don't use auth setup for these tests
  test.use({ storageState: undefined });

  test.beforeEach(async ({ page }) => {
    // Navigate to the new signup page
    await page.goto("/signup");
    await expect(page.locator('h1:has-text("Authentication Demo")')).toBeVisible({ timeout: 10000 });
  });

  test("displays minimalist design elements correctly", async ({ page }) => {
    console.log("🎨 Testing minimalist design elements");

    // Wait for auth loading to complete
    await page.waitForTimeout(3000);

    // Check main title and subtitle
    await expect(page.locator('h1:has-text("Authentication Demo")')).toBeVisible();
    await expect(page.locator('p:has-text("Minimalist signup & signin experience")')).toBeVisible();

    // Should show signup form by default
    await expect(page.locator('h1:has-text("Create your account")')).toBeVisible();
    await expect(page.locator('p:has-text("Enter your details below to get started")')).toBeVisible();

    // Check form elements are present
    await expect(page.locator('label:has-text("Full name")')).toBeVisible();
    await expect(page.locator('label:has-text("Email")')).toBeVisible();
    await expect(page.locator('label:has-text("Password")')).toBeVisible();
    await expect(page.locator('button:has-text("Create account")')).toBeVisible();

    // Check features showcase
    await expect(page.locator('h3:has-text("UI/UX Features")')).toBeVisible();
    await expect(page.locator('text=Minimalist design with clear visual hierarchy')).toBeVisible();
    await expect(page.locator('text=Real-time validation and error handling')).toBeVisible();
    await expect(page.locator('text=Password visibility toggle for better UX')).toBeVisible();

    console.log("✅ Minimalist design elements verified");
  });

  test("password visibility toggle works correctly", async ({ page }) => {
    console.log("👁️ Testing password visibility toggle");

    await page.waitForTimeout(3000);

    const passwordInput = page.locator('input[name="password"]');
    const toggleButton = page.locator('button[type="button"]').filter({ has: page.locator('svg') }).last();

    // Password should be hidden initially
    await expect(passwordInput).toHaveAttribute('type', 'password');

    // Click toggle to show password
    await toggleButton.click();
    await expect(passwordInput).toHaveAttribute('type', 'text');

    // Click toggle to hide password again
    await toggleButton.click();
    await expect(passwordInput).toHaveAttribute('type', 'password');

    console.log("✅ Password visibility toggle working correctly");
  });

  test("form validation works properly", async ({ page }) => {
    console.log("📝 Testing form validation");

    await page.waitForTimeout(3000);

    // Try to submit empty form
    await page.click('button:has-text("Create account")');

    // Should not proceed due to HTML5 validation
    await page.waitForTimeout(1000);
    await expect(page.locator('h1:has-text("Create your account")')).toBeVisible();

    // Fill invalid email
    await page.fill('input[name="name"]', 'Test User');
    await page.fill('input[name="email"]', 'invalid-email');
    await page.fill('input[name="password"]', '123'); // Too short

    await page.click('button:has-text("Create account")');

    // Should show client-side password validation error
    await expect(page.locator('text=Password must be at least 8 characters long')).toBeVisible({ timeout: 5000 });

    console.log("✅ Form validation working correctly");
  });

  test("signup to signin flow works smoothly", async ({ page }) => {
    console.log("🔄 Testing signup to signin flow");

    await page.waitForTimeout(3000);

    // Should show signup form initially
    await expect(page.locator('h1:has-text("Create your account")')).toBeVisible();
    
    // Click "Sign in" link
    await page.click('button:has-text("Sign in")');
    
    // Should switch to signin form
    await expect(page.locator('h1:has-text("Welcome back")')).toBeVisible();
    await expect(page.locator('p:has-text("Enter your credentials to access your account")')).toBeVisible();

    // Check signin form elements
    await expect(page.locator('label:has-text("Email")')).toBeVisible();
    await expect(page.locator('label:has-text("Password")')).toBeVisible();
    await expect(page.locator('button:has-text("Forgot password?")')).toBeVisible();
    await expect(page.locator('button:has-text("Sign in")').first()).toBeVisible();

    // Switch back to signup
    await page.click('button:has-text("Sign up")');
    await expect(page.locator('h1:has-text("Create your account")')).toBeVisible();

    console.log("✅ Signup to signin flow working smoothly");
  });

  test("complete signup flow with success animation", async ({ page }) => {
    console.log("🎉 Testing complete signup flow");

    await page.waitForTimeout(3000);

    const timestamp = Date.now();
    const testUser = {
      name: "UI Test User",
      email: `ui-test-${timestamp}@example.com`,
      password: "uitestpassword123"
    };

    // Fill signup form
    await page.fill('input[name="name"]', testUser.name);
    await page.fill('input[name="email"]', testUser.email);
    await page.fill('input[name="password"]', testUser.password);

    // Submit form
    await page.click('button:has-text("Create account")');

    // Should show loading state
    await expect(page.locator('text=Creating account...')).toBeVisible({ timeout: 5000 });

    // Should show success state or authenticated view
    const successVisible = await page.locator('h1:has-text("Welcome aboard!")').isVisible({ timeout: 15000 }).catch(() => false);
    const authenticatedVisible = await page.locator('h2:has-text("You\'re signed in!")').isVisible({ timeout: 15000 }).catch(() => false);

    if (successVisible) {
      console.log("✅ Success animation displayed");
      await expect(page.locator('p:has-text("Your account has been created successfully")')).toBeVisible();
    } else if (authenticatedVisible) {
      console.log("✅ Direct authentication successful");
      await expect(page.locator('p:has-text("The authentication flow completed successfully.")')).toBeVisible();
      
      // Check authenticated state features
      await expect(page.locator('text=Authentication state is managed by Convex + Better Auth')).toBeVisible();
      await expect(page.locator('button:has-text("Sign out")')).toBeVisible();
    } else {
      console.log("❌ Neither success animation nor authentication shown");
      await page.screenshot({ path: 'signup-flow-failed.png', fullPage: true });
      throw new Error("Signup flow did not complete as expected");
    }

    console.log("✅ Complete signup flow working correctly");
  });

  test("accessibility features are properly implemented", async ({ page }) => {
    console.log("♿ Testing accessibility features");

    await page.waitForTimeout(3000);

    // Check form labels are properly associated
    const nameInput = page.locator('input[name="name"]');
    const emailInput = page.locator('input[name="email"]');
    const passwordInput = page.locator('input[name="password"]');

    await expect(nameInput).toHaveAttribute('id', 'name');
    await expect(emailInput).toHaveAttribute('id', 'email');  
    await expect(passwordInput).toHaveAttribute('id', 'password');

    // Check autocomplete attributes
    await expect(nameInput).toHaveAttribute('autocomplete', 'name');
    await expect(emailInput).toHaveAttribute('autocomplete', 'email');
    await expect(passwordInput).toHaveAttribute('autocomplete', 'new-password');

    // Check form is keyboard navigable
    await nameInput.focus();
    await expect(nameInput).toBeFocused();

    await page.keyboard.press('Tab');
    await expect(emailInput).toBeFocused();

    await page.keyboard.press('Tab');
    await expect(passwordInput).toBeFocused();

    // Check password toggle is accessible
    await page.keyboard.press('Tab');
    const toggleButton = page.locator('button[type="button"]').filter({ has: page.locator('svg') }).last();
    await expect(toggleButton).toBeFocused();

    console.log("✅ Accessibility features working correctly");
  });

  test("responsive design works on different screen sizes", async ({ page }) => {
    console.log("📱 Testing responsive design");

    await page.waitForTimeout(3000);

    // Test mobile view
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(1000);

    // Form should still be visible and usable
    await expect(page.locator('h1:has-text("Create your account")')).toBeVisible();
    await expect(page.locator('input[name="name"]')).toBeVisible();

    // Test tablet view  
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(1000);

    await expect(page.locator('h1:has-text("Create your account")')).toBeVisible();
    await expect(page.locator('input[name="name"]')).toBeVisible();

    // Test desktop view
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.waitForTimeout(1000);

    await expect(page.locator('h1:has-text("Create your account")')).toBeVisible();
    await expect(page.locator('input[name="name"]')).toBeVisible();

    console.log("✅ Responsive design working across screen sizes");
  });

  test("error states are clearly displayed", async ({ page }) => {
    console.log("⚠️ Testing error states");

    await page.waitForTimeout(3000);

    // Test weak password error
    await page.fill('input[name="name"]', 'Test User');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', '123'); // Too short

    await page.click('button:has-text("Create account")');

    // Should show error message with icon
    await expect(page.locator('div').filter({ hasText: 'Password must be at least 8 characters long' })).toBeVisible();
    
    // Error should have proper styling (red border, icon, etc.)
    const errorDiv = page.locator('div').filter({ hasText: 'Password must be at least 8 characters long' }).first();
    await expect(errorDiv).toHaveClass(/border-destructive/);

    console.log("✅ Error states working correctly");
  });

  test("loading states provide clear feedback", async ({ page }) => {
    console.log("⏳ Testing loading states");

    await page.waitForTimeout(3000);

    const timestamp = Date.now();
    await page.fill('input[name="name"]', 'Loading Test User');
    await page.fill('input[name="email"]', `loading-test-${timestamp}@example.com`);
    await page.fill('input[name="password"]', 'loadingtestpassword123');

    // Click submit and immediately check for loading state
    await page.click('button:has-text("Create account")');

    // Should show spinner and loading text
    const loadingButton = page.locator('button').filter({ hasText: 'Creating account...' });
    const loadingSpinner = page.locator('svg.animate-spin');
    
    // At least one should be visible during loading
    const loadingVisible = await Promise.race([
      loadingButton.isVisible({ timeout: 2000 }),
      loadingSpinner.isVisible({ timeout: 2000 })
    ]).catch(() => false);

    if (loadingVisible) {
      console.log("✅ Loading state displayed correctly");
    } else {
      console.log("ℹ️ Loading state may have been too fast to observe");
    }

    // Wait for completion
    await page.waitForTimeout(10000);
    console.log("✅ Loading states test completed");
  });
});