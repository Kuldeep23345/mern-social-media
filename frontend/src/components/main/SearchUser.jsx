import React, { useState, useRef, useEffect } from "react";
import { Search, X, User as UserIcon, Loader2, ArrowLeft } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { useNavigate } from "react-router-dom";
import instance from "@/lib/axios.instance";

const SearchUser = ({ isOpen, onClose, isMobileFullScreen = false }) => {
  const [query, setQuery] = useState("");
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);
  const [recentSearches, setRecentSearches] = useState([]);
  const navigate = useNavigate();

  // Load recent searches from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("recentSearches");
    if (saved) {
      setRecentSearches(JSON.parse(saved));
    }
  }, []);

  const addToRecent = (user) => {
    const updated = [
      user,
      ...recentSearches.filter((u) => u._id !== user._id),
    ].slice(0, 5);
    setRecentSearches(updated);
    localStorage.setItem("recentSearches", JSON.stringify(updated));
  };

  const clearRecent = () => {
    setRecentSearches([]);
    localStorage.removeItem("recentSearches");
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose]);

  // Debounced search
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (query.trim()) {
        const fetchUsers = async () => {
          setLoading(true);
          try {
            const res = await instance.get(`/user/search?query=${query}`);
            if (res.data.success) {
              setUsers(res.data.users);
            }
          } catch (error) {
            console.error("Error searching users:", error);
          } finally {
            setLoading(false);
          }
        };
        fetchUsers();
      } else {
        setUsers([]);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [query]);

  if (!isOpen) return null;

  return (
    <div
      ref={dropdownRef}
      className={
        isMobileFullScreen
          ? "fixed top-0 left-0 right-0 bottom-16 bg-white/95 dark:bg-gray-950/95 backdrop-blur-xl flex flex-col z-40"
          : "w-full max-w-sm md:w-[420px] bg-white/90 dark:bg-gray-900/90 backdrop-blur-2xl rounded-[32px] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.2)] border border-white/20 dark:border-gray-800/50 z-[60] max-h-[85vh] md:max-h-[640px] overflow-hidden flex flex-col ring-1 ring-black/5 dark:ring-white/5"
      }
    >
      <div className="p-4 md:p-6 border-b border-gray-100 dark:border-gray-800">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            {isMobileFullScreen && (
              <button
                onClick={onClose}
                className="p-2 -ml-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full md:hidden"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}
            <h2 className="text-xl font-bold tracking-tight">Search</h2>
          </div>
          {!isMobileFullScreen && (
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
            >
              <X className="w-5 h-5 text-gray-400 hover:text-gray-600" />
            </button>
          )}
        </div>
        <div className="relative flex items-center group">
          <Search className="absolute left-4 w-4 h-4 text-gray-400 group-focus-within:text-[#0095F6] transition-colors" />
          <input
            type="text"
            placeholder="Search users..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-transparent pl-11 pr-11 py-3 rounded-2xl text-sm outline-none ring-1 ring-gray-200 dark:ring-gray-800 focus:ring-[#0095F6] transition-all duration-300"
            autoFocus
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="absolute right-3 p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <X className="w-4 h-4 text-gray-400" />
            </button>
          )}
        </div>
      </div>

      {/* Results List */}
      <div
        className={`overflow-y-auto flex-1 ${isMobileFullScreen ? "h-full" : "h-[300px]"}`}
      >
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="w-8 h-8 animate-spin text-[#0095F6] opacity-50" />
          </div>
        ) : users.length === 0 ? (
          <div className="flex flex-col flex-1">
            {!query && recentSearches.length > 0 && (
              <div className="px-6 py-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider">
                    Recent
                  </h3>
                  <button
                    onClick={clearRecent}
                    className="text-xs font-semibold text-[#0095F6] hover:text-[#007ccf]"
                  >
                    Clear All
                  </button>
                </div>
                <div className="space-y-1">
                  {recentSearches.map((user) => (
                    <div
                      key={`recent-${user._id}`}
                      onClick={() => {
                        navigate(`/profile/${user._id}`);
                        addToRecent(user);
                        onClose();
                      }}
                      className="group flex items-center gap-3 p-2 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer transition-all duration-200"
                    >
                      <Avatar className="w-10 h-10 ring-2 ring-transparent group-hover:ring-[#0095F6]/20 transition-all">
                        <AvatarImage src={user.profilePicture} />
                        <AvatarFallback>
                          {user.username?.charAt(0)?.toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate">
                          {user.name || user.username}
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                          @{user.username}
                        </p>
                      </div>
                      <X
                        className="w-4 h-4 text-gray-300 opacity-0 group-hover:opacity-100 hover:text-red-500 transition-all"
                        onClick={(e) => {
                          e.stopPropagation();
                          const updated = recentSearches.filter(
                            (u) => u._id !== user._id,
                          );
                          setRecentSearches(updated);
                          localStorage.setItem(
                            "recentSearches",
                            JSON.stringify(updated),
                          );
                        }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
            {!query && recentSearches.length === 0 && (
              <div className="flex flex-col items-center justify-center flex-1 p-8 text-center">
                <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
                  <Search className="w-8 h-8 text-gray-300" />
                </div>
                <p className="text-sm font-medium text-gray-500">
                  Search for friends and creators
                </p>
              </div>
            )}
            {query && (
              <div className="flex flex-col items-center justify-center flex-1 p-8 text-center">
                <p className="text-sm font-medium text-gray-500">
                  No users found for "{query}"
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="py-2">
            <h3 className="px-6 py-2 text-xs font-bold text-gray-400 uppercase tracking-wider">
              Results
            </h3>
            <div className="px-2">
              {users.map((user) => (
                <div
                  key={user._id}
                  onClick={() => {
                    navigate(`/profile/${user._id}`);
                    addToRecent(user);
                    onClose();
                  }}
                  className="flex items-center gap-4 p-4 mx-2 rounded-2xl hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-all duration-200 group animate-in fade-in slide-in-from-bottom-2"
                >
                  <Avatar className="w-12 h-12 ring-2 ring-transparent group-hover:ring-[#0095F6]/20 transition-all">
                    <AvatarImage
                      src={user.profilePicture}
                      alt={user.username}
                    />
                    <AvatarFallback>
                      {user.username?.charAt(0)?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold truncate dark:text-white">
                      {user.name || user.username}
                    </p>
                    <p className="text-xs text-gray-500 truncate dark:text-gray-400">
                      @{user.username}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchUser;
