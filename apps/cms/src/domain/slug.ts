export function normalizeSlug(value: string): string {
  const normalized = value
    .normalize('NFKC')
    .trim()
    .toLocaleLowerCase('zh-CN')
    .replace(/[\\/:*?"<>|#._]+/g, '-')
    .replace(/[^\p{L}\p{N}-]+/gu, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 191)
    .replace(/-$/g, '');

  if (!normalized) {
    throw new Error('Slug 不能为空');
  }

  return normalized;
}
