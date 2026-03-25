import { test, expect } from '@playwright/test';
import { faker } from '@faker-js/faker';

test.describe('User API (Rule 5, 7)', () => {
  let token: string;
  let username: string;

  test.beforeAll(async ({ request }) => {
    username = faker.internet.username();
    const user = {
      username,
      email: faker.internet.email(),
      password: 'TestPassword123!',
      fullName: faker.person.fullName(),
    };
    const registerRes = await request.post('/api/auth/register', { data: user });
    const body = await registerRes.json();
    token = body.data.token;
  });

  test('GET /api/users/search - should find users by username', async ({ request }) => {
    const response = await request.get(`/api/users/search?q=${username}`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(Array.isArray(body.data)).toBe(true);
  });
});
