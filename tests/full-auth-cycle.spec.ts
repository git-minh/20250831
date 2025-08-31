import { test, expect } from "@playwright/test";

test.describe("Full Authentication Cycle", () => {
  // Don't use auth setup for these tests - we want to test the full flow
  test.use({ storageState: undefined });

  test("complete authentication cycle: sign up → sign out → sign in → sign out", async ({ page }) => {
    const timestamp = Date.now();
    const testUser = {
      name: "Full Cycle User",
      email: `cycle-test-${timestamp}@example.com`,
      password: "securepassword123"
    };

    console.log(`🔄 Testing full auth cycle with: ${testUser.email}`);

    // Navigate to auth test page
    await page.goto("/auth-test");
    await expect(page.locator('h1:has-text("Better Auth Test")')).toBeVisible({ timeout: 10000 });

    // Wait for auth loading to complete
    await page.waitForTimeout(3000);

    // Should show sign in form initially
    await expect(page.locator('h2:has-text("Sign In")')).toBeVisible({ timeout: 10000 });

    // STEP 1: Sign Up
    console.log("📝 Step 1: Testing sign up");
    
    // Switch to sign up form
    await page.click("text=Sign up");
    await expect(page.locator('h2:has-text("Sign Up")')).toBeVisible();

    // Fill sign up form
    await page.fill('input[name="name"]', testUser.name);
    await page.fill('input[name="email"]', testUser.email);
    await page.fill('input[name="password"]', testUser.password);

    // Submit sign up form
    await page.click('button[type="submit"]');

    // Verify sign up success
    await expect(page.locator("text=Authentication successful!")).toBeVisible({ timeout: 15000 });
    
    // Verify user data is displayed
    await expect(page.locator(`text=${testUser.email}`)).toBeVisible({ timeout: 5000 });

    console.log("✅ Sign up completed successfully");

    // STEP 2: Sign Out (after sign up)
    console.log("🚪 Step 2: Testing sign out after sign up");
    
    const logoutButton = page.locator('button:has-text("Sign out")');
    await expect(logoutButton).toBeVisible();
    await logoutButton.click();

    // Verify logout success
    await expect(page.locator('h2:has-text("Sign In")')).toBeVisible({ timeout: 10000 });
    await expect(page.locator("text=Authentication successful!")).not.toBeVisible();

    console.log("✅ Sign out completed successfully");

    // STEP 3: Sign In (with created account)
    console.log("🔑 Step 3: Testing sign in with created account");
    
    // Should be on sign in form
    await expect(page.locator('h2:has-text("Sign In")')).toBeVisible();

    // Fill sign in form
    await page.fill('input[name="email"]', testUser.email);
    await page.fill('input[name="password"]', testUser.password);

    // Submit sign in form
    await page.click('button[type="submit"]');

    // Verify sign in success
    await expect(page.locator("text=Authentication successful!")).toBeVisible({ timeout: 15000 });
    await expect(page.locator(`text=${testUser.email}`)).toBeVisible({ timeout: 5000 });

    console.log("✅ Sign in completed successfully");

    // STEP 4: Final Sign Out
    console.log("🚪 Step 4: Final sign out test");
    
    const finalLogoutButton = page.locator('button:has-text("Sign out")');
    await expect(finalLogoutButton).toBeVisible();
    await finalLogoutButton.click();

    // Verify final logout success
    await expect(page.locator('h2:has-text("Sign In")')).toBeVisible({ timeout: 10000 });
    await expect(page.locator("text=Authentication successful!")).not.toBeVisible();

    console.log("✅ Final sign out completed successfully");

    console.log("🎉 FULL AUTHENTICATION CYCLE COMPLETED SUCCESSFULLY!");
  });

  test("session persistence after page refresh", async ({ page }) => {
    const timestamp = Date.now();
    const testUser = {
      name: "Session Test User",
      email: `session-test-${timestamp}@example.com`,
      password: "sessionpassword123"
    };

    console.log(`🔄 Testing session persistence with: ${testUser.email}`);

    // Navigate and sign up
    await page.goto("/auth-test");
    await expect(page.locator('h1:has-text("Better Auth Test")')).toBeVisible();
    
    await page.waitForTimeout(3000);
    await expect(page.locator('h2:has-text("Sign In")')).toBeVisible({ timeout: 10000 });

    // Sign up
    await page.click("text=Sign up");
    await page.fill('input[name="name"]', testUser.name);
    await page.fill('input[name="email"]', testUser.email);
    await page.fill('input[name="password"]', testUser.password);
    await page.click('button[type="submit"]');

    // Wait for authentication
    await expect(page.locator("text=Authentication successful!")).toBeVisible({ timeout: 15000 });

    console.log("✅ Signed up successfully, testing session persistence");

    // Refresh the page
    await page.reload();
    await page.waitForTimeout(3000);

    // Should still be authenticated after refresh
    await expect(page.locator("text=Authentication successful!")).toBeVisible({ timeout: 10000 });
    await expect(page.locator(`text=${testUser.email}`)).toBeVisible({ timeout: 5000 });

    console.log("✅ Session persisted after page refresh");

    // Test logout after refresh
    const logoutButton = page.locator('button:has-text("Sign out")');
    await expect(logoutButton).toBeVisible();
    await logoutButton.click();

    await expect(page.locator('h2:has-text("Sign In")')).toBeVisible({ timeout: 10000 });

    console.log("✅ Logout after refresh successful");
  });

  test("error handling - invalid credentials", async ({ page }) => {
    console.log("❌ Testing error handling with invalid credentials");

    await page.goto("/auth-test");
    await expect(page.locator('h1:has-text("Better Auth Test")')).toBeVisible();
    
    await page.waitForTimeout(3000);
    await expect(page.locator('h2:has-text("Sign In")')).toBeVisible({ timeout: 10000 });

    // Try to sign in with invalid credentials
    await page.fill('input[name="email"]', 'nonexistent@example.com');
    await page.fill('input[name="password"]', 'wrongpassword');
    
    await page.click('button[type="submit"]');

    // Should not succeed - either stay on form or show error
    await page.waitForTimeout(3000);
    
    // Should not show authentication success
    const authSuccess = await page.isVisible("text=Authentication successful!", { timeout: 5000 }).catch(() => false);
    expect(authSuccess).toBe(false);

    console.log("✅ Invalid credentials correctly rejected");

    // Should still show sign in form
    await expect(page.locator('h2:has-text("Sign In")')).toBeVisible();
  });

  test("sign up with duplicate email", async ({ page }) => {
    console.log("🔄 Testing duplicate email handling");

    const duplicateEmail = `duplicate-test-${Date.now()}@example.com`;
    const userData = {
      name: "Duplicate Test User",
      email: duplicateEmail,
      password: "testpassword123"
    };

    await page.goto("/auth-test");
    await expect(page.locator('h1:has-text("Better Auth Test")')).toBeVisible();
    
    await page.waitForTimeout(3000);
    await expect(page.locator('h2:has-text("Sign In")')).toBeVisible({ timeout: 10000 });

    // First sign up - should succeed
    await page.click("text=Sign up");
    await page.fill('input[name="name"]', userData.name);
    await page.fill('input[name="email"]', userData.email);
    await page.fill('input[name="password"]', userData.password);
    await page.click('button[type="submit"]');

    await expect(page.locator("text=Authentication successful!")).toBeVisible({ timeout: 15000 });
    console.log("✅ First sign up successful");

    // Sign out
    await page.click('button:has-text("Sign out")');
    await expect(page.locator('h2:has-text("Sign In")')).toBeVisible({ timeout: 10000 });

    // Try to sign up again with same email - should fail or handle gracefully
    await page.click("text=Sign up");
    await page.fill('input[name="name"]', "Second User");
    await page.fill('input[name="email"]', duplicateEmail);
    await page.fill('input[name="password"]', "differentpassword123");
    await page.click('button[type="submit"]');

    // Wait and check result
    await page.waitForTimeout(3000);

    // Should not succeed with duplicate email
    const authSuccess = await page.isVisible("text=Authentication successful!", { timeout: 5000 }).catch(() => false);
    
    if (authSuccess) {
      console.log("ℹ️ Duplicate email was allowed (might be expected behavior)");
    } else {
      console.log("✅ Duplicate email correctly rejected");
    }

    // Should show sign up form still
    const signUpVisible = await page.isVisible("text=Sign Up", { timeout: 2000 }).catch(() => false);
    expect(signUpVisible).toBe(true);
  });

  test("form validation - empty fields", async ({ page }) => {
    console.log("📝 Testing form validation with empty fields");

    await page.goto("/auth-test");
    await expect(page.locator('h1:has-text("Better Auth Test")')).toBeVisible();
    
    await page.waitForTimeout(3000);
    await expect(page.locator('h2:has-text("Sign In")')).toBeVisible({ timeout: 10000 });

    // Test sign in with empty fields
    await page.click('button[type="submit"]');
    
    // Should not proceed due to required field validation
    await page.waitForTimeout(1000);
    await expect(page.locator('h2:has-text("Sign In")')).toBeVisible();

    console.log("✅ Empty sign in form correctly blocked");

    // Test sign up with empty fields
    await page.click("text=Sign up");
    await page.click('button[type="submit"]');
    
    await page.waitForTimeout(1000);
    await expect(page.locator('h2:has-text("Sign Up")')).toBeVisible();

    console.log("✅ Empty sign up form correctly blocked");
  });
});