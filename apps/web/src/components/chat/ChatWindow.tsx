"use client";

import { useEffect, useRef, useState } from "react";
import { useChatStore } from "@/lib/store";
import { useSocket } from "@/lib/socket";
import { api } from "@/lib/api";
import { ScrollArea, Avatar, AvatarFallback, AvatarImage, Input, Button } from "@chat/ui";
import { Send, X } from "lucide-react";
import { MessageBubble } from "./MessageBubble";
import type { Message } from "@chat/types";

export function ChatWindow() {
  const { selectedConversationId, conversations, user, messages, setMessages, setSelectedConversationId } = useChatStore();
  const { socket } = useSocket();
  const [newMessage, setNewMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();

  const conversation = conversations.find((c) => c.id === selectedConversationId);
  const conversationMessages = selectedConversationId ? messages[selectedConversationId] || [] : [];

  useEffect(() => {
    if (selectedConversationId && socket) {
      loadMessages();
      socket.emit("join:conversation", selectedConversationId);

      return () => {
        socket.emit("leave:conversation", selectedConversationId);
      };
    }
  }, [selectedConversationId, socket]);

  useEffect(() => {
    scrollToBottom();
  }, [conversationMessages]);

  const loadMessages = async () => {
    if (!selectedConversationId) return;

    try {
      const msgs: Message[] = await api.messages.getByConversation(selectedConversationId);
      setMessages(selectedConversationId, msgs);
    } catch (error) {
      console.error("Failed to load messages:", error);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newMessage.trim() || !selectedConversationId || !socket) return;

    socket.emit("message:send", {
      conversationId: selectedConversationId,
      content: newMessage.trim(),
    });

    setNewMessage("");
    handleStopTyping();
  };

  const handleTyping = () => {
    if (!socket || !selectedConversationId || !user) return;

    if (!isTyping) {
      setIsTyping(true);
      socket.emit("typing:start", {
        conversationId: selectedConversationId,
        userName: user.name,
      });
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      handleStopTyping();
    }, 2000);
  };

  const handleStopTyping = () => {
    if (socket && selectedConversationId && isTyping) {
      socket.emit("typing:stop", selectedConversationId);
      setIsTyping(false);
    }
  };

  const displayName = () => {
    if (!conversation) return "Chat";
    
    if (conversation.type === "group") {
      return conversation.name || "Group Chat";
    }
    
    const otherUser = conversation.members.find((m) => m.userId !== user?.id)?.user;
    return otherUser?.name || "Chat";
  };

  const displayAvatar = () => {
    if (!conversation) return null;
    
    if (conversation.type === "group") {
      return <AvatarFallback>{conversation.name?.[0] || "G"}</AvatarFallback>;
    }
    
    const otherUser = conversation.members.find((m) => m.userId !== user?.id)?.user;
    return (
      <>
        <AvatarImage src={otherUser?.avatar || undefined} />
        <AvatarFallback>{otherUser?.name?.[0] || "U"}</AvatarFallback>
      </>
    );
  };

  if (!conversation) return null;

  const handleCloseChat = () => {
    setSelectedConversationId(null);
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 bg-white shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar>
              {displayAvatar()}
            </Avatar>
            <div>
              <h2 className="font-semibold">{displayName()}</h2>
              {conversation.type === "group" && (
                <p className="text-sm text-gray-500">
                  {conversation.members.length} members
                </p>
              )}
            </div>
          </div>
          <Button
            variant="ghost"
            className="h-9 w-9 p-0 flex items-center justify-center text-gray-500 hover:text-gray-700"
            onClick={handleCloseChat}
            title="Close chat"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {conversationMessages.map((message) => (
            <MessageBubble
              key={message.id}
              message={message}
              isOwnMessage={message.senderId === user?.id}
            />
          ))}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="p-4 border-t border-gray-200 bg-white shrink-0">
        <form onSubmit={handleSendMessage} className="flex gap-2 items-center">
          <Input
            value={newMessage}
            onChange={(e) => {
              setNewMessage(e.target.value);
              handleTyping();
            }}
            placeholder="Type a message..."
            className="flex-1"
          />
          <button 
            type="submit" 
            disabled={!newMessage.trim()}
            className="text-primary hover:text-primary/80 disabled:text-gray-300 transition-colors p-2"
          >
            <Send className="h-5 w-5" />
          </button>
        </form>
      </div>
    </div>
  );
}
