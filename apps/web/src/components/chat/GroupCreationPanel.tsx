"use client";

import { useState, useEffect } from "react";
import { Button, Input, Avatar, AvatarFallback, AvatarImage, ScrollArea } from "@chat/ui";
import { api } from "@/lib/api";
import { useChatStore } from "@/lib/store";
import { ArrowLeft, Search, Users, Check, X, Loader2 } from "lucide-react";

interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

type Step = "menu" | "name" | "members";

interface GroupCreationPanelProps {
  onClose: () => void;
  onStartDirectChat: (userId: string) => void;
}

export function GroupCreationPanel({ onClose, onStartDirectChat }: GroupCreationPanelProps) {
  const [step, setStep] = useState<Step>("menu");
  const [groupName, setGroupName] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [selectedMembers, setSelectedMembers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  
  const { addConversation, setSelectedConversationId } = useChatStore();

  // Load all users when entering members step
  useEffect(() => {
    if (step === "members") {
      loadUsers();
    }
  }, [step]);

  // Filter users based on search
  useEffect(() => {
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      setFilteredUsers(
        allUsers.filter(
          (user) =>
            user.name.toLowerCase().includes(query) ||
            user.email.toLowerCase().includes(query)
        )
      );
    } else {
      setFilteredUsers(allUsers);
    }
  }, [searchQuery, allUsers]);

  const loadUsers = async () => {
    setIsLoading(true);
    try {
      const users = await api.conversations.searchUsers("");
      setAllUsers(users);
      setFilteredUsers(users);
    } catch (error) {
      console.error("Failed to load users:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleMember = (user: User) => {
    if (selectedMembers.find((m) => m.id === user.id)) {
      setSelectedMembers(selectedMembers.filter((m) => m.id !== user.id));
    } else {
      setSelectedMembers([...selectedMembers, user]);
    }
  };

  const handleBack = () => {
    if (step === "members") {
      setStep("name");
    } else if (step === "name") {
      setStep("menu");
      setGroupName("");
    } else {
      onClose();
    }
  };

  const handleCreateGroup = async () => {
    if (selectedMembers.length < 2) return;

    setIsCreating(true);
    try {
      const conversation = await api.conversations.create({
        type: "group",
        memberIds: selectedMembers.map((m) => m.id),
        name: groupName || `Group with ${selectedMembers.length} members`,
      });

      addConversation(conversation);
      setSelectedConversationId(conversation.id);
      onClose();
    } catch (error) {
      console.error("Failed to create group:", error);
    } finally {
      setIsCreating(false);
    }
  };

  const isUserSelected = (userId: string) => 
    selectedMembers.some((m) => m.id === userId);

  // Menu Step - Show options
  if (step === "menu") {
    return (
      <div className="flex flex-col h-full bg-white">
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <Button size="icon" variant="ghost" onClick={onClose}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h2 className="text-lg font-semibold">New chat</h2>
          </div>
        </div>

        {/* Search for direct chat */}
        <div className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search name or email"
              className="pl-9 bg-gray-50 border-gray-200"
              onChange={(e) => {
                // Quick search for direct chats
                setSearchQuery(e.target.value);
              }}
            />
          </div>
        </div>

        {/* New Group Option */}
        <div className="px-2">
          <button
            onClick={() => setStep("name")}
            className="w-full flex items-center gap-4 p-3 hover:bg-gray-50 rounded-lg transition-colors"
          >
            <div className="h-12 w-12 rounded-full bg-emerald-500 flex items-center justify-center">
              <Users className="h-6 w-6 text-white" />
            </div>
            <span className="font-medium text-gray-900">New group</span>
          </button>
        </div>

        {/* Divider */}
        <div className="px-4 py-3">
          <p className="text-xs text-gray-500 uppercase font-medium">Contacts</p>
        </div>

        {/* User List for Direct Chat */}
        <ScrollArea className="flex-1">
          <DirectChatUserList onSelectUser={onStartDirectChat} />
        </ScrollArea>
      </div>
    );
  }

  // Name Step - Enter group name
  if (step === "name") {
    return (
      <div className="flex flex-col h-full bg-white">
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <Button size="icon" variant="ghost" onClick={handleBack}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h2 className="text-lg font-semibold">New group</h2>
          </div>
        </div>

        {/* Group Name Input */}
        <div className="p-6 flex flex-col items-center gap-6">
          <div className="h-24 w-24 rounded-full bg-gray-200 flex items-center justify-center">
            <Users className="h-12 w-12 text-gray-400" />
          </div>
          
          <div className="w-full">
            <Input
              placeholder="Group name"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              className="text-center text-lg"
              autoFocus
            />
            <p className="text-xs text-gray-500 text-center mt-2">
              Enter a name for your group
            </p>
          </div>
        </div>

        {/* Continue Button */}
        <div className="p-4 mt-auto border-t border-gray-200">
          <Button 
            className="w-full" 
            onClick={() => setStep("members")}
            disabled={!groupName.trim()}
          >
            Continue to add members
          </Button>
        </div>
      </div>
    );
  }

  // Members Step - Select group members
  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <Button size="icon" variant="ghost" onClick={handleBack}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h2 className="text-lg font-semibold">Add members</h2>
            <p className="text-xs text-gray-500">
              {groupName} • {selectedMembers.length} selected
            </p>
          </div>
        </div>
      </div>

      {/* Selected Members Chips */}
      {selectedMembers.length > 0 && (
        <div className="p-3 border-b border-gray-200">
          <div className="flex flex-wrap gap-2">
            {selectedMembers.map((member) => (
              <div
                key={member.id}
                className="flex items-center gap-1 bg-emerald-100 text-emerald-800 px-2 py-1 rounded-full text-sm"
              >
                <span className="max-w-[100px] truncate">{member.name}</span>
                <button
                  onClick={() => toggleMember(member)}
                  className="hover:bg-emerald-200 rounded-full p-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Search */}
      <div className="p-3 border-b border-gray-200">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search members"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-gray-50 border-gray-200"
          />
        </div>
      </div>

      {/* User List */}
      <ScrollArea className="flex-1">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <p>No users found</p>
          </div>
        ) : (
          <div className="py-2">
            {filteredUsers.map((user) => (
              <button
                key={user.id}
                onClick={() => toggleMember(user)}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors"
              >
                <div className="relative">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={user.avatar || undefined} />
                    <AvatarFallback className="bg-gradient-to-br from-blue-400 to-purple-500 text-white">
                      {user.name[0]}
                    </AvatarFallback>
                  </Avatar>
                  {isUserSelected(user.id) && (
                    <div className="absolute -bottom-1 -right-1 h-5 w-5 bg-emerald-500 rounded-full flex items-center justify-center">
                      <Check className="h-3 w-3 text-white" />
                    </div>
                  )}
                </div>
                <div className="flex-1 text-left">
                  <p className="font-medium text-gray-900">{user.name}</p>
                  <p className="text-sm text-gray-500 truncate">{user.email}</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </ScrollArea>

      {/* Create Button */}
      <div className="p-4 border-t border-gray-200">
        <Button
          className="w-full"
          onClick={handleCreateGroup}
          disabled={selectedMembers.length < 2 || isCreating}
        >
          {isCreating ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Creating...
            </>
          ) : (
            `Create group (${selectedMembers.length} members)`
          )}
        </Button>
        {selectedMembers.length < 2 && (
          <p className="text-xs text-gray-500 text-center mt-2">
            Select at least 2 members to create a group
          </p>
        )}
      </div>
    </div>
  );
}

// Subcomponent for direct chat user list
function DirectChatUserList({ onSelectUser }: { onSelectUser: (userId: string) => void }) {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const result = await api.conversations.searchUsers("");
      setUsers(result);
    } catch (error) {
      console.error("Failed to load users:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="py-2">
      {users.map((user) => (
        <button
          key={user.id}
          onClick={() => onSelectUser(user.id)}
          className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors"
        >
          <Avatar className="h-12 w-12">
            <AvatarImage src={user.avatar || undefined} />
            <AvatarFallback className="bg-gradient-to-br from-blue-400 to-purple-500 text-white">
              {user.name[0]}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 text-left">
            <p className="font-medium text-gray-900">{user.name}</p>
            <p className="text-sm text-gray-500 truncate">{user.email}</p>
          </div>
        </button>
      ))}
    </div>
  );
}
