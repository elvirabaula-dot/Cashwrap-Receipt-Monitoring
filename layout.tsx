
import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Cashwrap Receipt Monitoring',
  description: 'Enterprise-grade receipt inventory management system.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-gray-50 text-gray-900">
        {children}
      </body>
    </html>
  );
}
