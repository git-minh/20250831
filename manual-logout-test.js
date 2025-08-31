const { chromium } = require('@playwright/test');

async function testLogout() {
  console.log('🚀 Starting manual logout test...');
  
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    // Navigate to auth test page
    console.log('📍 Navigating to auth test page...');
    await page.goto('http://localhost:3000/auth-test');
    
    // Wait for page to load
    await page.waitForSelector('h1:has-text("Better Auth Test")', { timeout: 10000 });
    console.log('✅ Page loaded successfully');
    
    // Check current authentication state
    const authSuccess = await page.locator('text=Authentication successful!').isVisible({ timeout: 3000 }).catch(() => false);
    const signInForm = await page.locator('text=Sign In').isVisible({ timeout: 3000 }).catch(() => false);
    
    console.log(`Auth state - Success: ${authSuccess}, SignIn: ${signInForm}`);
    
    if (authSuccess) {
      console.log('🔐 Already authenticated, testing logout...');
      
      // Find and click logout button
      const logoutButton = page.locator('button:has-text("Sign out")');
      await logoutButton.waitFor({ state: 'visible', timeout: 5000 });
      
      console.log('🎯 Logout button found, clicking...');
      await logoutButton.click();
      
      // Wait for sign in form to appear
      await page.locator('text=Sign In').waitFor({ state: 'visible', timeout: 10000 });
      
      // Verify authentication success is gone
      const authStillVisible = await page.locator('text=Authentication successful!').isVisible({ timeout: 1000 }).catch(() => false);
      
      if (!authStillVisible) {
        console.log('✅ Logout test PASSED - Successfully logged out!');
      } else {
        console.log('❌ Logout test FAILED - Still showing authenticated state');
      }
      
    } else if (signInForm) {
      console.log('📝 Need to authenticate first...');
      
      // Click Sign up if available
      const signUpBtn = page.locator('text=Sign up');
      if (await signUpBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await signUpBtn.click();
        console.log('📝 Switched to sign up form');
      }
      
      // Fill out the form
      const timestamp = Date.now();
      const email = `test-${timestamp}@example.com`;
      
      console.log(`📧 Creating account: ${email}`);
      
      await page.fill('input[name="name"]', 'Test User');
      await page.fill('input[name="email"]', email);
      await page.fill('input[name="password"]', 'testpassword123');
      
      // Submit form
      await page.click('button[type="submit"]');
      console.log('📤 Form submitted, waiting for authentication...');
      
      // Wait for authentication success (longer timeout)
      try {
        await page.locator('text=Authentication successful!').waitFor({ state: 'visible', timeout: 20000 });
        console.log('✅ Authentication successful!');
        
        // Now test logout
        console.log('🎯 Testing logout functionality...');
        const logoutButton = page.locator('button:has-text("Sign out")');
        await logoutButton.waitFor({ state: 'visible', timeout: 5000 });
        await logoutButton.click();
        
        // Wait for sign in form
        await page.locator('text=Sign In').waitFor({ state: 'visible', timeout: 10000 });
        
        // Verify logout
        const authStillVisible = await page.locator('text=Authentication successful!').isVisible({ timeout: 1000 }).catch(() => false);
        
        if (!authStillVisible) {
          console.log('✅ Logout test PASSED - Successfully logged out after authentication!');
        } else {
          console.log('❌ Logout test FAILED - Still showing authenticated state after logout');
        }
        
      } catch (error) {
        console.log('❌ Authentication failed:', error.message);
        
        // Take screenshot for debugging
        await page.screenshot({ path: 'auth-failed.png', fullPage: true });
        console.log('📸 Debug screenshot saved as auth-failed.png');
      }
      
    } else {
      console.log('❌ Unexpected page state');
      await page.screenshot({ path: 'unexpected-state.png', fullPage: true });
    }
    
  } catch (error) {
    console.log('❌ Test failed:', error.message);
    await page.screenshot({ path: 'error-state.png', fullPage: true });
  } finally {
    await browser.close();
    console.log('🧹 Browser closed');
  }
}

testLogout();