import { test, expect } from '@playwright/test';
import { faker } from '@faker-js/faker';

test.describe('Auth API (Rule 5, 6, 7)', () => {
  test('POST /api/auth/register - should register a new user', async ({ request }) => {
    const newUser = {
      username: faker.internet.username(),
      email: faker.internet.email(),
      password: 'TestPassword123!',
      fullName: faker.person.fullName(),
    };

    // Act
    const response = await request.post('/api/auth/register', {
      data: newUser
    });

    // Assert (3-tier)
    // 1. Status
    expect(response.status()).toBe(201);
    
    // 2. Body
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.data.user.username).toBe(newUser.username); // Fix: Backend might keep casing
    expect(body.data).toHaveProperty('token');

    // 3. Headers
    expect(response.headers()['content-type']).toContain('application/json');
  });

  test('POST /api/auth/login - should fail with invalid credentials', async ({ request }) => {
    // Act
    const response = await request.post('/api/auth/login', {
      data: {
        emailOrUsername: 'nonexistent',
        password: 'wrongpassword'
      }
    });

    // Assert
    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.message).toBe('Invalid credentials');
  });
});
