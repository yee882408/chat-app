// hooks/useChatHistory.ts
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/utils/supabase";

export const useChatHistory = (chatId: string | null) => {
    return useQuery({
        queryKey: ["chat-messages", chatId],
        queryFn: async () => {
            if (!chatId) return [];

            const { data, error } = await supabase
                .from("messages")
                .select("*")
                .eq("chat_id", chatId)
                .order("created_at", { ascending: true });

            if (error) throw error;
            return data;
        },
        enabled: !!chatId,
    });
};

export const useChats = (searchTerm: string = "") => {
    return useQuery({
        queryKey: ["chats", searchTerm],
        queryFn: async () => {
            let query = supabase
                .from("chats")
                .select("*")
                .order("created_at", { ascending: false });

            if (searchTerm) {
                query = query.ilike("name", `%${searchTerm}%`);
            }

            const { data, error } = await query;
            if (error) throw error;
            return data;
        },
    });
};
