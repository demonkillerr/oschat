'use client';

import { useState, useEffect } from 'react';
import { conversationsApi } from '../lib/api';
import { formatDistanceToNow } from 'date-fns';

interface Participant {
  _id: string;
  name: string;
  email: string;
  avatar?: string;
  status: string;
}

interface Message {
  _id: string;
  text: string;
  sender: Participant;
  createdAt: string;
}

interface Conversation {
  _id: string;
  type: 'direct' | 'group';
  name?: string;
  participants: Participant[];
  lastMessage?: Message;
  lastMessageAt: string;
  avatar?: string;
}

interface ConversationListProps {
  onSelectConversation: (conversation: Conversation) => void;
  selectedId?: string;
  currentUserId: string;
}

export default function ConversationList({ onSelectConversation, selectedId, currentUserId }: ConversationListProps) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadConversations();
  }, []);

  const loadConversations = async () => {
    try {
      const response = await conversationsApi.getAll();
      setConversations(response.data.conversations);
    } catch (error) {
      console.error('Failed to load conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const getConversationDisplay = (conv: Conversation) => {
    if (conv.type === 'group') {
      return {
        name: conv.name || 'Unnamed Group',
        avatar: conv.avatar || '👥',
      };
    }
    
    // For direct chats, show the other participant
    const otherParticipant = conv.participants.find(p => p._id !== currentUserId);
    return {
      name: otherParticipant?.name || 'Unknown User',
      avatar: otherParticipant?.avatar || '👤',
      status: otherParticipant?.status,
    };
  };

  if (loading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', color: '#999' }}>
        Loading conversations...
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', color: '#999' }}>
        <p>No conversations yet.</p>
        <p style={{ fontSize: '0.875rem', marginTop: '0.5rem' }}>
          Search for users to start chatting!
        </p>
      </div>
    );
  }

  return (
    <div style={{ height: '100%', overflowY: 'auto' }}>
      {conversations.map((conv) => {
        const display = getConversationDisplay(conv);
        const isSelected = conv._id === selectedId;
        const lastMessageText = conv.lastMessage?.text || 'No messages yet';
        const lastMessageTime = conv.lastMessageAt 
          ? formatDistanceToNow(new Date(conv.lastMessageAt), { addSuffix: true })
          : '';

        return (
          <div
            key={conv._id}
            onClick={() => onSelectConversation(conv)}
            style={{
              padding: '1rem',
              borderBottom: '1px solid #eee',
              cursor: 'pointer',
              background: isSelected ? '#f0f4ff' : 'white',
              transition: 'background 0.15s',
            }}
            onMouseEnter={(e) => {
              if (!isSelected) e.currentTarget.style.background = '#f9f9f9';
            }}
            onMouseLeave={(e) => {
              if (!isSelected) e.currentTarget.style.background = 'white';
            }}
          >
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.5rem',
                flexShrink: 0,
                position: 'relative',
              }}>
                {display.avatar && display.avatar.startsWith('http') ? (
                  <img
                    src={display.avatar}
                    alt={display.name}
                    style={{
                      width: '100%',
                      height: '100%',
                      borderRadius: '50%',
                      objectFit: 'cover',
                    }}
                  />
                ) : (
                  <span>{display.avatar}</span>
                )}
                {display.status === 'online' && conv.type === 'direct' && (
                  <div style={{
                    position: 'absolute',
                    bottom: 0,
                    right: 0,
                    width: '14px',
                    height: '14px',
                    background: '#4ade80',
                    border: '2px solid white',
                    borderRadius: '50%',
                  }} />
                )}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'baseline',
                  marginBottom: '0.25rem',
                }}>
                  <h3 style={{
                    margin: 0,
                    fontSize: '1rem',
                    fontWeight: 600,
                    color: '#222',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}>
                    {display.name}
                  </h3>
                  <span style={{
                    fontSize: '0.75rem',
                    color: '#999',
                    flexShrink: 0,
                    marginLeft: '0.5rem',
                  }}>
                    {lastMessageTime}
                  </span>
                </div>
                <p style={{
                  margin: 0,
                  fontSize: '0.875rem',
                  color: '#666',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}>
                  {conv.lastMessage && (
                    <span style={{ fontWeight: 500, color: '#999' }}>
                      {conv.lastMessage.sender._id === currentUserId ? 'You: ' : `${conv.lastMessage.sender.name}: `}
                    </span>
                  )}
                  {lastMessageText}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
