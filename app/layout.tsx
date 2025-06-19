// app/layout.tsx
import './globals.css';
import { Providers } from './provider';

export const metadata = {
  title: 'Chat App',
  description: '聊天室 with Supabase + Zustand + React Query',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-Hant">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
