
import React from 'react';
import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Cashwrap | Receipt Monitoring System',
  description: 'Enterprise inventory management for branch receipts and warehouse logistics.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased bg-gray-50 text-slate-900">
        {children}
      </body>
    </html>
  );
}
