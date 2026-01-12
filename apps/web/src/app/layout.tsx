import React from 'react';
import './globals.css';
import { AuthProvider } from '../contexts/AuthContext';

export const metadata = {
  title: 'OSChat - Modern Chat Application',
  description: 'Realtime chat application with Next.js and Socket.io',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}

