import { describe, expect, it } from 'vitest';

import { cn } from './cn';

describe('cn', () => {
  it('concatena as classes informadas', () => {
    expect(cn('p-4', 'text-sm')).toBe('p-4 text-sm');
  });

  it('descarta valores falsos, nulos e vazios', () => {
    expect(cn('p-4', false, null, undefined, '', 'text-sm')).toBe('p-4 text-sm');
  });
});
