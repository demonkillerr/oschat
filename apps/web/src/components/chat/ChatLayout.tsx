"use client";

import { useEffect, useState } from "react";
import { useChatStore } from "@/lib/store";
import { api } from "@/lib/api";
import { ConversationList } from "./ConversationList";
import { ChatWindow } from "./ChatWindow";
import { GroupCreationPanel } from "./GroupCreationPanel";
import { UserSearch } from "./UserSearch";
import { Button, Avatar, AvatarImage, AvatarFallback } from "@chat/ui";
import { LogOut, Plus } from "lucide-react";
import { useRouter } from "next/navigation";

type SidebarView = "conversations" | "new-chat";

export function ChatLayout() {
  const router = useRouter();
  const [sidebarView, setSidebarView] = useState<SidebarView>("conversations");
  const { user, setUser, conversations, setConversations, selectedConversationId, addConversation, setSelectedConversationId } = useChatStore();

  useEffect(() => {
    loadUserAndConversations();
  }, []);

  const loadUserAndConversations = async () => {
    try {
      const userData = await api.auth.getMe();
      setUser(userData);

      const conversationsData = await api.conversations.getAll();
      setConversations(conversationsData);
    } catch (error) {
      console.error("Failed to load data:", error);
      router.push("/login");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    router.push("/login");
  };

  const handleStartChat = async (userId: string) => {
    try {
      const conversation = await api.conversations.create({
        type: "direct",
        memberIds: [userId],
      });
      
      // Check if conversation already exists in list
      const exists = conversations.find(c => c.id === conversation.id);
      if (!exists) {
        addConversation(conversation);
      }
      setSelectedConversationId(conversation.id);
      setSidebarView("conversations"); // Return to conversations after starting chat
    } catch (error) {
      console.error("Failed to create conversation:", error);
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* Sidebar */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col overflow-hidden">
        {sidebarView === "new-chat" ? (
          <GroupCreationPanel 
            onClose={() => setSidebarView("conversations")}
            onStartDirectChat={handleStartChat}
          />
        ) : (
          <>
            {/* Header */}
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between mb-3">
                <h1 className="text-xl font-bold">Messages</h1>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => setSidebarView("new-chat")}
                  title="New chat"
                >
                  <Plus className="h-5 w-5" />
                </Button>
              </div>
              
              {/* Search Users */}
              <UserSearch onSelectUser={handleStartChat} />
            </div>

            {/* Conversation List */}
            <ConversationList />

            {/* User Info - Bottom */}
            <div className="p-4 border-t border-gray-200 mt-auto">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={user?.avatar || undefined} />
                    <AvatarFallback>{user?.name?.[0] || "U"}</AvatarFallback>
                  </Avatar>
                  <div className="text-sm">
                    <p className="font-medium truncate max-w-[140px]">{user?.name}</p>
                    <p className="text-xs text-gray-500">Signed in</p>
                  </div>
                </div>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={handleLogout}
                  title="Sign out"
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {selectedConversationId ? (
          <ChatWindow />
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            <div className="text-center">
              <div className="text-6xl mb-4">💬</div>
              <h2 className="text-2xl font-semibold mb-2">Welcome to Chat</h2>
              <p>Select a conversation to start messaging</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
