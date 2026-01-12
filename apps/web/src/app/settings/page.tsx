'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';
import { usersApi } from '../../lib/api';
import { format } from 'date-fns';

export default function SettingsPage() {
  const router = useRouter();
  const { user, loading, logout, updateUser } = useAuth();
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
    if (user) {
      setName(user.name);
    }
  }, [user, loading, router]);

  const handleSave = async () => {
    if (!name.trim()) {
      setMessage('Name cannot be empty');
      return;
    }

    setSaving(true);
    setMessage('');

    try {
      const response = await usersApi.updateProfile({ name: name.trim() });
      updateUser(response.data.user);
      setMessage('Profile updated successfully!');
    } catch (error) {
      console.error('Failed to update profile:', error);
      setMessage('Failed to update profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  if (loading) {
    return (
      <div style={{
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#999',
      }}>
        Loading...
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#f9fafb',
      padding: '2rem',
    }}>
      <div style={{
        maxWidth: '800px',
        margin: '0 auto',
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '2rem',
        }}>
          <h1 style={{ margin: 0, fontSize: '2rem', fontWeight: 700, color: '#111' }}>
            Settings
          </h1>
          <button
            onClick={() => router.push('/chat')}
            style={{
              padding: '0.75rem 1.5rem',
              background: '#667eea',
              color: 'white',
              border: 'none',
              borderRadius: '0.5rem',
              fontSize: '0.9375rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Back to Chat
          </button>
        </div>

        {/* Profile Section */}
        <div style={{
          background: 'white',
          borderRadius: '1rem',
          padding: '2rem',
          marginBottom: '1.5rem',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        }}>
          <h2 style={{
            margin: '0 0 1.5rem 0',
            fontSize: '1.25rem',
            fontWeight: 600,
            color: '#111',
          }}>
            Profile Information
          </h2>

          <div style={{ display: 'flex', gap: '2rem', marginBottom: '2rem' }}>
            <div style={{
              width: '100px',
              height: '100px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '3rem',
              color: 'white',
              flexShrink: 0,
            }}>
              {user.avatar && user.avatar.startsWith('http') ? (
                <img
                  src={user.avatar}
                  alt={user.name}
                  style={{
                    width: '100%',
                    height: '100%',
                    borderRadius: '50%',
                    objectFit: 'cover',
                  }}
                />
              ) : (
                <span>{user.name.charAt(0).toUpperCase()}</span>
              )}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '0.5rem',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  color: '#374151',
                }}>
                  Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #e5e7eb',
                    borderRadius: '0.5rem',
                    fontSize: '0.9375rem',
                  }}
                />
              </div>
              <button
                onClick={handleSave}
                disabled={saving || name === user.name}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: (saving || name === user.name) ? '#e5e7eb' : '#667eea',
                  color: (saving || name === user.name) ? '#999' : 'white',
                  border: 'none',
                  borderRadius: '0.5rem',
                  fontSize: '0.9375rem',
                  fontWeight: 600,
                  cursor: (saving || name === user.name) ? 'not-allowed' : 'pointer',
                }}
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
              {message && (
                <p style={{
                  marginTop: '0.75rem',
                  fontSize: '0.875rem',
                  color: message.includes('success') ? '#10b981' : '#ef4444',
                }}>
                  {message}
                </p>
              )}
            </div>
          </div>

          <div style={{
            padding: '1rem',
            background: '#f9fafb',
            borderRadius: '0.5rem',
            marginBottom: '1rem',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.875rem', color: '#666' }}>Email</span>
              <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>{user.email}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.875rem', color: '#666' }}>Provider</span>
              <span style={{ fontSize: '0.875rem', fontWeight: 500, textTransform: 'capitalize' }}>
                {user.provider}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.875rem', color: '#666' }}>Status</span>
              <span style={{ fontSize: '0.875rem', fontWeight: 500, textTransform: 'capitalize' }}>
                {user.status}
              </span>
            </div>
            {user.lastSeen && (
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.875rem', color: '#666' }}>Last Seen</span>
                <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>
                  {format(new Date(user.lastSeen), 'PPpp')}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Account Actions */}
        <div style={{
          background: 'white',
          borderRadius: '1rem',
          padding: '2rem',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        }}>
          <h2 style={{
            margin: '0 0 1.5rem 0',
            fontSize: '1.25rem',
            fontWeight: 600,
            color: '#111',
          }}>
            Account Actions
          </h2>
          <button
            onClick={handleLogout}
            style={{
              padding: '0.75rem 1.5rem',
              background: '#ef4444',
              color: 'white',
              border: 'none',
              borderRadius: '0.5rem',
              fontSize: '0.9375rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}
