"use client";

import { useChatStore } from "@/lib/store";
import { ScrollArea } from "@chat/ui";
import { ConversationItem } from "./ConversationItem";

export function ConversationList() {
  const { conversations, selectedConversationId, setSelectedConversationId, clearUnread, unreadCounts } = useChatStore();

  const handleSelectConversation = (conversationId: string) => {
    setSelectedConversationId(conversationId);
    clearUnread(conversationId);
  };

  return (
    <ScrollArea className="flex-1">
      <div className="px-4 py-2">
        {conversations.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <p>No conversations yet</p>
            <p className="text-sm">Start a new chat to get started</p>
          </div>
        ) : (
          conversations.map((conversation) => (
            <ConversationItem
              key={conversation.id}
              conversation={conversation}
              isSelected={selectedConversationId === conversation.id}
              unreadCount={unreadCounts[conversation.id] || 0}
              onClick={() => handleSelectConversation(conversation.id)}
            />
          ))
        )}
      </div>
    </ScrollArea>
  );
}
