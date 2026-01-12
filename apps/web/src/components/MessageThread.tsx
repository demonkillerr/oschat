'use client';

import { useState, useEffect, useRef } from 'react';
import { conversationsApi } from '../lib/api';
import { getSocket } from '../lib/socket';
import { format } from 'date-fns';

interface User {
  _id: string;
  name: string;
  avatar?: string;
}

interface Message {
  _id: string;
  text: string;
  sender: User;
  createdAt: string;
  type: string;
}

interface Participant {
  _id: string;
  name: string;
  avatar?: string;
  status: string;
}

interface Conversation {
  _id: string;
  type: 'direct' | 'group';
  name?: string;
  participants: Participant[];
}

interface MessageThreadProps {
  conversation: Conversation;
  currentUserId: string;
}

export default function MessageThread({ conversation, currentUserId }: MessageThreadProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [typing, setTyping] = useState<Set<string>>(new Set());
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const socketRef = useRef(getSocket());

  useEffect(() => {
    loadMessages();
    
    const socket = socketRef.current;
    
    // Join conversation room
    socket.emit('conversation:join', conversation._id);

    // Listen for new messages
    const handleNewMessage = (data: any) => {
      if (data.conversationId === conversation._id) {
        setMessages(prev => [...prev, data.message]);
        scrollToBottom();
      }
    };

    // Listen for typing indicators
    const handleTypingStart = (data: any) => {
      if (data.conversationId === conversation._id && data.userId !== currentUserId) {
        setTyping(prev => new Set(prev).add(data.userId));
      }
    };

    const handleTypingStop = (data: any) => {
      if (data.conversationId === conversation._id) {
        setTyping(prev => {
          const next = new Set(prev);
          next.delete(data.userId);
          return next;
        });
      }
    };

    socket.on('message:new', handleNewMessage);
    socket.on('typing:start', handleTypingStart);
    socket.on('typing:stop', handleTypingStop);

    return () => {
      socket.emit('conversation:leave', conversation._id);
      socket.off('message:new', handleNewMessage);
      socket.off('typing:start', handleTypingStart);
      socket.off('typing:stop', handleTypingStop);
    };
  }, [conversation._id, currentUserId]);

  const loadMessages = async () => {
    try {
      setLoading(true);
      const response = await conversationsApi.getMessages(conversation._id, { limit: 100 });
      setMessages(response.data.messages);
      scrollToBottom();
    } catch (error) {
      console.error('Failed to load messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleInputChange = (text: string) => {
    setNewMessage(text);

    // Emit typing indicator
    const socket = socketRef.current;
    socket.emit('typing:start', { conversationId: conversation._id });

    // Clear previous timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Stop typing after 2 seconds of inactivity
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('typing:stop', { conversationId: conversation._id });
    }, 2000);
  };

  const sendMessage = () => {
    const text = newMessage.trim();
    if (!text) return;

    const socket = socketRef.current;
    socket.emit('message:send', {
      conversationId: conversation._id,
      text,
      type: 'text',
    });

    socket.emit('typing:stop', { conversationId: conversation._id });
    setNewMessage('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const getConversationName = () => {
    if (conversation.type === 'group') {
      return conversation.name || 'Unnamed Group';
    }
    const otherParticipant = conversation.participants.find(p => p._id !== currentUserId);
    return otherParticipant?.name || 'Unknown User';
  };

  const getTypingText = () => {
    const typingUsers = conversation.participants.filter(p => typing.has(p._id));
    if (typingUsers.length === 0) return null;
    if (typingUsers.length === 1) return `${typingUsers[0].name} is typing...`;
    if (typingUsers.length === 2) return `${typingUsers[0].name} and ${typingUsers[1].name} are typing...`;
    return `${typingUsers.length} people are typing...`;
  };

  if (loading) {
    return (
      <div style={{
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#999',
      }}>
        Loading messages...
      </div>
    );
  }

  return (
    <div style={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      background: '#f9fafb',
    }}>
      {/* Header */}
      <div style={{
        padding: '1rem 1.5rem',
        borderBottom: '1px solid #e5e7eb',
        background: 'white',
        display: 'flex',
        alignItems: 'center',
        gap: '1rem',
      }}>
        <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 600, color: '#111' }}>
          {getConversationName()}
        </h2>
        <span style={{ fontSize: '0.875rem', color: '#999' }}>
          {conversation.participants.length} {conversation.participants.length === 1 ? 'participant' : 'participants'}
        </span>
      </div>

      {/* Messages */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '1.5rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem',
      }}>
        {messages.map((message, index) => {
          const isOwnMessage = message.sender._id === currentUserId;
          const showAvatar = index === 0 || messages[index - 1].sender._id !== message.sender._id;
          const showTimestamp = index === messages.length - 1 || 
            messages[index + 1].sender._id !== message.sender._id;

          return (
            <div
              key={message._id}
              style={{
                display: 'flex',
                flexDirection: isOwnMessage ? 'row-reverse' : 'row',
                gap: '0.75rem',
                alignItems: 'flex-end',
              }}
            >
              {/* Avatar */}
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: isOwnMessage ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : '#e5e7eb',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.875rem',
                flexShrink: 0,
                visibility: showAvatar ? 'visible' : 'hidden',
              }}>
                {message.sender.avatar && message.sender.avatar.startsWith('http') ? (
                  <img
                    src={message.sender.avatar}
                    alt={message.sender.name}
                    style={{
                      width: '100%',
                      height: '100%',
                      borderRadius: '50%',
                      objectFit: 'cover',
                    }}
                  />
                ) : (
                  <span>{message.sender.name.charAt(0).toUpperCase()}</span>
                )}
              </div>

              {/* Message Content */}
              <div style={{
                maxWidth: '70%',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.25rem',
                alignItems: isOwnMessage ? 'flex-end' : 'flex-start',
              }}>
                {showAvatar && !isOwnMessage && (
                  <span style={{ fontSize: '0.75rem', color: '#666', paddingLeft: '0.5rem' }}>
                    {message.sender.name}
                  </span>
                )}
                <div style={{
                  padding: '0.75rem 1rem',
                  borderRadius: isOwnMessage ? '1rem 1rem 0.25rem 1rem' : '1rem 1rem 1rem 0.25rem',
                  background: isOwnMessage ? '#667eea' : 'white',
                  color: isOwnMessage ? 'white' : '#111',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
                  wordBreak: 'break-word',
                }}>
                  {message.text}
                </div>
                {showTimestamp && (
                  <span style={{
                    fontSize: '0.75rem',
                    color: '#999',
                    paddingLeft: isOwnMessage ? 0 : '0.5rem',
                    paddingRight: isOwnMessage ? '0.5rem' : 0,
                  }}>
                    {format(new Date(message.createdAt), 'h:mm a')}
                  </span>
                )}
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />

        {/* Typing Indicator */}
        {typing.size > 0 && (
          <div style={{
            fontSize: '0.875rem',
            color: '#999',
            fontStyle: 'italic',
            paddingLeft: '3rem',
          }}>
            {getTypingText()}
          </div>
        )}
      </div>

      {/* Input */}
      <div style={{
        padding: '1rem 1.5rem',
        borderTop: '1px solid #e5e7eb',
        background: 'white',
        display: 'flex',
        gap: '1rem',
      }}>
        <input
          type="text"
          value={newMessage}
          onChange={(e) => handleInputChange(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Type a message..."
          style={{
            flex: 1,
            padding: '0.75rem 1rem',
            border: '1px solid #e5e7eb',
            borderRadius: '1.5rem',
            fontSize: '0.9375rem',
            outline: 'none',
          }}
        />
        <button
          onClick={sendMessage}
          disabled={!newMessage.trim()}
          style={{
            padding: '0.75rem 1.5rem',
            background: newMessage.trim() ? '#667eea' : '#e5e7eb',
            color: newMessage.trim() ? 'white' : '#999',
            border: 'none',
            borderRadius: '1.5rem',
            fontSize: '0.9375rem',
            fontWeight: 600,
            cursor: newMessage.trim() ? 'pointer' : 'not-allowed',
            transition: 'all 0.2s',
          }}
        >
          Send
        </button>
      </div>
    </div>
  );
}
