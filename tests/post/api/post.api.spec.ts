import { test, expect } from '@playwright/test';
import { faker } from '@faker-js/faker';

test.describe('Post API (Rule 5, 6, 7)', () => {
  let token: string;
  let createdPostId: string;

  test.beforeAll(async ({ request }) => {
    // Rule 7: Setup test user dynamically via API
    const user = {
      username: faker.internet.username(),
      email: faker.internet.email(),
      password: 'TestPassword123!',
      fullName: faker.person.fullName(),
    };
    const registerRes = await request.post('/api/auth/register', { data: user });
    const body = await registerRes.json();
    token = body.data.token;
  });

  test('POST /api/posts - should create a new post', async ({ request }) => {
    const postData = {
      image: 'https://picsum.photos/600/600',
      caption: faker.lorem.sentence(),
      location: faker.location.city()
    };

    const response = await request.post('/api/posts', {
      data: postData,
      headers: { Authorization: `Bearer ${token}` }
    });

    expect(response.status()).toBe(201);
    const body = await response.json();
    expect(body.success).toBe(true);
    createdPostId = body.data._id;
  });

  test('DELETE /api/posts/:id - should delete a post (Cleanup)', async ({ request }) => {
    test.skip(!createdPostId, 'No post created to delete');
    const response = await request.delete(`/api/posts/${createdPostId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    expect(response.status()).toBe(200);
  });
});
