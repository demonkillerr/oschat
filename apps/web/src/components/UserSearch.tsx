'use client';

import { useState } from 'react';
import { usersApi, conversationsApi } from '../lib/api';

interface User {
  _id: string;
  name: string;
  email: string;
  avatar?: string;
  status: string;
}

interface UserSearchProps {
  onConversationCreated: (conversationId: string) => void;
  onClose: () => void;
}

export default function UserSearch({ onConversationCreated, onClose }: UserSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);

  const handleSearch = async (searchQuery: string) => {
    setQuery(searchQuery);
    
    if (searchQuery.trim().length < 2) {
      setResults([]);
      return;
    }

    setLoading(true);
    try {
      const response = await usersApi.search(searchQuery);
      setResults(response.data.users);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectUser = async (user: User) => {
    setCreating(true);
    try {
      const response = await conversationsApi.create({
        type: 'direct',
        participantIds: [user._id],
      });
      onConversationCreated(response.data.conversation._id);
      onClose();
    } catch (error) {
      console.error('Failed to create conversation:', error);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '1rem',
    }}>
      <div style={{
        background: 'white',
        borderRadius: '1rem',
        maxWidth: '500px',
        width: '100%',
        maxHeight: '80vh',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
      }}>
        {/* Header */}
        <div style={{
          padding: '1.5rem',
          borderBottom: '1px solid #e5e7eb',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 600 }}>
            Start a Conversation
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '1.5rem',
              cursor: 'pointer',
              color: '#999',
              padding: '0.25rem',
              lineHeight: 1,
            }}
          >
            ×
          </button>
        </div>

        {/* Search Input */}
        <div style={{ padding: '1rem 1.5rem' }}>
          <input
            type="text"
            value={query}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Search users by name or email..."
            autoFocus
            style={{
              width: '100%',
              padding: '0.75rem 1rem',
              border: '1px solid #e5e7eb',
              borderRadius: '0.5rem',
              fontSize: '0.9375rem',
              outline: 'none',
            }}
          />
        </div>

        {/* Results */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '0 1.5rem 1.5rem',
        }}>
          {loading && (
            <div style={{ textAlign: 'center', padding: '2rem', color: '#999' }}>
              Searching...
            </div>
          )}

          {!loading && query.trim().length >= 2 && results.length === 0 && (
            <div style={{ textAlign: 'center', padding: '2rem', color: '#999' }}>
              No users found
            </div>
          )}

          {!loading && results.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {results.map((user) => (
                <button
                  key={user._id}
                  onClick={() => handleSelectUser(user)}
                  disabled={creating}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem',
                    padding: '1rem',
                    border: '1px solid #e5e7eb',
                    borderRadius: '0.5rem',
                    background: 'white',
                    cursor: creating ? 'not-allowed' : 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.15s',
                  }}
                  onMouseEnter={(e) => {
                    if (!creating) e.currentTarget.style.background = '#f9fafb';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'white';
                  }}
                >
                  <div style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.25rem',
                    flexShrink: 0,
                    position: 'relative',
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
                      <span style={{ color: 'white' }}>
                        {user.name.charAt(0).toUpperCase()}
                      </span>
                    )}
                    {user.status === 'online' && (
                      <div style={{
                        position: 'absolute',
                        bottom: 0,
                        right: 0,
                        width: '12px',
                        height: '12px',
                        background: '#4ade80',
                        border: '2px solid white',
                        borderRadius: '50%',
                      }} />
                    )}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontSize: '1rem',
                      fontWeight: 600,
                      color: '#111',
                      marginBottom: '0.25rem',
                    }}>
                      {user.name}
                    </div>
                    <div style={{
                      fontSize: '0.875rem',
                      color: '#666',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}>
                      {user.email}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {!loading && query.trim().length < 2 && (
            <div style={{ textAlign: 'center', padding: '2rem', color: '#999' }}>
              Type at least 2 characters to search
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
