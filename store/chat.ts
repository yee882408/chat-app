import { create } from "zustand";

export type Chat = {
    id: string;
    name: string;
    createdAt: string;
};

type ChatState = {
    username: string;
    setUsername: (name: string) => void;
    chats: Chat[];
    setChats: (chats: Chat[]) => void;
    addChat: (chat: Chat) => void;
    searchTerm: string;
    setSearchTerm: (term: string) => void;
};

export const useChatStore = create<ChatState>((set) => ({
    username: "",
    setUsername: (name) => set({ username: name }),
    chats: [],
    setChats: (chats) => set({ chats }),
    addChat: (chat) => set((state) => ({ chats: [...state.chats, chat] })),
    searchTerm: "",
    setSearchTerm: (term) => set({ searchTerm: term }),
}));