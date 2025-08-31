import { chromium, FullConfig } from "@playwright/test";

async function globalSetup(config: FullConfig) {
  const { baseURL, storageState } = config.projects[0].use;

  console.log(`🚀 Starting global setup...`);
  console.log(`📍 Base URL: ${baseURL}`);

  // Wait for the development server to be ready
  const browser = await chromium.launch();
  const page = await browser.newPage();

  try {
    // Test that the application is responding
    await page.goto(baseURL || "http://localhost:3000");
    await page.waitForLoadState("networkidle", { timeout: 30000 });

    // Verify auth test page is accessible
    await page.goto(`${baseURL || "http://localhost:3000"}/auth-test`);
    await page.waitForSelector('h1:has-text("Better Auth Test")', { timeout: 10000 });

    console.log("✅ Application is ready for testing");
  } catch (error) {
    console.error("❌ Application setup failed:", error);
    throw error;
  } finally {
    await browser.close();
  }
}

export default globalSetup;
