import { Lexer } from 'marked';

export const minimumImageWidth = 32;
export const maximumImageWidth = 2000;
export function clampImageWidth(width: number) {
  return Math.round(Math.min(maximumImageWidth, Math.max(minimumImageWidth, width)));
}

// Ignore code: examples containing image syntax must remain literal examples.
export function markdownImages(source: string) {
  const code = [
    ...source.matchAll(/(^|\n)(`{3,}|~{3,})[^\n]*\n[\s\S]*?(?:\n\2[^\n]*(?=\n|$)|$)|(`+)[^`]*?\3/g)
  ].map((match) => [match.index!, match.index! + match[0].length]);
  const images: {
    start: number;
    end: number;
    raw: string;
    href: string;
    text: string;
    title: string | null;
    width?: number;
  }[] = [];
  for (const match of source.matchAll(/!\[/g)) {
    if (code.some(([start, end]) => match.index! >= start! && match.index! < end!)) continue;
    const remainder = source.slice(match.index!);
    const [token] = Lexer.lexInline(remainder);
    if (token?.type !== 'image') continue;
    const raw = token.raw;
    const flag = remainder.slice(raw.length).match(/^\{width=(\d+)\}/);
    const width = flag ? Number(flag[1]) : undefined;
    images.push({
      start: match.index!,
      end: match.index! + raw.length + (flag?.[0].length ?? 0),
      raw,
      href: token.href,
      text: token.text,
      title: token.title ?? null,
      width: width !== undefined ? clampImageWidth(width) : undefined
    });
  }
  return images;
}

export function resizeMarkdownImage(source: string, index: number, width: number) {
  const image = markdownImages(source)[index];
  if (!image || !Number.isFinite(width)) return source;
  return `${source.slice(0, image.start)}${image.raw}{width=${clampImageWidth(width)}}${source.slice(image.end)}`;
}

const escapeAttribute = (value: string) =>
  value.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
export function prepareMarkdownImages(source: string) {
  let result = source;
  const images = markdownImages(source);
  for (let index = images.length - 1; index >= 0; index--) {
    const image = images[index]!;
    const tag = `<span class="markdown-image-frame"><img src="${escapeAttribute(image.href)}" alt="${escapeAttribute(image.text)}"${image.title ? ` title="${escapeAttribute(image.title)}"` : ''}${image.width ? ` width="${image.width}"` : ''} data-ksi-image="${index}"></span>`;
    result = result.slice(0, image.start) + tag + result.slice(image.end);
  }
  return result;
}
