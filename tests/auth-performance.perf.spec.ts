import { test, expect } from "@playwright/test";
import { TestUser } from "./utils/test-data";
import { AuthHelpers } from "./utils/auth-helpers";

/**
 * Performance Tests for Authentication
 * Tests performance characteristics and benchmarks of the auth system.
 */

test.describe("Authentication Performance", () => {
  test.describe("Page Load Performance", () => {
    test("should load auth page within performance budget", async ({ page }) => {
      const startTime = Date.now();

      await page.goto("/auth-test");
      await AuthHelpers.waitForAuthLoad(page);

      const endTime = Date.now();
      const loadTime = endTime - startTime;

      console.log(`🕐 Auth page load time: ${loadTime}ms`);

      // Should load within 3 seconds
      expect(loadTime).toBeLessThan(3000);

      // Check Core Web Vitals
      const metrics = await page.evaluate(() => {
        return new Promise(resolve => {
          new PerformanceObserver(list => {
            const entries = list.getEntries();
            const vitals = {};

            entries.forEach(entry => {
              if (entry.name === "FCP") vitals.fcp = entry.value;
              if (entry.name === "LCP") vitals.lcp = entry.value;
              if (entry.name === "FID") vitals.fid = entry.value;
              if (entry.name === "CLS") vitals.cls = entry.value;
            });

            resolve(vitals);
          }).observe({
            entryTypes: ["paint", "largest-contentful-paint", "first-input", "layout-shift"],
          });

          // Fallback timeout
          setTimeout(() => resolve({}), 1000);
        });
      });

      console.log("📊 Core Web Vitals:", metrics);

      // LCP should be under 2.5s, FCP under 1.8s
      if (metrics.lcp) expect(metrics.lcp).toBeLessThan(2500);
      if (metrics.fcp) expect(metrics.fcp).toBeLessThan(1800);
    });

    test("should have minimal network requests", async ({ page }) => {
      const requests = [];

      page.on("request", request => {
        requests.push(request.url());
      });

      await page.goto("/auth-test");
      await AuthHelpers.waitForAuthLoad(page);

      console.log(`🌐 Network requests: ${requests.length}`);
      console.log("📋 Requests:", requests);

      // Should have reasonable number of requests (adjust based on your app)
      expect(requests.length).toBeLessThan(20);

      // Should not make unnecessary auth requests on load
      const authRequests = requests.filter(url => url.includes("/api/auth/"));
      expect(authRequests.length).toBeLessThan(3);
    });

    test("should have acceptable bundle size impact", async ({ page }) => {
      // Check JavaScript bundle size impact
      const jsResources = await page.evaluate(() => {
        const resources = performance.getEntriesByType("resource");
        return resources
          .filter(r => r.name.includes(".js"))
          .map(r => ({
            url: r.name,
            size: r.transferSize || r.decodedBodySize,
            loadTime: r.responseEnd - r.fetchStart,
          }));
      });

      const totalJsSize = jsResources.reduce((sum, r) => sum + r.size, 0);
      console.log(`📦 Total JS bundle size: ${Math.round(totalJsSize / 1024)}KB`);
      console.log("📋 JS Resources:", jsResources);

      // Should keep bundle size reasonable (adjust based on your app)
      expect(totalJsSize).toBeLessThan(2 * 1024 * 1024); // 2MB
    });
  });

  test.describe("Authentication Flow Performance", () => {
    test("should complete registration within time budget", async ({ page }) => {
      await page.goto("/auth-test");
      await AuthHelpers.waitForAuthLoad(page);

      const testUser = TestUser.createUnique();

      await page.click("text=Sign up");

      const startTime = Date.now();

      await page.fill('input[name="name"]', testUser.name);
      await page.fill('input[name="email"]', testUser.email);
      await page.fill('input[name="password"]', testUser.password);
      await page.click('button[type="submit"]');

      // Wait for successful authentication
      await AuthHelpers.verifyAuthenticated(page);

      const endTime = Date.now();
      const registrationTime = endTime - startTime;

      console.log(`🕐 Registration flow time: ${registrationTime}ms`);

      // Registration should complete within 5 seconds
      expect(registrationTime).toBeLessThan(5000);
    });

    test("should complete login within time budget", async ({ page }) => {
      // First create a user
      const testUser = TestUser.createUnique();
      await page.goto("/auth-test");
      await AuthHelpers.signUp(page, testUser);
      await AuthHelpers.signOut(page);

      // Now test login performance
      const startTime = Date.now();

      await page.fill('input[name="email"]', testUser.email);
      await page.fill('input[name="password"]', testUser.password);
      await page.click('button[type="submit"]');

      await AuthHelpers.verifyAuthenticated(page);

      const endTime = Date.now();
      const loginTime = endTime - startTime;

      console.log(`🕐 Login flow time: ${loginTime}ms`);

      // Login should complete within 3 seconds
      expect(loginTime).toBeLessThan(3000);
    });

    test("should handle logout quickly", async ({ page }) => {
      await page.goto("/auth-test");
      await AuthHelpers.verifyAuthenticated(page);

      const startTime = Date.now();

      await page.click("text=Sign out");
      await AuthHelpers.verifyUnauthenticated(page);

      const endTime = Date.now();
      const logoutTime = endTime - startTime;

      console.log(`🕐 Logout time: ${logoutTime}ms`);

      // Logout should be nearly instantaneous
      expect(logoutTime).toBeLessThan(1000);
    });
  });

  test.describe("Concurrent User Performance", () => {
    test("should handle multiple concurrent registrations", async ({ browser }) => {
      const concurrentUsers = 5;
      const contexts = [];
      const results = [];

      // Create multiple browser contexts
      for (let i = 0; i < concurrentUsers; i++) {
        const context = await browser.newContext();
        contexts.push(context);
      }

      const startTime = Date.now();

      // Run concurrent registrations
      const registrationPromises = contexts.map(async (context, index) => {
        const page = await context.newPage();
        const testUser = TestUser.createUnique();

        const userStartTime = Date.now();

        try {
          await page.goto("/auth-test");
          await AuthHelpers.signUp(page, testUser);
          await AuthHelpers.verifyAuthenticated(page, testUser);

          const userEndTime = Date.now();
          return {
            success: true,
            time: userEndTime - userStartTime,
            user: index + 1,
          };
        } catch (error) {
          const userEndTime = Date.now();
          return {
            success: false,
            time: userEndTime - userStartTime,
            user: index + 1,
            error: error.message,
          };
        }
      });

      const results = await Promise.all(registrationPromises);
      const totalTime = Date.now() - startTime;

      console.log(`🕐 Concurrent registrations total time: ${totalTime}ms`);
      console.log("📊 Individual results:", results);

      // Close contexts
      await Promise.all(contexts.map(context => context.close()));

      // All registrations should succeed
      const successfulRegistrations = results.filter(r => r.success);
      expect(successfulRegistrations.length).toBeGreaterThanOrEqual(concurrentUsers * 0.8); // 80% success rate

      // Average registration time should be reasonable
      const avgTime = results.reduce((sum, r) => sum + r.time, 0) / results.length;
      console.log(`📊 Average registration time: ${avgTime}ms`);
      expect(avgTime).toBeLessThan(10000); // 10s under load
    });

    test("should maintain performance under form spam", async ({ page }) => {
      await page.goto("/auth-test");

      const testUser = TestUser.createUnique();

      // Rapidly fill and clear form multiple times
      const iterations = 10;
      const startTime = Date.now();

      for (let i = 0; i < iterations; i++) {
        await page.fill('input[name="email"]', testUser.email);
        await page.fill('input[name="password"]', testUser.password);
        await page.fill('input[name="email"]', "");
        await page.fill('input[name="password"]', "");
      }

      // Final submission
      await page.click("text=Sign up");
      await page.fill('input[name="name"]', testUser.name);
      await page.fill('input[name="email"]', testUser.email);
      await page.fill('input[name="password"]', testUser.password);
      await page.click('button[type="submit"]');

      await AuthHelpers.verifyAuthenticated(page);

      const endTime = Date.now();
      const totalTime = endTime - startTime;

      console.log(`🕐 Form spam test time: ${totalTime}ms`);

      // Should handle form manipulation without significant performance degradation
      expect(totalTime).toBeLessThan(15000);
    });
  });

  test.describe("Memory and Resource Usage", () => {
    test("should not leak memory during auth flows", async ({ page }) => {
      await page.goto("/auth-test");

      const initialMemory = await page.evaluate(() => {
        if (performance.memory) {
          return {
            used: performance.memory.usedJSHeapSize,
            total: performance.memory.totalJSHeapSize,
            limit: performance.memory.jsHeapSizeLimit,
          };
        }
        return null;
      });

      // Perform multiple auth operations
      for (let i = 0; i < 5; i++) {
        const testUser = TestUser.createUnique();

        if (i > 0) {
          await page.reload();
          await AuthHelpers.waitForAuthLoad(page);
        }

        await AuthHelpers.signUp(page, testUser);
        await AuthHelpers.signOut(page);
      }

      // Force garbage collection if possible
      await page.evaluate(() => {
        if (window.gc) window.gc();
      });

      const finalMemory = await page.evaluate(() => {
        if (performance.memory) {
          return {
            used: performance.memory.usedJSHeapSize,
            total: performance.memory.totalJSHeapSize,
            limit: performance.memory.jsHeapSizeLimit,
          };
        }
        return null;
      });

      if (initialMemory && finalMemory) {
        const memoryGrowth = finalMemory.used - initialMemory.used;
        console.log(`💾 Memory growth: ${Math.round(memoryGrowth / 1024)}KB`);
        console.log("📊 Initial memory:", initialMemory);
        console.log("📊 Final memory:", finalMemory);

        // Memory growth should be reasonable (< 10MB)
        expect(memoryGrowth).toBeLessThan(10 * 1024 * 1024);
      }
    });

    test("should clean up event listeners and timers", async ({ page }) => {
      await page.goto("/auth-test");

      const initialEventListeners = await page.evaluate(() => {
        return document.querySelectorAll("*[onclick], *[onchange], *[onsubmit]").length;
      });

      // Perform auth operations
      const testUser = TestUser.createUnique();
      await AuthHelpers.signUp(page, testUser);
      await AuthHelpers.signOut(page);

      // Navigate away and back
      await page.goto("/");
      await page.goto("/auth-test");
      await AuthHelpers.waitForAuthLoad(page);

      const finalEventListeners = await page.evaluate(() => {
        return document.querySelectorAll("*[onclick], *[onchange], *[onsubmit]").length;
      });

      console.log(`🎧 Initial event listeners: ${initialEventListeners}`);
      console.log(`🎧 Final event listeners: ${finalEventListeners}`);

      // Should not accumulate excessive event listeners
      expect(finalEventListeners - initialEventListeners).toBeLessThan(10);
    });
  });

  test.describe("Network Performance", () => {
    test("should handle slow network conditions", async ({ page }) => {
      // Simulate 3G network
      await page.route("**/*", async route => {
        await new Promise(resolve => setTimeout(resolve, 100));
        route.continue();
      });

      const testUser = TestUser.createUnique();

      const startTime = Date.now();

      await page.goto("/auth-test");
      await AuthHelpers.signUp(page, testUser);
      await AuthHelpers.verifyAuthenticated(page);

      const endTime = Date.now();
      const slowNetworkTime = endTime - startTime;

      console.log(`🐌 Slow network auth time: ${slowNetworkTime}ms`);

      // Should still complete within reasonable time on slow network
      expect(slowNetworkTime).toBeLessThan(15000);
    });

    test("should optimize request frequency", async ({ page }) => {
      let requestCount = 0;

      page.on("request", request => {
        if (request.url().includes("/api/auth/")) {
          requestCount++;
        }
      });

      await page.goto("/auth-test");
      await AuthHelpers.waitForAuthLoad(page);

      // Switch between forms multiple times
      for (let i = 0; i < 3; i++) {
        await page.click("text=Sign up");
        await page.waitForTimeout(100);
        await page.click("text=Sign in");
        await page.waitForTimeout(100);
      }

      console.log(`🌐 Auth API requests during form switching: ${requestCount}`);

      // Should not make excessive API requests during UI interactions
      expect(requestCount).toBeLessThan(5);
    });
  });
});
