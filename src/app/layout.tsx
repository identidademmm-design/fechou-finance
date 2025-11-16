import './globals.css';
import { ReactNode } from 'react';
import Sidebar from '@/components/Sidebar';

export const metadata = {
  title: 'Fechou Finance',
  description: 'Controle financeiro pessoal com Supabase e Next.js',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    // 👇 Adicionamos suppressHydrationWarning para eliminar o aviso inofensivo
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        {/* ⚡ Script executa antes do React para aplicar o tema salvo no localStorage */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  const theme = localStorage.getItem('fechou-theme');
                  if (theme === 'dark') {
                    document.documentElement.classList.add('dark');
                  } else {
                    document.documentElement.classList.remove('dark');
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>

      <body className="bg-[#F8F9FA] dark:bg-[#0d0d0d] text-gray-900 dark:text-gray-100 font-sans flex min-h-screen transition-all">
        {/* Sidebar fixa à esquerda */}
        <aside className="w-64 fixed top-0 left-0 h-full bg-black z-20">
          <Sidebar />
        </aside>

        {/* Conteúdo principal */}
        <main className="flex-1 ml-64 p-8 overflow-y-auto">{children}</main>
      </body>
    </html>
  );
}
