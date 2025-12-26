import React, { useEffect, useState, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Avatar, AvatarImage } from "../ui/avatar";
import { AvatarFallback } from "@radix-ui/react-avatar";
import { setSelectedUser } from "@/redux/authSlice";
import { useSocket } from "@/context/SocketContext";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Send } from "lucide-react";
import instance from "@/lib/axios.instance";
import { toast } from "sonner";

const ChatPage = () => {
  const { user, suggestedUser, selectedUser } = useSelector(
    (store) => store.auth
  );
  const { socket, isUserOnline } = useSocket();
  const dispatch = useDispatch();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState(null);
  const [typing, setTyping] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // Scroll to bottom when messages change
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load messages when a user is selected
  useEffect(() => {
    if (selectedUser && socket && user) {
      loadMessages();
      
      // Join room for this conversation
      const roomId = [user._id?.toString(), selectedUser._id?.toString()].sort().join("-");
      socket.emit("joinRoom", roomId);
      
      return () => {
        socket.emit("leaveRoom", roomId);
      };
    }
  }, [selectedUser, socket, user]);

  // Listen for new messages via Socket.IO
  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (data) => {
      const senderIdStr = data.senderId?.toString();
      const receiverIdStr = data.receiverId?.toString();
      const selectedUserIdStr = selectedUser?._id?.toString();
      const userIdStr = user?._id?.toString();
      
      if (
        (senderIdStr === selectedUserIdStr && receiverIdStr === userIdStr) ||
        (senderIdStr === userIdStr && receiverIdStr === selectedUserIdStr)
      ) {
        setMessages((prev) => {
          // Check if message already exists to avoid duplicates
          const exists = prev.some(msg => {
            const msgId = msg._id?.toString();
            const dataId = data._id?.toString();
            return msgId && dataId && msgId === dataId;
          });
          if (exists) {
            return prev;
          }
          return [...prev, data];
        });

        // #region agent log
        fetch("http://127.0.0.1:7242/ingest/2298cefe-44eb-4932-95fe-e57982e88dd6", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sessionId: "debug-session",
            runId: "pre-fix",
            hypothesisId: "H2",
            location: "frontend/src/components/main/ChatPage.jsx:handleNewMessage",
            message: "ChatPage received matching newMessage",
            data: {
              senderId: senderIdStr,
              receiverId: receiverIdStr,
              selectedUserId: selectedUserIdStr,
              userId: userIdStr,
            },
            timestamp: Date.now(),
          }),
        }).catch(() => {});
        // #endregion

        scrollToBottom();
      }
    };

    const handleTyping = (data) => {
      if (data.senderId === selectedUser?._id) {
        setIsTyping(data.isTyping);
      }
    };

    socket.on("newMessage", handleNewMessage);
    socket.on("userTyping", handleTyping);

    return () => {
      socket.off("newMessage", handleNewMessage);
      socket.off("userTyping", handleTyping);
    };
  }, [socket, selectedUser, user]);

  const loadMessages = async () => {
    if (!selectedUser) return;
    
    setLoading(true);
    try {
      const res = await instance.get(`/message/all/${selectedUser._id}`);
      if (res.data.success) {
        const loadedMessages = res.data.messages || [];
        setMessages(loadedMessages);
        setConversationId(res.data.conversationId);
      }
    } catch (error) {
      console.error("Error loading messages:", error);
      toast.error(error?.response?.data?.message || "Failed to load messages");
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedUser || loading) return;

    const messageText = newMessage.trim();
    setNewMessage("");
    setTyping(false);

    // Clear typing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    try {
      const res = await instance.post(`/message/send/${selectedUser._id?.toString()}`, {
        message: messageText,
      });

      if (res.data.success) {
        // Message will be added via Socket.IO event
        setConversationId(res.data.conversationId);
      }
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error(error?.response?.data?.message || "Failed to send message");
      setNewMessage(messageText); // Restore message on error
    }
  };

  const handleTyping = (e) => {
    const value = e.target.value;
    setNewMessage(value);

    if (!typing && socket && selectedUser) {
      setTyping(true);
      socket.emit("typing", {
        receiverId: selectedUser._id?.toString(),
        isTyping: true,
      });
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout to stop typing indicator
    typingTimeoutRef.current = setTimeout(() => {
      if (socket && selectedUser) {
        setTyping(false);
        socket.emit("typing", {
          receiverId: selectedUser._id?.toString(),
          isTyping: false,
        });
      }
    }, 1000);
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="flex flex-col md:flex-row h-screen w-full">
      {/* Users List - Left Sidebar */}
      <section className="w-full md:w-80 lg:w-96 border-r border-gray-200 dark:border-gray-800 flex flex-col h-screen">
        <div className="p-4 border-b border-gray-200 dark:border-gray-800">
          <h1 className="font-bold text-xl">{user?.username}</h1>
        </div>
        <div className="overflow-y-auto flex-1">
          {suggestedUser?.map((suggestedUserItem) => {
            const isOnline = isUserOnline(suggestedUserItem._id);
            const isSelected = selectedUser?._id === suggestedUserItem._id;
            
            return (
              <div
                onClick={() => {
                  dispatch(setSelectedUser(suggestedUserItem));
                }}
                key={suggestedUserItem._id}
                className={`flex gap-3 items-center p-3 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors ${
                  isSelected ? "bg-gray-100 dark:bg-gray-800" : ""
                }`}
              >
                <div className="relative">
                  <Avatar>
                    <AvatarImage src={suggestedUserItem?.profilePicture} />
                    <AvatarFallback>
                      {suggestedUserItem?.username?.charAt(0)?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  {isOnline && (
                    <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white dark:border-gray-900 rounded-full"></span>
                  )}
                </div>
                <div className="flex flex-col flex-1 min-w-0">
                  <span className="font-medium truncate">
                    {suggestedUserItem?.username}
                  </span>
                  <span
                    className={`text-xs font-bold ${
                      isOnline ? "text-green-600" : "text-gray-500"
                    }`}
                  >
                    {isOnline ? "online" : "offline"}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Chat Area - Right Side */}
      {selectedUser ? (
        <section className="flex-1 flex flex-col h-screen">
          {/* Chat Header */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex items-center gap-3">
            <Avatar>
              <AvatarImage src={selectedUser?.profilePicture} />
              <AvatarFallback>
                {selectedUser?.username?.charAt(0)?.toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <span className="font-medium">{selectedUser?.username}</span>
              <span
                className={`text-xs ${
                  isUserOnline(selectedUser._id)
                    ? "text-green-600"
                    : "text-gray-500"
                }`}
              >
                {isUserOnline(selectedUser._id) ? "online" : "offline"}
                {isTyping && " • typing..."}
              </span>
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-gray-900">
            {loading ? (
              <div className="flex justify-center items-center h-full">
                <p className="text-gray-500">Loading messages...</p>
              </div>
            ) : messages.length === 0 ? (
              <div className="flex justify-center items-center h-full">
                <p className="text-gray-500">No messages yet. Start a conversation!</p>
              </div>
            ) : (
              messages.map((message, index) => {
                // Handle both API messages (senderId is object) and Socket.IO messages (senderId is string)
                let senderIdStr = null;
                if (message.senderId && typeof message.senderId === 'object' && message.senderId._id) {
                  // API message with populated senderId
                  senderIdStr = message.senderId._id.toString();
                } else if (message.senderId) {
                  // Socket.IO message or unpopulated senderId
                  senderIdStr = message.senderId.toString();
                }
                
                const userIdStr = user?._id?.toString();
                const isOwnMessage = senderIdStr && userIdStr && senderIdStr === userIdStr;
                
                // Ensure message has required fields
                if (!message.message) {
                  return null;
                }
                
                return (
                  <div
                    key={message._id || `msg-${index}-${Date.now()}`}
                    className={`flex ${isOwnMessage ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[70%] md:max-w-[60%] rounded-lg px-4 py-2 ${
                        isOwnMessage
                          ? "bg-blue-500 text-white"
                          : "bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                      }`}
                    >
                      <p className="text-sm break-words">{message.message}</p>
                      <p
                        className={`text-xs mt-1 ${
                          isOwnMessage ? "text-blue-100" : "text-gray-500"
                        }`}
                      >
                        {message.createdAt
                          ? new Date(message.createdAt).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : ""}
                      </p>
                    </div>
                  </div>
                );
              }).filter(Boolean)
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Message Input */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-800">
            <div className="flex gap-2">
              <Input
                type="text"
                placeholder="Type a message..."
                value={newMessage}
                onChange={handleTyping}
                onKeyPress={handleKeyPress}
                className="flex-1"
              />
              <Button
                onClick={handleSendMessage}
                disabled={!newMessage.trim() || loading}
                size="icon"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </section>
      ) : (
        <section className="flex-1 flex items-center justify-center bg-gray-50 dark:bg-gray-900">
          <div className="text-center">
            <p className="text-gray-500 text-lg">
              Select a user to start chatting
            </p>
          </div>
        </section>
      )}
    </div>
  );
};

export default ChatPage;
