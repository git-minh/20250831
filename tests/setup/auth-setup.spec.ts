import { test as setup, expect } from "@playwright/test";
import { TestUser } from "../utils/test-data";
import { AuthHelpers } from "../utils/auth-helpers";

/**
 * Authentication Setup for CI/CD
 * Creates authenticated user states for downstream tests
 */

const authFile = "tests/auth/.auth/user.json";
const adminAuthFile = "tests/auth/.auth/admin.json";

setup("create authenticated user state", async ({ page }) => {
  console.log("🔧 Setting up authenticated user state for CI...");

  const testUser = TestUser.create({
    name: "CI Test User",
    email: "ci-test-user@example.com",
    password: "SecurePassword123!",
  });

  await page.goto("/auth-test");

  // Register and authenticate user
  await AuthHelpers.signUp(page, testUser);
  await AuthHelpers.verifyAuthenticated(page, testUser);

  console.log("✅ User authenticated successfully");

  // Save authentication state
  await page.context().storageState({ path: authFile });
  console.log(`💾 Authentication state saved to: ${authFile}`);
});

setup("create admin user state", async ({ page }) => {
  console.log("🔧 Setting up admin user state for CI...");

  const adminUser = TestUser.create({
    name: "CI Admin User",
    email: "ci-admin@example.com",
    password: "AdminSecurePassword123!",
  });

  await page.goto("/auth-test");

  // Register admin user
  await AuthHelpers.signUp(page, adminUser);
  await AuthHelpers.verifyAuthenticated(page, adminUser);

  console.log("✅ Admin user authenticated successfully");

  // Save admin authentication state
  await page.context().storageState({ path: adminAuthFile });
  console.log(`💾 Admin authentication state saved to: ${adminAuthFile}`);
});

setup("validate authentication setup", async ({ page }) => {
  console.log("🔍 Validating authentication setup...");

  // Test regular user state
  await page.goto("/auth-test", { waitUntil: "networkidle" });

  // Should be able to access protected content
  await expect(page.locator("text=Welcome")).toBeVisible({ timeout: 10000 });
  console.log("✅ Regular user authentication state validated");

  // Basic functionality check
  await expect(page.locator("text=Sign out")).toBeVisible();
  console.log("✅ Auth UI elements present and functional");
});

setup("performance baseline setup", async ({ page }) => {
  console.log("📊 Setting up performance baseline...");

  await page.goto("/auth-test", { waitUntil: "networkidle" });

  // Measure initial load performance
  const performanceMetrics = await page.evaluate(() => {
    const navigation = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming;
    return {
      domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
      loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
      totalTime: navigation.loadEventEnd - navigation.fetchStart,
    };
  });

  console.log("📈 Performance baseline metrics:", performanceMetrics);

  // Verify performance meets CI thresholds
  expect(performanceMetrics.totalTime).toBeLessThan(5000); // 5s max for CI
  expect(performanceMetrics.domContentLoaded).toBeLessThan(3000); // 3s max for DCL

  console.log("✅ Performance baseline established");
});

setup("test environment validation", async ({ page }) => {
  console.log("🌍 Validating test environment...");

  // Check that all required environment variables are present
  const requiredEnvVars = ["CONVEX_DEPLOYMENT", "CONVEX_SITE_URL"];

  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      console.error(`❌ Missing required environment variable: ${envVar}`);
      throw new Error(`Required environment variable ${envVar} is not set`);
    }
  }

  console.log("✅ All required environment variables present");

  // Test Convex connectivity
  await page.goto("/auth-test");

  // Wait for Convex to load
  await expect(page.locator("text=Loading...")).not.toBeVisible({ timeout: 10000 });

  console.log("✅ Convex connectivity validated");

  // Test auth API endpoints
  const response = await page.evaluate(async () => {
    try {
      const res = await fetch("/api/auth/get-session");
      return { status: res.status, ok: res.ok };
    } catch (error) {
      return { error: error.message };
    }
  });

  expect(response.status).toBeDefined();
  console.log("✅ Auth API endpoints accessible");
});

setup("cleanup previous test data", async ({ page }) => {
  console.log("🧹 Cleaning up previous test data...");

  // Clear any existing auth states
  await page.context().clearCookies();
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  console.log("✅ Previous test data cleaned up");
});
