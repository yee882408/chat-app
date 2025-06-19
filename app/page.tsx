'use client';
import { useEffect } from "react";
import { redirect } from "next/navigation";
import { useAuthStore } from "@/store/auth";

export default function Home() {
  const { checkSession } = useAuthStore();

  useEffect(() => {
    const checkAuth = async () => {
      const isAuthenticated = await checkSession();
      console.log('isAuthenticated:', isAuthenticated);
      if (isAuthenticated) {
        redirect('/supabase-chat');
      } else {
        redirect('/auth/login');
      }
    };

    checkAuth();
  }, [checkSession]);

  return null;
}
