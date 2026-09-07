export interface NovedadStyleConfig {
  bgColor?: string;
  bgImage?: string;
  textColor?: string;
}

const STYLE_REGEX = /<!--NOVEDAD_STYLE:([\s\S]*?)-->/;

export function extractNovedadStyle(rawContent: string): { content: string; style: NovedadStyleConfig } {
  if (!rawContent) return { content: '', style: {} };
  const match = rawContent.match(STYLE_REGEX);
  if (match) {
    try {
      const style = JSON.parse(match[1]) as NovedadStyleConfig;
      const cleanContent = rawContent.replace(STYLE_REGEX, '').trim();
      return { content: cleanContent, style: style || {} };
    } catch {
      return { content: rawContent, style: {} };
    }
  }
  return { content: rawContent, style: {} };
}

export function injectNovedadStyle(cleanContent: string, style: NovedadStyleConfig): string {
  const hasStyle = Boolean(
    (style.bgColor && style.bgColor.trim()) ||
    (style.bgImage && style.bgImage.trim()) ||
    (style.textColor && style.textColor.trim())
  );
  const clean = (cleanContent || '').replace(STYLE_REGEX, '').trim();
  if (!hasStyle) return clean;

  const stylePayload: NovedadStyleConfig = {};
  if (style.bgColor?.trim()) stylePayload.bgColor = style.bgColor.trim();
  if (style.bgImage?.trim()) stylePayload.bgImage = style.bgImage.trim();
  if (style.textColor?.trim()) stylePayload.textColor = style.textColor.trim();

  return `<!--NOVEDAD_STYLE:${JSON.stringify(stylePayload)}-->\n\n${clean}`;
}
