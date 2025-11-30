import './globals.css';
import { ReactNode } from 'react';
import Sidebar from '@/components/Sidebar';
import ServiceWorkerRegister from '@/sw';
import MobileHeader from '@/components/MobileHeader';

export const metadata = {
  title: 'Fechou Finance',
  description: 'Controle financeiro pessoal com Supabase e Next.js',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        {/* PWA */}
        <link rel="manifest" href="/manifest.json" />
        <link rel="icon" href="/icons/icon-192.png" />
        <meta name="theme-color" content="#000000" />

        {/* ESSENCIAL PARA MOBILE PWA */}
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, maximum-scale=1"
        />

        {/* Tema dark antes do React carregar */}
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

      <body className="bg-[#F8F9FA] dark:bg-[#0d0d0d] text-gray-900 dark:text-gray-100 font-sans min-h-screen transition-all">

        {/* HEADER MOBILE */}
        <MobileHeader />

        <div className="flex">

          {/* SIDEBAR DESKTOP – aparece só em telas grandes */}
          <div className="hidden md:block w-64 fixed left-0 top-0 h-full">
            <Sidebar />
          </div>

          {/* ÁREA PRINCIPAL */}
          <main className="flex-1 md:ml-64 p-4 md:p-8">
            {children}
          </main>
        </div>

        {/* REGISTER DO SERVICE WORKER */}
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
