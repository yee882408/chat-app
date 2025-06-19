'use client';
import { useEffect, useState } from "react";
import { useChatStore, Chat } from "@/store/chat";
import { useChats } from "@/hooks/useChatHistory";
import { useRouter } from "next/navigation";
import { supabase } from "@/utils/supabase";
import { useAuthStore } from "@/store/auth";
import { BannedUserToast, BannedUserModal } from "@/components/BannedUserNotification";
import { UserManagement } from "@/components/AdminControls";

export default function ChatList() {
    const {
        username,
        setUsername,
        searchTerm,
        setSearchTerm,
        setChats,
        addChat
    } = useChatStore();

    const { user, logout, checkSession, role, isBanned } = useAuthStore();
    const [newChatName, setNewChatName] = useState("");
    const [isCreating, setIsCreating] = useState(false);
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [isPageLoading, setIsPageLoading] = useState(true);
    const router = useRouter();

    // Check authentication on page load
    useEffect(() => {
        const verifyAuth = async () => {
            try {
                console.log("Chat page: Verifying authentication...");
                const isAuthenticated = await checkSession();
                console.log("Chat page: Authentication result:", isAuthenticated);
                console.log("Chat page: User data:", user);

                if (!isAuthenticated) {
                    console.log("Chat page: Not authenticated, should redirect to login");
                } else {
                    console.log("Chat page: Successfully authenticated");

                    // Force refresh localStorage to ensure it's up to date
                    if (typeof window !== 'undefined' && window.localStorage && user && user.id) {
                        try {
                            const authData = {
                                state: {
                                    user: user,
                                    session: { user: user, access_token: "present" }
                                }
                            };
                            localStorage.setItem('auth-storage', JSON.stringify(authData));
                            console.log("Chat page: Refreshed auth data in localStorage");
                        } catch (e) {
                            console.error("Chat page: Error updating localStorage:", e);
                        }
                    }
                }

                setIsPageLoading(false);
            } catch (error) {
                console.error("Error verifying authentication:", error);
                setIsPageLoading(false);
            }
        };

        verifyAuth();
    }, [checkSession, user]);

    // Get chats with search filter
    const { data: chats, isLoading } = useChats(searchTerm);

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
        if (chats) {
            setChats(chats);
        }
    }, [chats, setChats]);

    const handleCreateChat = async () => {
        if (!newChatName.trim()) return;

        // Check if user is banned
        if (isBanned) {
            alert("You cannot create new chats because your account has been banned.");
            return;
        }

        setIsCreating(true);
        try {
            const { data, error } = await supabase
                .from("chats")
                .insert([{
                    name: newChatName.trim(),
                    created_by: user?.id
                }])
                .select()
                .single();

            if (data && !error) {
                addChat(data);
                setNewChatName("");
                setShowCreateForm(false);
                // Navigate to the new chat
                router.push(`/supabase-chat/${data.id}`);
            }
        } catch (error) {
            console.error("Error creating chat:", error);
        } finally {
            setIsCreating(false);
        }
    };

    const handleChatClick = (chatId: string) => {
        router.push(`/supabase-chat/${chatId}`);
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

    // Show loading state while checking authentication
    if (isPageLoading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="bg-white p-8 rounded-xl shadow-md max-w-md w-full text-center">
                    <p className="text-gray-600 mb-4">Loading chat application...</p>
                    <div className="flex justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            {/* Banned user components */}
            <BannedUserToast />
            <BannedUserModal />

            {/* Header */}
            <div className="bg-white shadow-sm p-4 sticky top-0 z-10">
                <div className="max-w-5xl mx-auto flex justify-between items-center">
                    <h1 className="text-2xl font-bold text-gray-800">Chat Rooms</h1>
                    <div className="flex items-center gap-4">
                        <span className="text-sm text-gray-700 font-medium">Welcome, {username}</span>
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
            </div>

            <div className="max-w-5xl mx-auto w-full flex-1 p-4">
                {/* Search and Create Chat */}
                <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
                    <div className="relative mb-4">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                            </svg>
                        </div>
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Search chats by name..."
                        />
                    </div>

                    {showCreateForm ? (
                        <div className="space-y-3">
                            <input
                                type="text"
                                value={newChatName}
                                onChange={(e) => setNewChatName(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Enter chat name..."
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        handleCreateChat();
                                    }
                                }}
                                autoFocus
                            />
                            <div className="flex gap-2">
                                <button
                                    onClick={handleCreateChat}
                                    disabled={isCreating}
                                    className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${isCreating
                                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                        : 'bg-green-500 hover:bg-green-600 text-white'
                                        }`}
                                >
                                    {isCreating ? 'Creating...' : 'Create Chat'}
                                </button>
                                <button
                                    onClick={() => {
                                        setShowCreateForm(false);
                                        setNewChatName("");
                                    }}
                                    className="py-2 px-4 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg transition-colors"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    ) : (
                        <button
                            onClick={() => {
                                if (isBanned) {
                                    alert("You cannot create new chats because your account has been banned.");
                                    return;
                                }
                                setShowCreateForm(true);
                            }}
                            className={`w-full py-2 px-4 rounded-lg font-medium transition-colors flex items-center justify-center ${isBanned
                                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                : 'bg-blue-500 hover:bg-blue-600 text-white'
                                }`}
                        >
                            <svg className="h-5 w-5 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                            </svg>
                            Create New Chat
                        </button>
                    )}
                </div>

                {/* User Profile Info */}
                <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
                    <div className="flex items-center">
                        <div className="bg-blue-100 text-blue-500 rounded-full w-12 h-12 flex items-center justify-center text-xl font-bold mr-4">
                            {username?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <div className="font-medium">{username}</div>
                            <div className="text-sm text-gray-700">{user?.email}</div>
                            {isBanned && (
                                <div className="text-xs mt-1 text-red-600 font-medium">
                                    Your account has been banned
                                </div>
                            )}
                            {role === 'admin' && (
                                <div className="text-xs mt-1 text-blue-600 font-medium">
                                    Administrator
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Admin User Management */}
                {role === 'admin' && <UserManagement />}

                {/* Chat List as Stack of Blocks */}
                {isLoading ? (
                    <div className="flex justify-center items-center py-12">
                        <div className="animate-pulse text-gray-500">Loading chats...</div>
                    </div>
                ) : chats?.length === 0 ? (
                    <div className="bg-white rounded-xl shadow-sm p-8 text-center">
                        <div className="text-gray-500 mb-4">No chats found</div>
                        {searchTerm ? (
                            <div className="text-sm text-gray-400">
                                Try a different search term or create a new chat
                            </div>
                        ) : (
                            <button
                                onClick={() => {
                                    if (isBanned) {
                                        alert("You cannot create new chats because your account has been banned.");
                                        return;
                                    }
                                    setShowCreateForm(true);
                                }}
                                className={`inline-flex items-center px-4 py-2 rounded-lg transition-colors ${isBanned
                                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                    : 'bg-blue-500 hover:bg-blue-600 text-white'
                                    }`}
                            >
                                <svg className="h-5 w-5 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                                </svg>
                                Create your first chat
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {chats?.map((chat: Chat) => (
                            <div
                                key={chat.id}
                                className="bg-white p-4 rounded-xl shadow-sm hover:shadow-md cursor-pointer transition-all border border-gray-100"
                                onClick={() => handleChatClick(chat.id)}
                            >
                                <div className="font-medium text-lg text-gray-800 mb-2">{chat.name}</div>
                                <div className="flex justify-between items-center">
                                    <div className="text-sm text-gray-500">
                                        Created: {new Date(chat.createdAt).toLocaleDateString()}
                                    </div>
                                    <div className="text-blue-500">
                                        <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}