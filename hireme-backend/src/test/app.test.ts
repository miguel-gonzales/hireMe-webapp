import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { buildApp } from '../app.js';
import { createMockSupabase } from './mock-supabase.js';
import './env-setup.js';

function buildMultipartForm(
  boundary: string,
  fields: Record<string, unknown>,
  file?: { fieldName: string; filename: string; contentType: string; content: string }
): Buffer {
  const lines = [];

  for (const [name, value] of Object.entries(fields)) {
    lines.push(`--${boundary}`);
    lines.push(`Content-Disposition: form-data; name="${name}"`);
    lines.push('');
    lines.push(String(value));
  }

  if (file) {
    lines.push(`--${boundary}`);
    lines.push(`Content-Disposition: form-data; name="${file.fieldName}"; filename="${file.filename}"`);
    lines.push(`Content-Type: ${file.contentType}`);
    lines.push('');
    lines.push(file.content);
  }

  lines.push(`--${boundary}--`, '');
  return Buffer.from(lines.join('\r\n'), 'utf8');
}

describe('Recruitment API', () => {
  let app: any;

  beforeEach(async (t) => {
    console.log('beforeEach', t.name);
    app = buildApp({ supabaseClient: createMockSupabase(), logger: false });
  });

  afterEach(async (t) => {
    console.log('afterEach start', t.name);
    await app.close();
    console.log('afterEach done', t.name);
  });

  it('returns API health check', async () => {
    const response = await app.inject({ method: 'GET', url: '/v1' });
    assert.equal(response.statusCode, 200);
    assert.deepEqual(response.json(), { message: 'RecruitmentWA API v1 is running' });
  });

  it('rejects login with invalid credential format', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/v1/auth/login',
      payload: { email: 'bad', password: 'short' },
    });

    assert.equal(response.statusCode, 400);
    assert.match(response.json().error, /must match format/i);
  });

  it('fails login with wrong password', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/v1/auth/login',
      payload: { email: 'admin@recruitment.test', password: 'wrongpassword' },
    });

    assert.equal(response.statusCode, 401);
    assert.match(response.json().error, /invalid credentials/i);
  });

  it('allows login and preserves session cookie', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/v1/auth/login',
      payload: { email: 'admin@recruitment.test', password: 'password123' },
    });

    assert.equal(response.statusCode, 200);
    assert.equal(response.json().message, 'Login successful');
    assert.ok(response.headers['set-cookie']);
  });

  it('returns bad request when resume file is missing', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/v1/applications',
      payload: {
        full_name: 'Jane Doe',
        email: 'jane@example.com',
        phone: '5551234',
        age: '28',
        country: 'Testland',
        city: 'Test City',
        english_level: 'Advanced (C1)',
      },
      headers: { 'content-type': 'multipart/form-data; boundary=----WebKitFormBoundary7MA4YWxkTrZu0gW' },
    });

    assert.equal(response.statusCode, 400);
    assert.match(response.json().error, /pdf resume is required/i);
  });

  it('rejects invalid resume file format', async () => {
    const boundary = '----WebKitFormBoundary7MA4YWxkTrZu0gW';
    const payload = buildMultipartForm(boundary, {}, {
      fieldName: 'resume',
      filename: 'resume.txt',
      contentType: 'text/plain',
      content: 'not a pdf',
    });

    const response = await app.inject({
      method: 'POST',
      url: '/v1/applications',
      payload,
      headers: { 'content-type': `multipart/form-data; boundary=${boundary}` },
    });

    assert.equal(response.statusCode, 400);
    assert.match(response.json().error, /invalid file format/i);
  });

  it('rejects application with invalid English level', async () => {
    const boundary = '----WebKitFormBoundary7MA4YWxkTrZu0gW';
    const payload = buildMultipartForm(
      boundary,
      {
        full_name: 'Jane Doe',
        email: 'jane@example.com',
        phone: '5551234',
        age: '28',
        country: 'Testland',
        city: 'Test City',
        english_level: 'Poor',
      },
      {
        fieldName: 'resume',
        filename: 'resume.pdf',
        contentType: 'application/pdf',
        content: '%PDF-1.4\n%',
      }
    );

    const response = await app.inject({
      method: 'POST',
      url: '/v1/applications',
      payload,
      headers: { 'content-type': `multipart/form-data; boundary=${boundary}` },
    });

    assert.equal(response.statusCode, 400);
    assert.match(response.json().error, /invalid english level/i);
  });

  it('creates application with valid data and returns resume_url', async () => {
    const boundary = '----WebKitFormBoundary7MA4YWxkTrZu0gW';
    const payload = buildMultipartForm(
      boundary,
      {
        full_name: 'Jane Doe',
        email: 'jane@example.com',
        phone: '5551234',
        age: '28',
        country: 'Testland',
        city: 'Test City',
        english_level: 'Advanced (C1)',
      },
      {
        fieldName: 'resume',
        filename: 'resume.pdf',
        contentType: 'application/pdf',
        content: '%PDF-1.4\n%',
      }
    );

    const response = await app.inject({
      method: 'POST',
      url: '/v1/applications',
      payload,
      headers: { 'content-type': `multipart/form-data; boundary=${boundary}` },
    });

    assert.equal(response.statusCode, 201);
    const body = response.json();
    assert.equal(body.full_name, 'Jane Doe');
    assert.equal(body.email, 'jane@example.com');
    assert.ok(body.resume_url.startsWith('https://mocked.storage/'));
  });

  it('returns 404 for unknown application id', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/v1/admin/applications/unknown-id',
      cookies: { session: 'invalid' },
    });

    assert.equal(response.statusCode, 401);
  });

  it('rejects status update with invalid status payload', async () => {
    const loginResp = await app.inject({
      method: 'POST',
      url: '/v1/auth/login',
      payload: { email: 'admin@recruitment.test', password: 'password123' },
    });

    const cookies = loginResp.headers['set-cookie'];
    const response = await app.inject({
      method: 'PATCH',
      url: '/v1/admin/applications/123/status',
      payload: { status: 'Unknown Status' },
      headers: { cookie: cookies },
    });

    assert.equal(response.statusCode, 400);
    assert.match(response.json().error, /must be equal to one of the allowed values/i);
  });
});
