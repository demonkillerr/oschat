import React from 'react';
import './globals.css';

export const metadata = {
  title: 'oschat',
  description: 'Realtime chat app',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

