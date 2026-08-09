import { describe, expect, it } from 'vitest';

import { normalizeSlug } from './slug.js';

describe('normalizeSlug', () => {
  it.each([
    [' Astro CMS ', 'astro-cms'],
    ['Java / 值传递', 'java-值传递'],
    ['../../etc/passwd', 'etc-passwd'],
    ['连续---分隔', '连续-分隔'],
  ])('normalizes %s safely', (input, expected) => {
    expect(normalizeSlug(input)).toBe(expected);
  });

  it('rejects input that contains no letters or numbers', () => {
    expect(() => normalizeSlug('../')).toThrow('Slug 不能为空');
  });
});
