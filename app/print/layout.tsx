import React from 'react';

export default function PrintLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="print-layout bg-white min-h-screen">
      {children}
      <style dangerouslySetInnerHTML={{ __html: `
        /* Overrides to make printing work in a dedicated layout */
        html, body {
          overflow: visible !important;
          height: auto !important;
          background-color: white !important;
          margin: 0 !important;
          padding: 0 !important;
        }
      ` }} />
    </div>
  );
}
