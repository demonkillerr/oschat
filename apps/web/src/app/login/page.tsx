'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

function LoginContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error');

  const handleGoogleLogin = () => {
    window.location.href = `${API_URL}/api/auth/google`;
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
    }}>
      <div style={{
        background: 'white',
        padding: '3rem',
        borderRadius: '1rem',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
        maxWidth: '400px',
        width: '90%',
        textAlign: 'center'
      }}>
        <h1 style={{ marginBottom: '1rem', color: '#333' }}>Welcome to OSChat</h1>
        <p style={{ color: '#666', marginBottom: '2rem' }}>Sign in to start chatting</p>
        
        {error && (
          <div style={{
            padding: '0.75rem',
            marginBottom: '1rem',
            background: '#fee',
            color: '#c33',
            borderRadius: '0.5rem',
            fontSize: '0.875rem'
          }}>
            {error === 'auth_failed' && 'Authentication failed. Please try again.'}
            {error === 'server_error' && 'Server error. Please try again later.'}
            {error === 'login_failed' && 'Login failed. Please try again.'}
          </div>
        )}

        <button
          onClick={handleGoogleLogin}
          style={{
            width: '100%',
            padding: '0.875rem',
            background: '#fff',
            color: '#333',
            border: '2px solid #ddd',
            borderRadius: '0.5rem',
            fontSize: '1rem',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.75rem',
            transition: 'all 0.2s'
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.background = '#f9f9f9';
            e.currentTarget.style.borderColor = '#667eea';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.background = '#fff';
            e.currentTarget.style.borderColor = '#ddd';
          }}
        >
          <svg width="18" height="18" viewBox="0 0 18 18">
            <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"/>
            <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z"/>
            <path fill="#FBBC05" d="M3.964 10.707c-.18-.54-.282-1.117-.282-1.707 0-.593.102-1.17.282-1.709V4.958H.957C.347 6.173 0 7.548 0 9c0 1.452.348 2.827.957 4.042l3.007-2.335z"/>
            <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"/>
          </svg>
          Continue with Google
        </button>

        <p style={{ marginTop: '2rem', fontSize: '0.875rem', color: '#999' }}>
          By signing in, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LoginContent />
    </Suspense>
  );
}
