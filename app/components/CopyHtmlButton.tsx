'use client';

import React, { useState } from 'react';
import { Button } from 'caralstable';

export default function CopyHtmlButton({ targetId }: { targetId: string }) {
  const [copied, setCopied] = useState(false);

  const applyInlineStyles = (element: HTMLElement) => {
    const styles: Record<string, string> = {
      H1: "color:#000000; font-weight:700; font-family:Poppins,Arial,sans-serif; font-size:32px; line-height:40px; margin-bottom:20px; margin-top:20px; text-align:left;",
      H2: "color:#000000; font-weight:600; font-family:Poppins,Arial,sans-serif; font-size:24px; line-height:32px; margin-bottom:15px; margin-top:20px; text-align:left;",
      H3: "color:#000000; font-weight:600; font-family:Poppins,Arial,sans-serif; font-size:20px; line-height:28px; margin-bottom:12px; margin-top:15px; text-align:left;",
      H4: "color:#000000; font-weight:600; font-family:Poppins,Arial,sans-serif; font-size:18px; line-height:26px; margin-bottom:12px; margin-top:12px; text-align:left;",
      P: "color:#333333; font-family:Poppins,Arial,sans-serif; font-size:16px; line-height:24px; margin-bottom:16px; margin-top:0; text-align:left;",
      A: "color:#2563eb; text-decoration:underline; font-family:Poppins,Arial,sans-serif;",
      IMG: "max-width:100%; height:auto; display:block; margin-top:15px; margin-bottom:15px; border-radius: 8px;",
      UL: "color:#333333; font-family:Poppins,Arial,sans-serif; font-size:16px; line-height:24px; margin-bottom:16px; padding-left: 20px;",
      OL: "color:#333333; font-family:Poppins,Arial,sans-serif; font-size:16px; line-height:24px; margin-bottom:16px; padding-left: 20px;",
      LI: "margin-bottom:8px;",
      STRONG: "font-weight:700; color:#000000;",
      TABLE: "width:100%; max-width: 100%; border-collapse:collapse; margin-bottom:20px; font-family:Poppins,Arial,sans-serif;",
      TH: "padding:12px; border-bottom:2px solid #e5e5e5; text-align:left; font-weight:600; color:#000000; font-size:16px;",
      TD: "padding:12px; border-bottom:1px solid #e5e5e5; color:#333333; font-size:16px;",
      SPAN: "display:inline-block; vertical-align:middle;",
      SVG: "vertical-align:middle; display:inline-block;",
      TIME: "color:#666666; font-size:14px; font-family:Poppins,Arial,sans-serif; display:block; margin-bottom:20px;",
      BLOCKQUOTE: "border-left: 4px solid #3b82f6; padding-left: 15px; font-style: italic; color: #555555; background-color: #f0fdfa; padding-top: 10px; padding-bottom: 10px; margin-bottom: 20px;"
    };

    const allElements = element.querySelectorAll('*');
    allElements.forEach((el) => {
      const htmlEl = el as HTMLElement;
      const tag = htmlEl.tagName.toUpperCase();

      // Remove all class names so email clients don't get confused
      htmlEl.removeAttribute('class');

      // Apply the specific inline styles
      if (styles[tag]) {
        htmlEl.style.cssText += styles[tag];
      }

      // If it is an image, make sure we remove the src set just in case, use absolute src
      if (tag === 'IMG' && htmlEl.hasAttribute('src')) {
        const src = htmlEl.getAttribute('src');
        if (src?.startsWith('/')) {
          htmlEl.setAttribute('src', window.location.origin + src);
        }
      }
    });

    // Also apply a general style to the container itself
    element.style.cssText = "font-family:Poppins,Arial,sans-serif; background-color:#ffffff; padding:0;";
    element.removeAttribute('class');
  };

  const wrapInEmailTemplate = (innerHtml: string) => {
    return `<!doctype html>
<html lang="es" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
<meta charset="utf-8" />
<meta content="width=device-width" name="viewport" />
<meta content="IE=edge" http-equiv="X-UA-Compatible" />
<meta name="x-apple-disable-message-reformatting" />
<meta content="telephone=no,address=no,email=no,date=no,url=no" name="format-detection" />
<title>Novedades</title>
<!--[if mso]>
  <style>
      * {
          font-family: sans-serif !important;
      }
  </style>
<![endif]-->
<link href="https://fonts.googleapis.com/css?family=Poppins:600" rel="stylesheet" type="text/css">
<link href="https://fonts.googleapis.com/css?family=Poppins:400" rel="stylesheet" type="text/css">
<link href="https://fonts.googleapis.com/css?family=Poppins:700" rel="stylesheet" type="text/css">
<style>
html { margin: 0 !important; padding: 0 !important; }
* { -ms-text-size-adjust: 100%; -webkit-text-size-adjust: 100%; }
td { vertical-align: top; mso-table-lspace: 0pt !important; mso-table-rspace: 0pt !important; }
a { text-decoration: none; }
img { -ms-interpolation-mode:bicubic; }
.email-container { width: 100% !important; margin: auto !important; max-width: 834px !important; }
@media only screen and (max-width: 834px) {
  .email-container { width: 100% !important; margin: auto !important; }
}
</style>
<!--[if gte mso 9]>
  <xml>
      <o:OfficeDocumentSettings>
          <o:AllowPNG/>
          <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
  </xml>
<![endif]-->
</head>
<body width="100%" style="margin:0;padding:0!important;mso-line-height-rule:exactly;background-color:#ffffff;">
<div style="background-color:#ffffff; padding-top: 20px; padding-bottom: 20px;">
<!--[if gte mso 9]>
  <v:background xmlns:v="urn:schemas-microsoft-com:vml" fill="t">
  <v:fill type="tile" color="#ffffff"/>
  </v:background>
<![endif]-->
<table width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#ffffff">
<tr><td valign="top" align="center">
  <table bgcolor="#ffffff" style="margin:0 auto; max-width:834px;" align="center" cellspacing="0" cellpadding="0" border="0" width="100%" class="email-container">
  <tr><td width="100%" style="padding:20px; text-align:left; background-color:#ffffff; color:#000000; border-radius:12px;">
    ${innerHtml}
  </td></tr>
  </table>
</td></tr>
</table>
</div>
</body>
</html>`;
  };

  const convertSvgsToPngs = async (element: HTMLElement) => {
    const svgs = Array.from(element.querySelectorAll('svg'));

    for (const svg of svgs) {
      try {
        const width = svg.getAttribute('width') || svg.getBoundingClientRect().width || 24;
        const height = svg.getAttribute('height') || svg.getBoundingClientRect().height || 24;
        const color = window.getComputedStyle(svg).color || '#000000';

        let svgData = new XMLSerializer().serializeToString(svg);
        if (!svgData.includes('xmlns="http://www.w3.org/2000/svg"')) {
          svgData = svgData.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"');
        }
        // Fix currentColor for canvas rendering
        svgData = svgData.replace(/"currentColor"/g, `"${color}"`);

        const canvas = document.createElement("canvas");
        canvas.width = parseInt(width.toString(), 10) * 2;
        canvas.height = parseInt(height.toString(), 10) * 2;
        const ctx = canvas.getContext("2d");

        const img = new Image();
        const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
        const url = URL.createObjectURL(svgBlob);

        await new Promise((resolve) => {
          img.onload = () => {
            if (ctx) {
              ctx.scale(2, 2);
              ctx.drawImage(img, 0, 0);
              const pngDataUrl = canvas.toDataURL("image/png");

              const newImg = document.createElement('img');
              newImg.src = pngDataUrl;
              newImg.width = parseInt(width.toString(), 10);
              newImg.height = parseInt(height.toString(), 10);
              newImg.style.verticalAlign = 'middle';
              newImg.style.display = 'inline-block';

              svg.replaceWith(newImg);
            }
            URL.revokeObjectURL(url);
            resolve(null);
          };
          img.onerror = () => {
            URL.revokeObjectURL(url);
            resolve(null);
          };
          img.src = url;
        });
      } catch (e) {
        console.error("Error converting SVG:", e);
      }
    }
  };

  const handleCopy = async () => {
    try {
      const element = document.getElementById(targetId);
      if (!element) {
        console.error('Target element not found');
        return;
      }

      // Clone node for manipulation
      const clone = element.cloneNode(true) as HTMLElement;

      // Temporarily append clone to body to get computed styles for SVGs
      clone.style.position = 'absolute';
      clone.style.left = '-9999px';
      document.body.appendChild(clone);

      // Convert SVGs to PNGs
      await convertSvgsToPngs(clone);

      // Inline styles and cleanup classes
      applyInlineStyles(clone);

      // Generate final raw HTML string
      const fullHtml = wrapInEmailTemplate(clone.innerHTML); // changed from outerHTML to innerHTML to avoid wrapping in the absolute positioning div

      // Remove temporary clone from body
      document.body.removeChild(clone);

      // Write to clipboard as text/plain so it acts like code
      const blobText = new Blob([fullHtml], { type: 'text/plain' });

      const data = [new ClipboardItem({
        'text/plain': blobText,
      })];

      await navigator.clipboard.write(data);

      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy: ', err);
      alert('Error al copiar el contenido');
    }
  };

  return (
    <Button
      variant="ghost"
      iconName={copied ? 'check' : 'code'}
      onClick={handleCopy}
      className="border border-neutral-800 w-full"
    >
      {copied ? 'Código Copiado!' : 'Copiar HTML'}
    </Button>
  );
}
