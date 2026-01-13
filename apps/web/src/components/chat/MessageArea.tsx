'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, AlertCircle } from 'lucide-react';
import { useAuthStore } from '@/stores/auth';
import { useMessageStore, Message } from '@/stores/messages';
import { useCurrentConversation } from '@/stores/conversations';
import { Avatar, Spinner } from '@/components/ui';
import { cn, formatTime } from '@/lib/utils';

export function MessageArea() {
  const { user } = useAuthStore();
  const conversation = useCurrentConversation();
  const {
    messagesByConversation,
    isLoading,
    fetchMessages,
    sendMessage,
    getLastMessageId,
  } = useMessageStore();

  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const messages = conversation ? messagesByConversation[conversation.id] || [] : [];

  // Fetch messages when conversation changes
  useEffect(() => {
    if (conversation) {
      fetchMessages(conversation.id);
    }
  }, [conversation?.id, fetchMessages]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  // Focus input when conversation changes
  useEffect(() => {
    inputRef.current?.focus();
  }, [conversation?.id]);

  const handleSend = async () => {
    if (!input.trim() || !conversation || !user) return;

    const body = input.trim();
    setInput('');
    inputRef.current?.focus();

    await sendMessage(
      conversation.id,
      body,
      user.id,
      user.name,
      user.avatarUrl
    );
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!conversation) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
            <Send className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900">Select a conversation</h3>
          <p className="text-gray-500 mt-1">Choose a conversation to start messaging</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-white">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b bg-white">
        <Avatar
          src={conversation.displayAvatar}
          name={conversation.displayName}
          size="md"
        />
        <div>
          <h2 className="font-medium text-gray-900">{conversation.displayName}</h2>
          <p className="text-xs text-gray-500">
            {conversation.type === 'group'
              ? `${conversation.members.length} members`
              : 'Direct message'}
          </p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin">
        {isLoading && messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <Spinner />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-500">No messages yet. Start the conversation!</p>
          </div>
        ) : (
          <>
            {messages.map((message, index) => (
              <MessageBubble
                key={message.id}
                message={message}
                isOwn={message.senderId === user?.id}
                showAvatar={
                  index === 0 ||
                  messages[index - 1].senderId !== message.senderId
                }
              />
            ))}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input */}
      <div className="p-4 border-t bg-white">
        <div className="flex items-end gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            rows={1}
            className="flex-1 resize-none px-4 py-2.5 bg-gray-100 border-0 rounded-xl focus:ring-2 focus:ring-primary-500 focus:bg-white max-h-32"
            style={{
              minHeight: '44px',
              height: 'auto',
            }}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim()}
            className="btn-primary p-2.5 rounded-xl disabled:opacity-50"
          >
            <Send className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
}

interface MessageBubbleProps {
  message: Message;
  isOwn: boolean;
  showAvatar: boolean;
}

function MessageBubble({ message, isOwn, showAvatar }: MessageBubbleProps) {
  return (
    <div
      className={cn(
        'flex gap-2',
        isOwn ? 'flex-row-reverse' : 'flex-row'
      )}
    >
      {!isOwn && (
        <div className="w-8 shrink-0">
          {showAvatar && (
            <Avatar
              src={message.senderAvatar}
              name={message.senderName}
              size="sm"
            />
          )}
        </div>
      )}
      <div className={cn('max-w-[70%]', isOwn && 'items-end')}>
        {showAvatar && !isOwn && (
          <p className="text-xs text-gray-500 mb-1 ml-1">{message.senderName}</p>
        )}
        <div
          className={cn(
            'px-4 py-2 rounded-2xl',
            isOwn
              ? 'bg-primary-600 text-white rounded-br-md'
              : 'bg-gray-100 text-gray-900 rounded-bl-md',
            message.status === 'failed' && 'bg-red-100 text-red-900'
          )}
        >
          <p className="whitespace-pre-wrap break-words">{message.body}</p>
        </div>
        <div className={cn('flex items-center gap-1 mt-0.5', isOwn && 'justify-end')}>
          <span className="text-xs text-gray-400">
            {formatTime(message.createdAt)}
          </span>
          {message.status === 'sending' && (
            <Spinner size="sm" className="h-3 w-3" />
          )}
          {message.status === 'failed' && (
            <AlertCircle className="h-3 w-3 text-red-500" />
          )}
        </div>
      </div>
    </div>
  );
}
