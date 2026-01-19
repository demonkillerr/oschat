import React, { createContext, useContext, useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";
import { useChatStore } from "./store";
import type { Message, TypingIndicator } from "@chat/types";

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
});

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }: { children: React.ReactNode }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  
  const { 
    addMessage,
    updateConversationLastMessage,
    setUserOnline, 
    setUserOffline, 
    addTypingUser, 
    removeTypingUser 
  } = useChatStore();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    const newSocket = io(process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3001", {
      auth: { token },
    });

    newSocket.on("connect", () => {
      console.log("Socket connected");
      setIsConnected(true);
    });

    newSocket.on("disconnect", () => {
      console.log("Socket disconnected");
      setIsConnected(false);
    });

    newSocket.on("message:new", (message: Message) => {
      const { user, selectedConversationId } = useChatStore.getState();
      addMessage(message);
      updateConversationLastMessage(message);
      // Increment unread count if the message is not from the current user
      // and the conversation is not currently selected
      if (message.senderId !== user?.id && 
          message.conversationId !== selectedConversationId) {
        useChatStore.getState().incrementUnread(message.conversationId);
      }
    });

    newSocket.on("user:online", ({ userId }: { userId: string }) => {
      setUserOnline(userId);
    });

    newSocket.on("user:offline", ({ userId }: { userId: string }) => {
      setUserOffline(userId);
    });

    newSocket.on("typing:start", ({ conversationId, userId }: TypingIndicator) => {
      addTypingUser(conversationId, userId);
    });

    newSocket.on("typing:stop", ({ conversationId, userId }: { conversationId: string; userId: string }) => {
      removeTypingUser(conversationId, userId);
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, [addMessage, updateConversationLastMessage, setUserOnline, setUserOffline, addTypingUser, removeTypingUser]);

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
};
