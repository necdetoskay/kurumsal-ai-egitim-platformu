import { describe, expect, it } from 'vitest';
import { sessionMessage } from './auth';

describe('session disclosure boundaries', () => {
  it('does not expose tenant identifiers in forbidden state copy', () => {
    const message = sessionMessage({ status: 'forbidden' });
    expect(JSON.stringify(message)).not.toMatch(/tenant[-_: ]?\w+/i);
  });

  it('uses generic expired-session messaging', () => {
    const message = sessionMessage({ status: 'expired' });
    expect(message.title).toContain('süresi doldu');
    expect(message.detail).not.toContain('user-');
  });
});
