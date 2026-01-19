"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@chat/ui";
import type { Message } from "@chat/types";
import { format } from "date-fns";

interface MessageBubbleProps {
  message: Message;
  isOwnMessage: boolean;
}

export function MessageBubble({ message, isOwnMessage }: MessageBubbleProps) {
  return (
    <div className={`flex gap-2 ${isOwnMessage ? "flex-row-reverse" : ""}`}>
      <Avatar className="h-8 w-8">
        <AvatarImage src={message.sender.avatar || undefined} />
        <AvatarFallback>{message.sender.name[0]}</AvatarFallback>
      </Avatar>
      
      <div className={`flex flex-col ${isOwnMessage ? "items-end" : ""}`}>
        <div className="flex items-baseline gap-2 mb-1">
          <span className="text-xs font-medium text-gray-700">
            {message.sender.name}
          </span>
          <span className="text-xs text-gray-500">
            {format(new Date(message.createdAt), "HH:mm")}
          </span>
        </div>
        
        <div
          className={`rounded-lg px-4 py-2 max-w-md ${
            isOwnMessage
              ? "bg-primary text-primary-foreground"
              : "bg-gray-100 text-gray-900"
          }`}
        >
          <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
        </div>
        
        {message.readReceipts && message.readReceipts.length > 0 && isOwnMessage && (
          <span className="text-xs text-gray-500 mt-1">
            Read by {message.readReceipts.length}
          </span>
        )}
      </div>
    </div>
  );
}
