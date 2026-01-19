"use client";

import { useState, useRef, useEffect } from "react";
import { Input, Avatar, AvatarFallback, AvatarImage } from "@chat/ui";
import { api } from "@/lib/api";
import { Search, Loader2 } from "lucide-react";

interface UserSearchResult {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

interface UserSearchProps {
  onSelectUser: (userId: string) => void;
}

export function UserSearch({ onSelectUser }: UserSearchProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<UserSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    
    if (query.trim().length === 0) {
      setSearchResults([]);
      setShowDropdown(false);
      return;
    }

    setIsSearching(true);
    setShowDropdown(true);
    
    try {
      const results = await api.conversations.searchUsers(query);
      setSearchResults(results);
    } catch (error) {
      console.error("Search failed:", error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectUser = (user: UserSearchResult) => {
    onSelectUser(user.id);
    setSearchQuery("");
    setSearchResults([]);
    setShowDropdown(false);
  };

  return (
    <div ref={wrapperRef} className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Search users..."
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
          onFocus={() => searchResults.length > 0 && setShowDropdown(true)}
          className="pl-9 bg-gray-50 border-gray-200"
        />
        {isSearching && (
          <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 animate-spin text-gray-400" />
        )}
      </div>

      {/* Dropdown Results */}
      {showDropdown && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-64 overflow-y-auto">
          {isSearching ? (
            <div className="flex items-center justify-center py-6 text-gray-500">
              <Loader2 className="h-5 w-5 animate-spin mr-2" />
              <span className="text-sm">Searching...</span>
            </div>
          ) : searchResults.length === 0 ? (
            <div className="text-center py-6 text-gray-500">
              <p className="text-sm">No users found</p>
            </div>
          ) : (
            <div className="py-1">
              {searchResults.map((user) => (
                <button
                  key={user.id}
                  onClick={() => handleSelectUser(user)}
                  className="w-full px-3 py-2 flex items-center gap-3 hover:bg-gray-50 transition-colors"
                >
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={user.avatar} />
                    <AvatarFallback className="text-sm">{user.name[0]}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 text-left min-w-0">
                    <div className="font-medium text-sm truncate">{user.name}</div>
                    <div className="text-xs text-gray-500 truncate">{user.email}</div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
