import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { buildApp } from '../../app.js';

describe('Auth routes', () => {
  it('returns 400 on invalid body', async () => {
    const app = buildApp();
    const response = await app.inject({
      method: 'POST',
      url: '/v1/auth/login',
      payload: { email: 'not-an-email', password: 'short' },
    });

    assert.equal(response.statusCode, 400);
    assert.match(response.json().error, /must match format/i);
  });
});
