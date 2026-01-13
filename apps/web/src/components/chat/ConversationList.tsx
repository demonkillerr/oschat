'use client';

import { useState } from 'react';
import { Plus, MessageSquare, Users, Search, LogOut, X } from 'lucide-react';
import { useAuthStore } from '@/stores/auth';
import { useConversationStore, Conversation } from '@/stores/conversations';
import { Avatar, Spinner } from '@/components/ui';
import { cn, formatDate } from '@/lib/utils';

interface ConversationListProps {
  onClose?: () => void;
}

export function ConversationList({ onClose }: ConversationListProps) {
  const { user, logout } = useAuthStore();
  const {
    conversations,
    currentConversationId,
    isLoading,
    setCurrentConversation,
  } = useConversationStore();

  const [showNewConversation, setShowNewConversation] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredConversations = conversations.filter((conv) =>
    conv.displayName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelectConversation = (id: string) => {
    setCurrentConversation(id);
    onClose?.();
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Avatar src={user?.avatarUrl} name={user?.name || 'User'} size="md" />
            <div>
              <p className="font-medium text-gray-900">{user?.name}</p>
              <p className="text-xs text-gray-500">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={() => logout()}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
            title="Sign out"
          >
            <LogOut className="h-5 w-5" />
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm bg-gray-100 border-0 rounded-lg focus:ring-2 focus:ring-primary-500"
          />
        </div>
      </div>

      {/* New Conversation Button */}
      <div className="p-2 border-b">
        <button
          onClick={() => setShowNewConversation(true)}
          className="w-full flex items-center gap-2 px-3 py-2 text-sm font-medium text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
        >
          <Plus className="h-4 w-4" />
          New Conversation
        </button>
      </div>

      {/* Conversation List */}
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Spinner />
          </div>
        ) : filteredConversations.length === 0 ? (
          <div className="text-center py-8 px-4">
            <MessageSquare className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">
              {searchQuery ? 'No conversations found' : 'No conversations yet'}
            </p>
            {!searchQuery && (
              <button
                onClick={() => setShowNewConversation(true)}
                className="mt-2 text-sm text-primary-600 hover:underline"
              >
                Start a new conversation
              </button>
            )}
          </div>
        ) : (
          <ul className="py-2">
            {filteredConversations.map((conv) => (
              <ConversationItem
                key={conv.id}
                conversation={conv}
                isActive={conv.id === currentConversationId}
                onClick={() => handleSelectConversation(conv.id)}
              />
            ))}
          </ul>
        )}
      </div>

      {/* New Conversation Modal */}
      {showNewConversation && (
        <NewConversationModal onClose={() => setShowNewConversation(false)} />
      )}
    </div>
  );
}

interface ConversationItemProps {
  conversation: Conversation;
  isActive: boolean;
  onClick: () => void;
}

function ConversationItem({ conversation, isActive, onClick }: ConversationItemProps) {
  const lastMessage = conversation.messages?.[0];

  return (
    <li>
      <button
        onClick={onClick}
        className={cn(
          'w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors',
          isActive && 'bg-primary-50 hover:bg-primary-50'
        )}
      >
        <div className="relative">
          <Avatar
            src={conversation.displayAvatar}
            name={conversation.displayName}
            size="md"
          />
          {conversation.type === 'group' && (
            <div className="absolute -bottom-1 -right-1 bg-gray-100 rounded-full p-0.5">
              <Users className="h-3 w-3 text-gray-600" />
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0 text-left">
          <div className="flex items-center justify-between gap-2">
            <p className={cn('font-medium truncate', isActive ? 'text-primary-900' : 'text-gray-900')}>
              {conversation.displayName}
            </p>
            {lastMessage && (
              <span className="text-xs text-gray-400 shrink-0">
                {formatDate(lastMessage.createdAt)}
              </span>
            )}
          </div>
          {lastMessage && (
            <p className="text-sm text-gray-500 truncate">
              {lastMessage.sender.name}: {lastMessage.body}
            </p>
          )}
        </div>
      </button>
    </li>
  );
}

interface NewConversationModalProps {
  onClose: () => void;
}

function NewConversationModal({ onClose }: NewConversationModalProps) {
  const [mode, setMode] = useState<'dm' | 'group'>('dm');
  const [email, setEmail] = useState('');
  const [groupTitle, setGroupTitle] = useState('');
  const [memberEmails, setMemberEmails] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const { createDm, createGroup } = useConversationStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (mode === 'dm') {
        await createDm(email.trim());
      } else {
        const emails = memberEmails.split(',').map((e) => e.trim()).filter(Boolean);
        if (emails.length === 0) {
          setError('Please enter at least one member email');
          setIsLoading(false);
          return;
        }
        await createGroup(groupTitle.trim(), emails);
      }
      onClose();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">New Conversation</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-4">
          {/* Mode Toggle */}
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setMode('dm')}
              className={cn(
                'flex-1 py-2 px-3 text-sm font-medium rounded-lg transition-colors',
                mode === 'dm'
                  ? 'bg-primary-100 text-primary-700'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              )}
            >
              <MessageSquare className="h-4 w-4 inline-block mr-2" />
              Direct Message
            </button>
            <button
              onClick={() => setMode('group')}
              className={cn(
                'flex-1 py-2 px-3 text-sm font-medium rounded-lg transition-colors',
                mode === 'group'
                  ? 'bg-primary-100 text-primary-700'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              )}
            >
              <Users className="h-4 w-4 inline-block mr-2" />
              Group
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            {mode === 'dm' ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="user@example.com"
                  className="input"
                  required
                />
              </div>
            ) : (
              <>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Group Name
                  </label>
                  <input
                    type="text"
                    value={groupTitle}
                    onChange={(e) => setGroupTitle(e.target.value)}
                    placeholder="My Group"
                    className="input"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Member Emails
                  </label>
                  <textarea
                    value={memberEmails}
                    onChange={(e) => setMemberEmails(e.target.value)}
                    placeholder="user1@example.com, user2@example.com"
                    className="input min-h-[80px] resize-none"
                    required
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Separate multiple emails with commas
                  </p>
                </div>
              </>
            )}

            {error && (
              <p className="mt-3 text-sm text-red-600">{error}</p>
            )}

            <div className="flex gap-3 mt-6">
              <button
                type="button"
                onClick={onClose}
                className="btn-secondary flex-1"
                disabled={isLoading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-primary flex-1"
                disabled={isLoading}
              >
                {isLoading ? <Spinner size="sm" className="text-white" /> : 'Create'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
