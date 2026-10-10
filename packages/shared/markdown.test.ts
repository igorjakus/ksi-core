import { expect, test } from 'bun:test';
import { renderMarkdown } from './markdown';
test('markdown cannot execute scripts or unsafe links', () => {
  const blocks = renderMarkdown(
    '<script>alert(1)</script>\n[x](javascript:alert(1))\n<img src=x onerror=alert(1)>'
  );
  const html = blocks
    .filter((b) => b.type === 'html')
    .map((b) => b.html)
    .join('');
  expect(html).not.toContain('<script');
  expect(html).not.toContain('onerror');
  expect(html).not.toContain('javascript:');
});
test('gallery is allowlisted data with bounded preview', () => {
  const blocks = renderMarkdown(':::gallery preview=999\nfile:abcdefgh file:ijklmnop\n:::');
  const gallery = blocks.find((b) => b.type === 'gallery');
  expect(gallery).toEqual({ type: 'gallery', ids: ['abcdefgh', 'ijklmnop'], preview: 2 });
});
