'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '../../../contexts/AuthContext';

export default function AuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();

  useEffect(() => {
    const token = searchParams.get('token');
    const error = searchParams.get('error');

    if (error) {
      console.error('Auth error:', error);
      router.push('/login?error=' + error);
      return;
    }

    if (token) {
      login(token).then(() => {
        router.push('/chat');
      }).catch((err) => {
        console.error('Login failed:', err);
        router.push('/login?error=login_failed');
      });
    } else {
      router.push('/login');
    }
  }, [searchParams, login, router]);

  return (
    <div style={{ padding: '2rem', textAlign: 'center' }}>
      <h2>Authenticating...</h2>
      <p>Please wait while we log you in.</p>
    </div>
  );
}
