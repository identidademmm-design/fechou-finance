'use client';

import { useEffect, useState } from 'react';
import { supabaseBrowser } from '@/lib/supabase/client';
import { Moon, Sun, Bell, User } from 'lucide-react';

export default function SettingsPage() {
  const supabase = supabaseBrowser();
  const [user, setUser] = useState<any>(null);
  const [darkMode, setDarkMode] = useState<boolean>(false);
  const [notifications, setNotifications] = useState({
    goals: true,
    payments: true,
  });

  // 🔹 Carrega preferências e usuário
  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      if (data?.user) setUser(data.user);

      // Tema salvo
      const savedTheme = localStorage.getItem('fechou-theme');
      if (savedTheme === 'dark') {
        setDarkMode(true);
        document.documentElement.classList.add('dark');
      } else {
        setDarkMode(false);
        document.documentElement.classList.remove('dark');
      }

      // Notificações salvas
      const savedNotifications = localStorage.getItem('fechou-notifications');
      if (savedNotifications) {
        setNotifications(JSON.parse(savedNotifications));
      }
    })();
  }, [supabase]);

  // 🌙 Alternar tema
  const toggleTheme = () => {
    const newTheme = !darkMode;
    setDarkMode(newTheme);

    if (newTheme) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('fechou-theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('fechou-theme', 'light');
    }
  };

  // 🔔 Alternar notificações
  const toggleNotification = (key: keyof typeof notifications) => {
    const updated = { ...notifications, [key]: !notifications[key] };
    setNotifications(updated);
    localStorage.setItem('fechou-notifications', JSON.stringify(updated));
  };

  return (
    <div className="p-10 bg-[#F8F9FA] dark:bg-gray-900 min-h-screen text-gray-800 dark:text-gray-100 transition-colors duration-300">
      <h1 className="text-3xl font-bold flex items-center gap-2 mb-2">
        ⚙️ Configurações
      </h1>
      <p className="text-gray-500 dark:text-gray-400 mb-8">
        Personalize suas preferências e informações da conta aqui.
      </p>

      {/* 👤 Conta */}
      <section className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-6 shadow-sm mb-6 transition-all">
        <div className="flex items-center gap-3 mb-3">
          <User className="text-[#D4AF37]" size={22} />
          <h2 className="text-lg font-semibold">Informações da Conta</h2>
        </div>

        {user ? (
          <div>
            <p>
              <strong>Email:</strong> {user.email}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              ID: {user.id}
            </p>
          </div>
        ) : (
          <p className="text-gray-500">Carregando usuário...</p>
        )}
      </section>

      {/* 🌙 Tema */}
      <section className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-6 shadow-sm mb-6 transition-all">
        <div className="flex items-center gap-3 mb-3">
          {darkMode ? (
            <Moon className="text-[#D4AF37]" size={22} />
          ) : (
            <Sun className="text-[#D4AF37]" size={22} />
          )}
          <h2 className="text-lg font-semibold">Tema do Sistema</h2>
        </div>

        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={darkMode}
            onChange={toggleTheme}
            className="w-5 h-5 accent-[#D4AF37] cursor-pointer"
          />
          <span>
            {darkMode ? 'Modo Escuro Ativado' : 'Modo Claro Ativado'}
          </span>
        </label>
      </section>

      {/* 🔔 Notificações */}
      <section className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-6 shadow-sm transition-all">
        <div className="flex items-center gap-3 mb-3">
          <Bell className="text-[#D4AF37]" size={22} />
          <h2 className="text-lg font-semibold">Notificações</h2>
        </div>

        <div className="flex flex-col gap-2">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={notifications.goals}
              onChange={() => toggleNotification('goals')}
              className="w-5 h-5 accent-[#D4AF37]"
            />
            <span>Alertar quando uma meta for atingida</span>
          </label>

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={notifications.payments}
              onChange={() => toggleNotification('payments')}
              className="w-5 h-5 accent-[#D4AF37]"
            />
            <span>Lembrar de pagamentos próximos</span>
          </label>
        </div>
      </section>
    </div>
  );
}
