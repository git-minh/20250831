import { test as setup, expect } from "@playwright/test";
import { TestUser } from "./utils/test-data";

const authFile = "tests/auth/.auth/user.json";

setup("authenticate", async ({ page }) => {
  const testUser = TestUser.createUnique();

  console.log(`🔐 Setting up authentication for: ${testUser.email}`);

  // Go to auth test page
  await page.goto("/auth-test");

  // Verify we're on the sign-in form (unauthenticated state)
  await expect(page.locator("h2")).toContainText("Sign In");

  // Switch to sign-up mode
  await page.click("text=Sign up");
  await expect(page.locator("h2")).toContainText("Sign Up");

  // Fill in the sign-up form
  await page.fill('input[name="name"]', testUser.name);
  await page.fill('input[name="email"]', testUser.email);
  await page.fill('input[name="password"]', testUser.password);

  // Submit the form
  await page.click('button[type="submit"]');

  // Wait for successful authentication
  await expect(page.locator("text=Authentication successful!")).toBeVisible({ timeout: 10000 });

  // Verify user profile is displayed
  await expect(page.locator(`text=${testUser.email}`)).toBeVisible();
  await expect(page.locator(`text=${testUser.name}`)).toBeVisible();

  // Verify user preferences are set
  await expect(page.locator("text=Theme: system")).toBeVisible();
  await expect(page.locator("text=Notifications: Enabled")).toBeVisible();
  await expect(page.locator("text=Language: en")).toBeVisible();

  console.log("✅ Authentication setup completed successfully");

  // Save the authentication state
  await page.context().storageState({ path: authFile });

  // Store test user data for other tests
  const fs = require("fs");
  const testUserFile = "tests/auth/.auth/test-user.json";
  fs.writeFileSync(testUserFile, JSON.stringify(testUser, null, 2));

  console.log(`💾 Authentication state saved to: ${authFile}`);
  console.log(`👤 Test user data saved to: ${testUserFile}`);
});
