'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';
import ConversationList from '../../components/ConversationList';
import MessageThread from '../../components/MessageThread';
import UserSearch from '../../components/UserSearch';
import { getSocket, updateSocketAuth } from '../../lib/socket';

interface Conversation {
  _id: string;
  type: 'direct' | 'group';
  name?: string;
  participants: any[];
}

export default function ChatPage() {
  const router = useRouter();
  const { user, token, loading } = useAuth();
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [showUserSearch, setShowUserSearch] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (token) {
      // Connect socket with authentication
      const socket = updateSocketAuth(token);
      
      socket.on('connect', () => {
        console.log('[socket] Connected');
      });

      socket.on('connect_error', (error) => {
        console.error('[socket] Connection error:', error);
      });

      return () => {
        socket.off('connect');
        socket.off('connect_error');
      };
    }
  }, [token]);

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

  const handleConversationCreated = (conversationId: string) => {
    // Refresh conversation list (handled by ConversationList component)
    setShowUserSearch(false);
  };

  return (
    <div style={{
      height: '100vh',
      display: 'flex',
      background: '#f9fafb',
    }}>
      {/* Sidebar */}
      <div style={{
        width: showSidebar ? '380px' : '0',
        background: 'white',
        borderRight: '1px solid #e5e7eb',
        display: 'flex',
        flexDirection: 'column',
        transition: 'width 0.3s',
        overflow: 'hidden',
      }}>
        {/* Sidebar Header */}
        <div style={{
          padding: '1.5rem',
          borderBottom: '1px solid #e5e7eb',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.125rem',
              color: 'white',
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
            <div>
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>
                {user.name}
              </h3>
              <p style={{ margin: 0, fontSize: '0.75rem', color: '#999' }}>
                {user.email}
              </p>
            </div>
          </div>
          <button
            onClick={() => router.push('/settings')}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '1.25rem',
              cursor: 'pointer',
              color: '#999',
              padding: '0.25rem',
            }}
            title="Settings"
          >
            ⚙️
          </button>
        </div>

        {/* Search Button */}
        <div style={{ padding: '1rem' }}>
          <button
            onClick={() => setShowUserSearch(true)}
            style={{
              width: '100%',
              padding: '0.75rem 1rem',
              background: '#667eea',
              color: 'white',
              border: 'none',
              borderRadius: '0.5rem',
              fontSize: '0.9375rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
            }}
          >
            <span style={{ fontSize: '1.125rem' }}>+</span>
            New Conversation
          </button>
        </div>

        {/* Conversations List */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          <ConversationList
            onSelectConversation={setSelectedConversation}
            selectedId={selectedConversation?._id}
            currentUserId={user._id}
          />
        </div>
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {selectedConversation ? (
          <MessageThread
            conversation={selectedConversation}
            currentUserId={user._id}
          />
        ) : (
          <div style={{
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#999',
            gap: '1rem',
          }}>
            <div style={{ fontSize: '4rem' }}>💬</div>
            <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 600, color: '#666' }}>
              Welcome to OSChat
            </h2>
            <p style={{ margin: 0, fontSize: '1rem' }}>
              Select a conversation or start a new one
            </p>
          </div>
        )}
      </div>

      {/* User Search Modal */}
      {showUserSearch && (
        <UserSearch
          onConversationCreated={handleConversationCreated}
          onClose={() => setShowUserSearch(false)}
        />
      )}
    </div>
  );
}
