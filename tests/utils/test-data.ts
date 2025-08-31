/**
 * Test data utilities for authentication testing
 */

export interface ITestUser {
  name: string;
  email: string;
  password: string;
  id?: string;
}

export class TestUser {
  /**
   * Create a unique test user with randomized data
   */
  static createUnique(): ITestUser {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(7);
    
    return {
      name: `Test User ${random}`,
      email: `test-${timestamp}-${random}@example.com`,
      password: 'TestPassword123!',
    };
  }
  
  /**
   * Create multiple unique test users
   */
  static createMultiple(count: number): ITestUser[] {
    return Array.from({ length: count }, () => this.createUnique());
  }
  
  /**
   * Create a test user with specific properties
   */
  static create(overrides: Partial<ITestUser>): ITestUser {
    const base = this.createUnique();
    return { ...base, ...overrides };
  }
  
  /**
   * Load the test user created during setup
   */
  static loadSetupUser(): ITestUser | null {
    try {
      const fs = require('fs');
      const data = fs.readFileSync('tests/auth/.auth/test-user.json', 'utf-8');
      return JSON.parse(data) as ITestUser;
    } catch (error) {
      console.warn('Could not load setup user:', error);
      return null;
    }
  }
}

export const TestData = {
  validEmails: [
    'user@example.com',
    'test.email+tag@domain.co.uk',
    'firstname.lastname@company.org'
  ],
  
  invalidEmails: [
    'invalid-email',
    '@domain.com',
    'user@',
    'spaces in@email.com'
  ],
  
  validPasswords: [
    'Password123!',
    'SecureP@ssw0rd',
    'MyStr0ng!Password'
  ],
  
  invalidPasswords: [
    'weak',           // too short
    'password',       // no uppercase/numbers
    'PASSWORD123',    // no lowercase
    'Password123',    // no special chars
  ],
  
  validNames: [
    'John Doe',
    'Alice Smith',
    'Bob Johnson',
    'María García',
    'Jean-Pierre Dupont'
  ]
} as const;