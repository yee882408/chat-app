'use client';
import { useEffect, useState, use } from "react";
import { useChatStore } from "@/store/chat";
import { useChatHistory, useChats } from "@/hooks/useChatHistory";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/utils/supabase";
import { useRouter } from "next/navigation";
import { Chat } from "@/store/chat";
import { useAuthStore } from "@/store/auth";
import { BannedUserToast, BannedUserModal } from "@/components/BannedUserNotification";
import { AdminChatControls } from "@/components/AdminControls";

export default function ChatRoom({ params }: { params: Promise<{ chatId: string }> }) {
  // Properly unwrap params using React.use()
  const resolvedParams = use(params);
  const chatId = resolvedParams.chatId;

  const { username, setUsername } = useChatStore();
  const { user, logout, role, isBanned } = useAuthStore();
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const queryClient = useQueryClient();
  const router = useRouter();
  console.log('role:', role);
  // Get current chat details
  const { data: chats } = useChats();
  const currentChat = chats?.find((chat: Chat) => chat.id === chatId);

  // Get messages for the current chat
  const { data: messages, isLoading: messagesLoading } = useChatHistory(chatId);

  // Auto-scroll to bottom when new messages arrive
  const messagesEndRef = useState<HTMLDivElement | null>(null);
  const setMessagesEndRef = (el: HTMLDivElement | null) => {
    messagesEndRef[0] = el;
  };

  // Set username from auth user if not already set
  useEffect(() => {
    if (user && !username) {
      const userMetadata = user.user_metadata;
      if (userMetadata && userMetadata.username) {
        setUsername(userMetadata.username);
      } else {
        // Fallback to email if no username
        setUsername(user.email?.split('@')[0] || 'User');
      }
    }
  }, [user, username, setUsername]);

  useEffect(() => {
    if (messagesEndRef[0]) {
      messagesEndRef[0].scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  useEffect(() => {
    const channel = supabase
      .channel("realtime-chat")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        (payload) => {
          // Only update if the message belongs to the current chat
          if (payload.new.chat_id === chatId) {
            queryClient.setQueryData(["chat-messages", chatId], (old: any) => [
              ...(old || []),
              payload.new,
            ]);
          }
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [queryClient, chatId]);

  const handleSend = async () => {
    if (!input.trim() || !chatId) return;

    // Check if user is banned
    if (isBanned) {
      alert("You cannot send messages because your account has been banned.");
      return;
    }

    setIsLoading(true);
    try {
      await supabase.from("messages").insert([
        {
          content: input.trim(),
          sender: username,
          chat_id: chatId,
          user_id: user?.id
        },
      ]);
      setInput("");
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      console.log('Logout successful, redirecting to login page');
      // Add a small delay to ensure logout is complete
      setTimeout(() => {
        // Use window.location for a hard redirect with cache-busting
        const redirectUrl = `/auth/login?t=${Date.now()}`;
        window.location.href = redirectUrl;
      }, 500);
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Banned user components */}
      <BannedUserToast />
      <BannedUserModal />

      {/* Header */}
      <div className="bg-white shadow-sm p-4 flex items-center justify-between">
        <div className="flex items-center">
          <button
            onClick={() => router.replace('/supabase-chat')}
            className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1 rounded-lg mr-4 transition-colors flex items-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9.707 14.707a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 1.414L7.414 9H15a1 1 0 110 2H7.414l2.293 2.293a1 1 0 010 1.414z" clipRule="evenodd" />
            </svg>
            Back
          </button>
          <div>
            <h1 className="text-xl font-bold text-gray-800">{currentChat?.name || 'Chat Room'}</h1>
            <p className="text-sm text-gray-600">
              {currentChat ? `Created: ${new Date(currentChat.createdAt).toLocaleDateString()}` : ''}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-700 font-medium">
            {user?.email}
          </span>
          {isBanned && (
            <span className="text-xs px-2 py-1 bg-red-100 text-red-800 rounded-full font-medium">
              Account Banned
            </span>
          )}
          {role === 'admin' && (
            <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded-full font-medium">
              Admin
            </span>
          )}
          <button
            onClick={handleLogout}
            className="text-sm px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded transition-colors"
          >
            Logout
          </button>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-hidden p-4">
        <div className="bg-white rounded-lg shadow-sm h-full flex flex-col">
          <div className="flex-1 overflow-y-auto p-4">
            {messagesLoading ? (
              <div className="flex justify-center items-center h-full">
                <div className="animate-pulse text-gray-500">Loading messages...</div>
              </div>
            ) : messages?.length === 0 ? (
              <div className="flex justify-center items-center h-full text-gray-500">
                No messages yet. Start the conversation!
              </div>
            ) : (
              <div className="space-y-3">
                {messages?.map((msg: any) => {
                  const isCurrentUser = msg.sender === username;
                  return (
                    <div
                      key={msg.id}
                      className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[75%] rounded-lg p-3 shadow-sm ${isCurrentUser
                          ? 'bg-blue-500 text-white rounded-br-none'
                          : 'bg-gray-100 text-gray-800 rounded-bl-none'
                          }`}
                      >
                        {!isCurrentUser && (
                          <div className="font-bold text-sm mb-1 text-blue-600">{msg.sender}</div>
                        )}
                        <div className="break-words font-medium">{msg.content}</div>
                        <div className={`text-xs mt-1 ${isCurrentUser ? 'text-blue-100' : 'text-gray-700'}`}>
                          {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={setMessagesEndRef} />
              </div>
            )}
          </div>

          {/* Admin Controls */}
          {role === 'admin' && currentChat && (
            <div className="px-4 pb-2">
              <AdminChatControls chatId={chatId} createdBy={currentChat.created_by || ''} />
            </div>
          )}

          {/* Message Input */}
          <div className="p-3 border-t">
            {isBanned ? (
              <div className="bg-red-50 text-red-700 p-3 rounded-lg text-center">
                <p className="font-medium">Your account has been banned</p>
                <p className="text-sm">You can view messages but cannot send new ones</p>
              </div>
            ) : (
              <div className="flex gap-2">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Type your message..."
                  disabled={isLoading || isBanned}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                />
                <button
                  onClick={handleSend}
                  disabled={isLoading || isBanned}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${isLoading || isBanned
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-blue-500 hover:bg-blue-600 text-white'
                    }`}
                >
                  {isLoading ? 'Sending...' : 'Send'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
