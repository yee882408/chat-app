'use client'
import { useEffect, useState } from "react";
import { useChatStore } from "@/store/chat";
import { supabase } from "@/utils/supabase";
import io, { Socket } from "socket.io-client";

let socket: Socket;

export default function SocketChatPage() {
    const { username, setUsername } = useChatStore();
    const [input, setInput] = useState("");
    const [messages, setMessages] = useState<any[]>([]);

    useEffect(() => {
        fetch("/api/socket"); // 確保 Socket Server 初始化

        socket = io({ path: "/api/socket_io" });

        socket.on("chat-message", (msg) => {
            setMessages((prev) => [...prev, msg]);
        });

        return () => {
            socket.disconnect();
        };
    }, []);

    useEffect(() => {
        // 預設載入歷史訊息
        const loadMessages = async () => {
            const { data } = await supabase
                .from("messages")
                .select("*")
                .order("created_at", { ascending: true });
            setMessages(data || []);
        };
        loadMessages();
    }, []);

    const handleSend = async () => {
        if (!input.trim()) return;

        const newMsg = { content: input.trim(), sender: username };
        const { data, error } = await supabase.from("messages").insert([newMsg]).select().single();
        if (!error && data) {
            socket.emit("chat-message", data); // 通知其他人
            setMessages((prev) => [...prev, data]);
            setInput("");
        }
    };

    if (!username) {
        return (
            <div className="p-4">
                <h1 className="text-xl font-bold mb-2">Enter your name:</h1>
                <input
                    type="text"
                    className="border p-2"
                    onChange={(e) => setUsername(e.target.value)}
                />
            </div>
        );
    }

    return (
        <div className="p-4">
            <h1 className="text-2xl font-bold mb-4">Socket.IO 聊天室</h1>
            <div className="border p-2 h-[400px] overflow-y-scroll mb-2">
                {messages.map((msg) => (
                    <div key={msg.id} className="mb-1">
                        <strong>{msg.sender}:</strong> {msg.content}
                    </div>
                ))}
            </div>
            <div className="flex gap-2">
                <input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    className="border p-2 flex-1"
                    placeholder="輸入訊息..."
                />
                <button
                    onClick={handleSend}
                    className="bg-green-500 text-white px-4 py-2 rounded"
                >
                    發送
                </button>
            </div>
        </div>
    );
}
