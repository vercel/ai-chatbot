import { test, expect } from '@playwright/test';
import { GET as pingGET } from '../../app/ping/route';
import { GET as perfGET } from '../../app/api/monitoring/performance/route';
import { incrementMessage, incrementError } from '../../lib/metrics/counters';

test('ping endpoint responds with uptime', async () => {
  const response = await pingGET();
  expect(response.status).toBe(200);
  const body = await response.json();
  expect(body).toHaveProperty('uptime');
  expect(body).toHaveProperty('commit');
});

test('performance metrics aggregate message and error counts', async () => {
  incrementMessage();
  incrementMessage();
  incrementError();

  const response = await perfGET();
  const body = await response.json();

  expect(body.msgs_per_hour).toBe(2);
  expect(body.errors_per_hour).toBe(1);
  expect(body.last_5m.msgs).toBe(2);
  expect(body.last_5m.errors).toBe(1);
});
