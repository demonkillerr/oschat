'use client';

import { useEffect } from 'react';
import { socketClient } from '@/lib/socket';
import { useAuthStore } from '@/stores/auth';
import { useConversationStore } from '@/stores/conversations';
import { useMessageStore } from '@/stores/messages';

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const { token, isAuthenticated } = useAuthStore();
  const { fetchConversations, conversations, updateConversationOrder } = useConversationStore();
  const { addMessage, syncMessages, getLastMessageId } = useMessageStore();

  // Connect to socket when authenticated
  useEffect(() => {
    if (!isAuthenticated || !token) {
      socketClient.disconnect();
      return;
    }

    socketClient.setToken(token);
    socketClient.connect().catch(console.error);

    return () => {
      socketClient.disconnect();
    };
  }, [isAuthenticated, token]);

  // Set up socket event listeners
  useEffect(() => {
    if (!isAuthenticated) return;

    const handleNewMessage = (data: Parameters<typeof addMessage>[0]) => {
      addMessage(data);
      updateConversationOrder(data.conversationId);
    };

    const handleSyncBatch = (data: { conversationId: string; messages: Parameters<typeof addMessage>[0][] }) => {
      syncMessages(data.conversationId, data.messages);
    };

    const handleError = (data: { message: string }) => {
      console.error('Socket error:', data.message);
    };

    socketClient.on('message:new', handleNewMessage);
    socketClient.on('sync:batch', handleSyncBatch);
    socketClient.on('error', handleError);

    return () => {
      socketClient.off('message:new');
      socketClient.off('sync:batch');
      socketClient.off('error');
    };
  }, [isAuthenticated, addMessage, syncMessages, updateConversationOrder]);

  // Request sync for all conversations on reconnect
  useEffect(() => {
    if (!isAuthenticated || !socketClient.connected) return;

    // Sync all conversations on connect
    conversations.forEach((conv) => {
      const lastMessageId = getLastMessageId(conv.id);
      socketClient.requestSync(conv.id, lastMessageId);
    });
  }, [isAuthenticated, conversations, getLastMessageId]);

  return <>{children}</>;
}
