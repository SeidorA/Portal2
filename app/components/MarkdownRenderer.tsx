'use client';

import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { CaralIcon, Brand } from 'iconcaral2';
import { CrestoneConnections } from './CrestoneConnections';
import DynamicFeature from './DynamicFeature';
import Archivos from './Archivos';
import Webinar from './Webinar';
import DocInsert from './DocInsert';

const extractText = (children: any): string => {
  if (typeof children === 'string') return children;
  if (Array.isArray(children)) return children.map(extractText).join('');
  if (children?.props?.children) return extractText(children.props.children);
  return '';
};

const renderTitleWithIcon = (Tag: any, children: React.ReactNode, props: any, className: string) => {
  let iconName = '';
  let isBrand = false;
  let cleanChildren = children;

  const extractIcon = (nodes: any): any => {
    return React.Children.map(nodes, child => {
      if (typeof child === 'string') {
        let match = child.match(/^!icon-([\w-]+)!\s*/i);
        if (match) {
          iconName = match[1];
          return child.replace(match[0], '');
        }
        match = child.match(/^!brand-([\w-]+)!\s*/i);
        if (match) {
          iconName = match[1];
          isBrand = true;
          return child.replace(match[0], '');
        }
      }
      return child;
    });
  };

  cleanChildren = extractIcon(children);

  return (
    <Tag className={className} {...props}>
      <span className="inline-flex items-center gap-2 align-middle">
        {iconName && (
          isBrand ? (
            <Brand name={iconName as any} className="shrink-0" size={Tag === 'h1' ? 32 : Tag === 'h2' ? 28 : 24} />
          ) : (
            <CaralIcon name={iconName as any} className="text-blue-500 shrink-0" size={Tag === 'h1' ? 32 : Tag === 'h2' ? 28 : 24} />
          )
        )}
        <span>{cleanChildren}</span>
      </span>
    </Tag>
  );
};

const preprocessAdmonitions = (text: string) => {
  // Convert :::type [title] or :::type(title) to blockquotes with magic tag
  return text.replace(/^:::(\w+)(?:\((.*?)\)|[ \t]+(.*?))?\s*\n([\s\S]*?)\n:::/gm, (match, type, title1, title2, body) => {
    const rawTitle = title1 || title2;
    const safeTitle = rawTitle ? rawTitle.trim() : type.toUpperCase();
    const encodedTitle = encodeURIComponent(safeTitle);
    const bodyWithQuotes = body.split('\n').map(line => `> ${line}`).join('\n');
    return `> !ADMONITION:${type}:${encodedTitle}!\n${bodyWithQuotes}`;
  });
};

const preprocessCustomComponents = (text: string) => {
  let newText = text.replace(/\\?<CrestoneConnections\s*\/>/gi, '!CRESTONE_CONNECTIONS!');
  newText = newText.replace(/\\?<Archivos\s+source=["']([^"']+)["']\s*\/>/gi, '!ARCHIVOS:$1!');
  newText = newText.replace(/\\?<DocInsert\s+id=["']([^"']+)["']\s*\/>/gi, '!DOCINSERT:$1!');

  newText = newText.replace(/\\?<Webinar\s+([\s\S]*?)\/>/gi, (match, attrsString) => {
    const attrs: Record<string, string> = {};
    const attrRegex = /(\w+)\s*=\s*("([^"]*)"|\{([^}]*)\})/g;
    let attrMatch;
    while ((attrMatch = attrRegex.exec(attrsString)) !== null) {
      const key = attrMatch[1];
      let value = attrMatch[3] !== undefined ? attrMatch[3] : attrMatch[4];
      if (value) {
        if (key === 'description') {
          // Clean up pseudo-JSX HTML tags from DB content
          value = value.replace(/<p>/gi, '').replace(/<\/p>/gi, '').replace(/<b>/gi, '**').replace(/<\/b>/gi, '**').replace(/<br\s*\/?>/gi, '\n').trim();
        }
        attrs[key] = value;
      }
    }

    const encoded = typeof btoa === 'function' ? btoa(encodeURIComponent(JSON.stringify(attrs))) : '';
    return `\n\n!WEBINAR:${encoded}!\n\n`;
  });

  return newText;
};

const preprocessLineBreaks = (text: string) => {
  return text.replace(/<br\s*\/?>/gi, '  \n');
};

export default function MarkdownRenderer({ content, noTableBorders = false }: { content: string, noTableBorders?: boolean }) {
  const processedContent = preprocessLineBreaks(preprocessCustomComponents(preprocessAdmonitions(content)));

  return (
    <div className={`prose prose-neutral dark:prose-invert max-w-none 
      prose-headings:font-poppins prose-headings:font-bold
      prose-a:text-blue-600 dark:prose-a:text-blue-400
      prose-code:text-info-main prose-code:bg-info-main/10 prose-code:px-1 prose-code:rounded
      prose-pre:bg-neutral-900 prose-pre:text-neutral-100
      ${noTableBorders ? 'prose-table:border-none prose-th:border-none prose-td:border-none prose-tr:border-none [&_table]:!border-none [&_th]:!border-none [&_td]:!border-none [&_tr]:!border-none' : ''}`}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          table: ({ node, ...props }) => <div className="overflow-x-auto"><table className={`min-w-full ${noTableBorders ? 'border-none' : ''}`} {...props} /></div>,
          th: ({ node, ...props }) => <th className={`${noTableBorders ? 'border-none p-2' : ''}`} {...props} />,
          td: ({ node, ...props }) => <td className={`${noTableBorders ? 'border-none p-2' : ''}`} {...props} />,
          p: ({ node, children, ...props }) => {
            const rawText = extractText(children).trim();
            if (rawText === '!CRESTONE_CONNECTIONS!') {
              return <CrestoneConnections />;
            }
            if (rawText.startsWith('!PRODUCT_FEATURE:')) {
              const match = rawText.match(/^!PRODUCT_FEATURE:([^:]+):([^:]+):([^!]+)!$/);
              if (match) {
                const [, productId, featureTitle, format] = match;
                return <DynamicFeature productId={productId} featureTitle={featureTitle} format={format as any} />;
              }
            }
            if (rawText.startsWith('!ARCHIVOS:')) {
              const match = rawText.match(/^!ARCHIVOS:(.+)!$/);
              if (match) {
                return <Archivos source={match[1]} />;
              }
            }
            if (rawText.startsWith('!DOCINSERT:')) {
              const match = rawText.match(/^!DOCINSERT:(.+)!$/);
              if (match) {
                return <DocInsert id={match[1]} />;
              }
            }
            if (rawText.startsWith('!WEBINAR:')) {
              const match = rawText.match(/^!WEBINAR:(.+)!$/);
              if (match) {
                try {
                  const decoded = decodeURIComponent(typeof atob === 'function' ? atob(match[1]) : '');
                  const properties = JSON.parse(decoded);
                  return (
                    <Webinar
                      title={String(properties.title || '')}
                      duration={String(properties.duration || '')}
                      lang={String(properties.lang || '')}
                      description={String(properties.description || '')}
                      speakers={properties.speakers ? String(properties.speakers) : undefined}
                      img={String(properties.img || '')}
                      url={String(properties.url || '')}
                      version={String(properties.version || '')}
                    />
                  );
                } catch (e) {
                  return <p className="mb-4 text-red-500">Error parseando Webinar</p>;
                }
              }
            }
            if (/^!(icon|brand)-([\w-]+)!/i.test(rawText)) {
              return renderTitleWithIcon('p', children, props, "mb-4 flex items-center gap-1.5 align-middle");
            }
            return <p className="mb-4" {...props}>{children}</p>;
          },
          h1: ({ node, children, ...props }) => {
            return renderTitleWithIcon('h1', children, props, "text-3xl font-bold mt-8 mb-4 text-blue-600 dark:text-blue-400 flex items-center gap-3");
          },
          h2: ({ node, children, ...props }) => {
            const rawText = extractText(children);
            const id = rawText.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
            return renderTitleWithIcon('h2', children, { ...props, id }, "text-2xl font-bold mt-8 mb-4 scroll-mt-[100px] flex items-center gap-2");
          },
          h3: ({ node, children, ...props }) => {
            const rawText = extractText(children);
            const id = rawText.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
            return renderTitleWithIcon('h3', children, { ...props, id }, "text-xl font-bold mt-6 mb-3 scroll-mt-[100px] flex items-center gap-2");
          },
          h4: ({ node, children, ...props }) => {
            const rawText = extractText(children);
            const id = rawText.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
            return renderTitleWithIcon('h4', children, { ...props, id }, "text-lg font-bold mt-5 mb-2 scroll-mt-[100px] flex items-center gap-2");
          },
          h5: ({ node, children, ...props }) => {
            const rawText = extractText(children);
            const id = rawText.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
            return renderTitleWithIcon('h5', children, { ...props, id }, "text-base font-bold mt-4 mb-2 scroll-mt-[100px] flex items-center gap-2");
          },
          h6: ({ node, children, ...props }) => {
            const rawText = extractText(children);
            const id = rawText.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
            return renderTitleWithIcon('h6', children, { ...props, id }, "text-sm font-bold mt-4 mb-2 scroll-mt-[100px] flex items-center gap-2 uppercase tracking-wider text-neutral-500");
          },
          strong: ({ node, children, ...props }) => {
            return renderTitleWithIcon('strong', children, props, "font-bold inline-flex items-center gap-1.5 align-middle");
          },
          a: ({ node, ...props }) => <a className="text-blue-500 hover:underline" target="_blank" rel="noopener noreferrer" {...props} />,
          code: ({ node, inline, className, children, ...props }: any) => {
            const match = /language-(\w+)/.exec(className || '');
            return !inline ? (
              <div className="bg-neutral-900 text-neutral-100 rounded-md p-4 my-4 overflow-x-auto text-sm font-mono">
                <code className={className} {...props}>
                  {children}
                </code>
              </div>
            ) : (
              <code className="bg-neutral-100 dark:bg-neutral-800 text-pink-500 dark:text-pink-400 px-1.5 py-0.5 rounded-md text-sm font-mono" {...props}>
                {children}
              </code>
            );
          },
          blockquote: ({ node, children, ...props }) => {
            const rawText = extractText(children).trim();
            const legacyMatch = rawText.match(/^!ADMONITION:(\w+):(.*?)(?:!)/);
            const githubAlertMatch = rawText.match(/^\[!(NOTE|TIP|INFO|WARNING|CAUTION|DANGER)\]/i);

            if (legacyMatch || githubAlertMatch) {
              let type = '';
              let title = '';
              let tagToRemove = '';

              if (legacyMatch) {
                type = legacyMatch[1].toLowerCase();
                const encodedTitle = legacyMatch[2];
                try {
                  title = decodeURIComponent(encodedTitle).trim().replace(/^<|>$/g, '');
                } catch {
                  title = encodedTitle.trim().replace(/^<|>$/g, '');
                }
                tagToRemove = `!ADMONITION:${legacyMatch[1]}:${encodedTitle}!`;
              } else if (githubAlertMatch) {
                type = githubAlertMatch[1].toLowerCase();
                if (type === 'caution') type = 'danger';

                const line = rawText.split('\n')[0];
                const titleMatch = line.match(/^\[!.*?\]\s*(.*)$/i);
                title = (titleMatch && titleMatch[1]) ? titleMatch[1].trim() : type.toUpperCase();

                tagToRemove = githubAlertMatch[0];
              }

              let removed = false;
              const cleanChildren = (nodes: any): any => {
                return React.Children.map(nodes, child => {
                  if (removed) return child;
                  if (typeof child === 'string') {
                    if (child.includes(tagToRemove)) {
                      removed = true;
                      return child.replace(tagToRemove, '').replace(/^\s+/, '');
                    }
                    return child;
                  }
                  if (React.isValidElement(child)) {
                    return React.cloneElement(child, {}, cleanChildren((child.props as any).children));
                  }
                  return child;
                });
              };

              if (type === 'split') {
                const [imgUrl, widthParam = '1/3'] = title.split('|');

                let imgWidthClass = 'w-1/3';
                let textWidthClass = 'w-2/3';

                if (widthParam === '1/4') { imgWidthClass = 'w-1/4'; textWidthClass = 'w-3/4'; }
                else if (widthParam === '1/2') { imgWidthClass = 'w-1/2'; textWidthClass = 'w-1/2'; }
                else if (widthParam === '2/3') { imgWidthClass = 'w-2/3'; textWidthClass = 'w-1/3'; }
                else if (widthParam === '3/4') { imgWidthClass = 'w-3/4'; textWidthClass = 'w-1/4'; }

                return (
                  <div className="flex flex-row items-center gap-2">
                    <div className={`${imgWidthClass} flex flex-col justify-center items-center shrink-0`}>
                      <img src={imgUrl} alt="Visual" className="max-w-full h-auto object-contain rounded-lg" />
                    </div>
                    <div className={`${textWidthClass} flex flex-col prose-p:my-2 prose-headings:mt-6 first:prose-headings:mt-0`}>
                      {cleanChildren(children)}
                    </div>
                  </div>
                );
              }

              const admonitionStyles: Record<string, any> = {
                note: {
                  bgDark: 'bg-neutral-700', bgLight: 'bg-neutral-100 dark:bg-neutral-800',
                  textDark: 'text-neutral-700 dark:text-neutral-300', textLight: 'text-neutral-600 dark:text-neutral-400',
                  icon: 'circleInfo'
                },
                tip: {
                  bgDark: 'bg-success-main', bgLight: 'bg-success-main/10 dark:bg-success-main/20',
                  textDark: 'text-success-main', textLight: 'text-success-main',
                  icon: 'leaf'
                },
                info: {
                  bgDark: 'bg-info-main', bgLight: 'bg-info-main/10 dark:bg-info-main/20',
                  textDark: 'text-info-hard dark:text-info-light', textLight: 'text-info-main dark:text-info-light',
                  icon: 'circleInfo'
                },
                warning: {
                  bgDark: 'bg-warning-main', bgLight: 'bg-warning-main/10 dark:bg-warning-main/20',
                  textDark: 'text-warning-hard dark:text-warning-light', textLight: 'text-warning-main dark:text-warning-light',
                  icon: 'triangleExclamation'
                },
                danger: {
                  bgDark: 'bg-danger-main', bgLight: 'bg-danger-main/10 dark:bg-danger-main/20',
                  textDark: 'text-danger-hard dark:text-danger-light', textLight: 'text-danger-main dark:text-danger-light',
                  icon: 'xCircle'
                }
              };

              const style = admonitionStyles[type] || admonitionStyles.note;

              return (
                <div className={`my-6 flex overflow-hidden rounded-md shadow-sm ${style.bgLight}`}>
                  <div className={`flex-shrink-0 flex items-center justify-center w-12 ${style.bgDark}`}>
                    <CaralIcon name={style.icon} size={24} color='white' />
                  </div>
                  <div className="flex-1 p-4">
                    <div className={`font-bold text-lg mb-1 ${style.textDark}`}>
                      {title}
                    </div>
                    <div className={`text-sm [&>*:first-child]:mt-0 [&>*:last-child]:mb-0 ${style.textLight}`}>
                      {cleanChildren(children)}
                    </div>
                  </div>
                </div>
              );
            }

            return (
              <blockquote className="border-l-4 border-blue-500 pl-4 italic text-neutral-600 dark:text-neutral-400 my-4 bg-blue-50 dark:bg-blue-900/20 py-2 pr-4 rounded-r-md" {...props}>
                {children}
              </blockquote>
            );
          },
          img: ({ node, src, alt, ...props }) => {
            if (!src) return <img alt={alt} {...props} />;
            const [url, hash] = src.split('#');
            let alignClass = '';
            if (hash === 'align-center') alignClass = 'mx-auto block';
            else if (hash === 'align-left') alignClass = 'mr-auto block';
            else if (hash === 'align-right') alignClass = 'ml-auto block';
            else if (hash === 'full-width') alignClass = 'w-full block';
            else alignClass = 'mx-auto block'; // Default to center for layout consistency

            let styleObj: React.CSSProperties = {};
            if (alt && !isNaN(Number(alt))) {
              const scale = Number(alt);
              styleObj.width = `${scale * 100}%`;
            }

            return <img src={url} alt={alt} className={`${alignClass} max-w-full`} style={styleObj} {...props} />;
          },
          table: ({ node, ...props }) => (
            <div className="overflow-x-auto my-6">
              <table className="w-full text-left border-collapse" {...props} />
            </div>
          ),
          th: ({ node, className, children, ...props }) => {
            const rawText = extractText(children).trim();
            if (rawText.startsWith('!PRODUCT_FEATURE:')) {
              const match = rawText.match(/^!PRODUCT_FEATURE:([^:]+):([^:]+):([^!]+)!$/);
              if (match) {
                const [, productId, featureTitle, format] = match;
                return (
                  <th className={`border-b-2 border-neutral-200 dark:border-neutral-700 p-2 font-semibold ${className || ''}`} {...props}>
                    <DynamicFeature productId={productId} featureTitle={featureTitle} format={format as any} />
                  </th>
                );
              }
            }
            if (/^!(icon|brand)-([\w-]+)!/i.test(rawText)) {
              return renderTitleWithIcon('th', children, { ...props }, `border-b-2 border-neutral-200 dark:border-neutral-700 p-2 font-semibold ${className || ''}`);
            }
            return <th className={`border-b-2 border-neutral-200 dark:border-neutral-700 p-2 font-semibold ${className || ''}`} {...props}>{children}</th>;
          },
          td: ({ node, className, children, ...props }) => {
            const rawText = extractText(children).trim();
            if (rawText.startsWith('!PRODUCT_FEATURE:')) {
              const match = rawText.match(/^!PRODUCT_FEATURE:([^:]+):([^:]+):([^!]+)!$/);
              if (match) {
                const [, productId, featureTitle, format] = match;
                return (
                  <td className={`border-b border-neutral-200 dark:border-neutral-800 p-2 ${className || ''}`} {...props}>
                    <DynamicFeature productId={productId} featureTitle={featureTitle} format={format as any} />
                  </td>
                );
              }
            }
            if (/^!(icon|brand)-([\w-]+)!/i.test(rawText)) {
              return renderTitleWithIcon('td', children, { ...props }, `border-b border-neutral-200 dark:border-neutral-800 p-2 ${className || ''}`);
            }
            return <td className={`border-b border-neutral-200 dark:border-neutral-800 p-2 ${className || ''}`} {...props}>{children}</td>;
          },
          ul: ({ node, className, ...props }) => <ul style={{ listStyleType: 'disc', paddingLeft: '1.5rem' }} className={`my-4 space-y-2 text-neutral-700 dark:text-neutral-300 ${className || ''}`} {...props} />,
          ol: ({ node, className, ...props }) => <ol style={{ listStyleType: 'decimal', paddingLeft: '1.5rem' }} className={`my-4 space-y-2 text-neutral-700 dark:text-neutral-300 ${className || ''}`} {...props} />,
          li: ({ node, className, ...props }) => <li className={`leading-relaxed ${className || ''}`} {...props} />,
        }}
      >
        {processedContent}
      </ReactMarkdown>
    </div>
  );
}
