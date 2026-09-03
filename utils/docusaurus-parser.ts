export interface ParsedDocusaurusDoc {
  title: string;
  slug: string;
  section: string;
  order_index: number;
  icon_name: string;
  use_brand: boolean;
  content: string;
}

export function parseDocusaurusMarkdown(rawMd: string, filename: string): ParsedDocusaurusDoc {
  let content = rawMd;
  const frontmatter: Record<string, string> = {};

  // 1. Extract Frontmatter
  const fmMatch = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (fmMatch) {
    const fmBlock = fmMatch[1];
    const lines = fmBlock.split('\n');
    for (const line of lines) {
      const colonIdx = line.indexOf(':');
      if (colonIdx !== -1) {
        const key = line.slice(0, colonIdx).trim();
        let val = line.slice(colonIdx + 1).trim();
        // Remove surrounding quotes if they exist
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.slice(1, -1);
        }
        frontmatter[key] = val;
      }
    }
    // Remove frontmatter from content
    content = content.replace(fmMatch[0], '').trim();
  }

  // 2. Remove imports
  content = content.replace(/^import\s+.*?;?\s*$/gm, '');
  content = content.replace(/<Translate\s+id="[^"]*"\s*\/>/g, ''); // Remove translate tags

  // 3. Transform Admonitions to Github Alerts
  // Matches :::tip title \n body \n ::: and :::::tip single line :::::
  content = content.replace(/(^|\n)(:{3,})(\w+)[ \t]*([\s\S]*?)\2/g, (match, prefix, colons, type, contentBlock) => {
    let alertType = type.toUpperCase();
    if (['TIP', 'WARNING', 'NOTE', 'INFO'].includes(alertType)) {
      // Keep as is
    } else if (alertType === 'DANGER' || alertType === 'CAUTION') {
      alertType = 'CAUTION';
    } else {
      alertType = 'NOTE'; // Default
    }

    const lines = contentBlock.split('\n');
    // Remove empty trailing lines
    while (lines.length > 0 && lines[lines.length - 1].trim() === '') {
      lines.pop();
    }

    const firstLine = lines.shift() || '';

    let result = `${prefix}> [!${alertType}]`;

    if (lines.length === 0) {
      // Single line content, treat as body
      if (firstLine.trim() !== '') {
        result += `\n> ${firstLine.trim()}`;
      }
    } else {
      // Multi-line
      if (firstLine.trim() !== '') {
        result += ` ${firstLine.trim()}`;
      }
      const bodyStr = lines.map((line: string) => `> ${line}`).join('\n');
      result += `\n${bodyStr}`;
    }

    return result;
  });

  // 4. Transform Images
  // Expand image (margin-vert--lg)
  content = content.replace(/<div class="margin-vert--lg">\s*!\[([^\]]*)\]\(([^)]+)\)\s*<\/div>/gi, (match, alt, src) => {
    // Append #full-width if not already present
    const cleanSrc = src.split('#')[0];
    return `![${alt}](${cleanSrc}#full-width)`;
  });

  // Centered image (box_img)
  content = content.replace(/<div class="box_img">\s*!\[([^\]]*)\]\(([^)]+)\)\s*<\/div>/gi, (match, alt, src) => {
    const cleanSrc = src.split('#')[0];
    return `![${alt}](${cleanSrc}#align-center)`;
  });

  // 5. Transform Table Lists (Replace markdown dashes inside table cells with bullet points to prevent ProseMirror table ejection)
  content = content.split('\n').map(line => {
    const trimmed = line.trim();
    if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
      if (/^\|[\s\-:|]+\|$/.test(trimmed)) return line;
      let fixed = line.replace(/\|\s*-\s+/g, '| • ');
      fixed = fixed.replace(/<br\s*\/?>\s*-\s+/gi, '<br/>• ');
      return fixed;
    }
    return line;
  }).join('\n');

  // 6. Normalize JSX iframes with style={{...}} to responsive classes
  content = content.replace(/<iframe([\s\S]*?)style=\{\{([\s\S]*?)\}\}([\s\S]*?)>([\s\S]*?)<\/iframe>/gi, (match, before, styleContent, after, inside) => {
    return `<iframe${before}class="aspect-video w-full rounded-xl"${after}>${inside}</iframe>`;
  });

  // 7. Cleanup extra newlines
  content = content.replace(/\n{3,}/g, '\n\n').trim();

  // Extract properties
  const title = frontmatter.title || filename.replace('.md', '');
  const slug = filename.replace('.md', '').toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const section = frontmatter.sidebar_label || 'General';
  const order_index = parseInt(frontmatter.sidebar_position || '0', 10);
  const icon_name = frontmatter.iconName || '';
  const use_brand = frontmatter.useBrand === 'true';

  return {
    title,
    slug,
    section,
    order_index,
    icon_name,
    use_brand,
    content
  };
}
