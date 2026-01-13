'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Menu, X } from 'lucide-react';
import { useAuthStore } from '@/stores/auth';
import { useConversationStore } from '@/stores/conversations';
import { ConversationList, MessageArea, SocketProvider } from '@/components/chat';
import { Spinner } from '@/components/ui';
import { cn } from '@/lib/utils';

export default function ChatPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading, token, fetchUser } = useAuthStore();
  const { fetchConversations } = useConversationStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Check auth on mount
  useEffect(() => {
    if (token && !isAuthenticated) {
      fetchUser();
    }
  }, [token, isAuthenticated, fetchUser]);

  // Redirect if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated && !token) {
      router.push('/');
    }
  }, [isLoading, isAuthenticated, token, router]);

  // Fetch conversations when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      fetchConversations();
    }
  }, [isAuthenticated, fetchConversations]);

  if (isLoading || (!isAuthenticated && token)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <SocketProvider>
      <div className="h-screen flex overflow-hidden bg-gray-100">
        {/* Mobile sidebar backdrop */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <aside
          className={cn(
            'fixed inset-y-0 left-0 z-50 w-80 transform transition-transform duration-300 lg:relative lg:translate-x-0',
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          )}
        >
          <div className="h-full flex flex-col border-r bg-white">
            {/* Mobile close button */}
            <button
              className="absolute top-4 right-4 p-1 hover:bg-gray-100 rounded lg:hidden"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-5 w-5" />
            </button>
            <ConversationList onClose={() => setSidebarOpen(false)} />
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 flex flex-col min-w-0">
          {/* Mobile header */}
          <div className="flex items-center gap-3 p-4 border-b bg-white lg:hidden">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <Menu className="h-5 w-5" />
            </button>
            <span className="font-semibold">OSChat</span>
          </div>

          <MessageArea />
        </main>
      </div>
    </SocketProvider>
  );
}
