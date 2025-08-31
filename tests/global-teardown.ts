import { FullConfig } from "@playwright/test";
import fs from "fs";
import path from "path";

async function globalTeardown(config: FullConfig) {
  console.log("🧹 Running global teardown...");

  // Clean up any test data
  const authDir = path.join(__dirname, "auth/.auth");

  try {
    // Clean up authentication state files
    if (fs.existsSync(authDir)) {
      const files = fs.readdirSync(authDir);
      for (const file of files) {
        if (file.endsWith(".json")) {
          fs.unlinkSync(path.join(authDir, file));
          console.log(`🗑️  Cleaned up auth state: ${file}`);
        }
      }
    }

    // Clean up test screenshots and videos if needed
    const testResultsDir = path.join(process.cwd(), "test-results");
    if (fs.existsSync(testResultsDir)) {
      console.log("📊 Test results preserved in test-results/");
    }

    console.log("✅ Global teardown completed");
  } catch (error) {
    console.warn("⚠️  Teardown warning:", error);
  }
}

export default globalTeardown;
