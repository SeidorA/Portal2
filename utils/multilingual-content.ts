export interface MultilingualContent {
  es: string;
  en: string;
}

/**
 * Checks if the content string contains multilingual delimiters like:
 * ---
 * es
 * ---
 * ...
 * ---
 * en
 * ---
 * ...
 */
export function isMultilingualContent(content: string): boolean {
  if (!content) return false;
  return /---\s*\n\s*(es|en)\s*\n\s*---/i.test(content);
}

/**
 * Parses a content string and extracts the ES and EN portions.
 * If the content is not multilingual (legacy plain text), it returns it in `es`.
 */
export function parseMultilingualContent(content: string): MultilingualContent {
  if (!content) {
    return { es: '', en: '' };
  }

  if (!isMultilingualContent(content)) {
    return { es: content.trim(), en: '' };
  }

  const result: MultilingualContent = { es: '', en: '' };

  // Match delimiter sections: --- followed by es/en followed by ---
  const sectionRegex = /---\s*\n\s*(es|en)\s*\n\s*---/gi;
  const sections: { lang: 'es' | 'en'; startIndex: number; matchIndex: number }[] = [];

  let match: RegExpExecArray | null;
  while ((match = sectionRegex.exec(content)) !== null) {
    sections.push({
      lang: match[1].toLowerCase() as 'es' | 'en',
      startIndex: match.index + match[0].length,
      matchIndex: match.index,
    });
  }

  for (let i = 0; i < sections.length; i++) {
    const current = sections[i];
    const next = sections[i + 1];
    const nextStart = next ? next.matchIndex : content.length;
    const text = content.slice(current.startIndex, nextStart).trim();
    if (current.lang === 'es') {
      result.es = text;
    } else if (current.lang === 'en') {
      result.en = text;
    }
  }

  return result;
}

/**
 * Extracts the specific language content from a multilingual or plain string.
 * If the requested language content is empty, falls back to the other language or raw text.
 */
export function extractLanguageContent(content: string, lang: 'es' | 'en' = 'es'): string {
  if (!content) return '';
  if (!isMultilingualContent(content)) {
    return content;
  }

  const parsed = parseMultilingualContent(content);
  if (lang === 'en') {
    return parsed.en || parsed.es || '';
  }
  return parsed.es || parsed.en || '';
}

/**
 * Composes a single multilingual content string from ES and EN markdown texts.
 * Format:
 * ---
 * es
 * ---
 * {esContent}
 * 
 * ---
 * en
 * ---
 * {enContent}
 */
export function composeMultilingualContent(content: MultilingualContent): string {
  const es = (content.es || '').trim();
  const en = (content.en || '').trim();

  if (!es && !en) return '';

  return `---\nes\n---\n${es}\n\n---\nen\n---\n${en}`;
}
