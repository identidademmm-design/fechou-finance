'use client';

import { useEffect, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { User } from '@supabase/supabase-js';
import { LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Notifications from '@/components/Notifications';

export default function Header() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClientComponentClient();
  const router = useRouter();

  useEffect(() => {
    async function loadUser() {
      const cached = localStorage.getItem('fechou_user');
      if (cached) setUser(JSON.parse(cached));

      const { data, error } = await supabase.auth.getUser();
      if (data?.user) {
        setUser(data.user);
        localStorage.setItem('fechou_user', JSON.stringify(data.user));
      } else if (error) {
        console.warn('Nenhum usuário autenticado.');
      }
      setLoading(false);
    }

    loadUser();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser(session.user);
        localStorage.setItem('fechou_user', JSON.stringify(session.user));
      } else {
        setUser(null);
        localStorage.removeItem('fechou_user');
        router.push('/login');
      }
    });

    return () => listener.subscription.unsubscribe();
  }, [supabase, router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem('fechou_user');
    router.push('/login');
  };

  return (
    <header className="ml-60 h-16 bg-white dark:bg-[#111] border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-8 shadow-sm sticky top-0 z-50 transition-all">
      <h2 className="text-xl font-semibold text-gray-900 dark:text-[#D4AF37]">
        {loading ? 'Carregando...' : user ? `Bem-vindo, ${user.email}` : 'Fechou Finance'}
      </h2>

      <div className="flex items-center gap-4">
        {/* 🔔 Sininho com userId real */}
        <Notifications userId={user?.id} />

        <button
          onClick={handleLogout}
          className="flex items-center gap-2 bg-black text-[#D4AF37] font-semibold px-4 py-2 rounded-xl hover:bg-[#D4AF37] hover:text-black transition dark:bg-[#D4AF37] dark:text-black dark:hover:bg-[#c19c32]"
        >
          <LogOut size={18} />
          <span>Sair</span>
        </button>
      </div>
    </header>
  );
}
