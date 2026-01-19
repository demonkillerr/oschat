"use client";

import { useMemo } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@chat/ui";
import { useChatStore } from "@/lib/store";
import type { Conversation } from "@chat/types";
import { formatDistanceToNow } from "date-fns";

interface ConversationItemProps {
  conversation: Conversation;
  isSelected: boolean;
  unreadCount: number;
  onClick: () => void;
}

export function ConversationItem({ conversation, isSelected, unreadCount, onClick }: ConversationItemProps) {
  const { user } = useChatStore();

  const displayInfo = useMemo(() => {
    if (conversation.type === "group") {
      return {
        name: conversation.name || "Unnamed Group",
        avatar: null,
        initials: conversation.name?.[0] || "G",
      };
    }

    // For direct messages, show the other user
    const otherUser = conversation.members.find((m) => m.userId !== user?.id)?.user;
    return {
      name: otherUser?.name || "Unknown User",
      avatar: otherUser?.avatar,
      initials: otherUser?.name?.[0] || "U",
    };
  }, [conversation, user]);

  const lastMessage = conversation.messages?.[0];
  const lastMessageTime = lastMessage
    ? formatDistanceToNow(new Date(lastMessage.createdAt), { addSuffix: true })
    : "";

  return (
    <button
      onClick={onClick}
      className={`w-full p-3 rounded-lg mb-1 text-left transition-colors ${
        isSelected
          ? "bg-primary/10 border-primary/20 border"
          : "hover:bg-gray-100"
      }`}
    >
      <div className="flex items-start gap-3">
        <div className="relative">
          <Avatar className="h-12 w-12">
            <AvatarImage src={displayInfo.avatar || undefined} />
            <AvatarFallback>{displayInfo.initials}</AvatarFallback>
          </Avatar>
          {unreadCount > 0 && (
            <div className="absolute -top-1 -right-1 min-w-[20px] h-5 bg-emerald-500 rounded-full flex items-center justify-center px-1">
              <span className="text-xs font-bold text-white">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline justify-between mb-1">
            <h3 className="font-semibold text-sm truncate">{displayInfo.name}</h3>
            {lastMessage && (
              <span className="text-xs text-gray-500 ml-2 shrink-0">{lastMessageTime}</span>
            )}
          </div>
          {lastMessage && (
            <p className="text-sm text-gray-600 truncate">
              {lastMessage.sender.name}: {lastMessage.content}
            </p>
          )}
        </div>
      </div>
    </button>
  );
}
