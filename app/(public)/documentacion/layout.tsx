import Navbar from '@/app/components/Navbar';
import React from 'react';

export default function DocumentacionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar></Navbar>
      <div className="flex-1 bg-full">
        {children}
      </div>
    </div>
  );
}
