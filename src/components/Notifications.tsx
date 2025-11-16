'use client';

import { Bell, X, Trash2, CheckCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNotifications } from '@/hooks/useNotifications';
import { supabaseBrowser } from '@/lib/supabase/client';

export default function Notifications({ userId }: { userId?: string }) {
  const supabase = supabaseBrowser();
  const { notifications, setNotifications } = useNotifications(userId);
  const [open, setOpen] = useState(false);
  const [uid, setUid] = useState<string | null>(userId || null);

  // ✅ Garante que o user_id é sempre válido (UUID do usuário logado)
  useEffect(() => {
    async function getUser() {
      if (!userId || userId === 'guest') {
        const { data } = await supabase.auth.getUser();
        if (data?.user?.id) setUid(data.user.id);
      }
    }
    getUser();
  }, [userId, supabase]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  // 🗑️ Apagar uma notificação
  async function handleDeleteNotification(id: string) {
    if (!uid) return;
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ deleted: true })
        .eq('id', id)
        .eq('user_id', uid);
      if (error) throw error;
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    } catch (err: any) {
      console.error('Erro ao apagar notificação:', err.message);
    }
  }

  // 👁️ Marcar todas como lidas
  async function handleMarkAllAsRead() {
    if (!uid) return;
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', uid)
        .eq('deleted', false);
      if (error) throw error;
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch (err: any) {
      console.error('Erro ao marcar notificações como lidas:', err.message);
    }
  }

  // 🧹 Apagar todas
  async function handleDeleteAll() {
    if (!uid) return;
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ deleted: true })
        .eq('user_id', uid);
      if (error) throw error;
      setNotifications([]);
    } catch (err: any) {
      console.error('Erro ao apagar todas as notificações:', err.message);
    }
  }

  return (
    <div className="relative z-[9999]">
      {/* 🔔 Sino fixo com contador */}
      <button
        onClick={() => setOpen(!open)}
        className="relative flex items-center justify-center w-10 h-10 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition"
      >
        <Bell className="text-gray-700 dark:text-[#D4AF37]" size={22} />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 bg-red-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center animate-pulse">
            {unreadCount}
          </span>
        )}
      </button>

      {/* 📨 Painel de notificações */}
      {open && (
        <div className="absolute right-0 mt-3 w-80 bg-white dark:bg-[#0f0f0f] border border-gray-200 dark:border-gray-700 rounded-2xl shadow-xl p-3 z-[10000]">
          <div className="flex justify-between items-center border-b border-gray-200 dark:border-gray-700 pb-2 mb-2">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">
              Notificações
            </h3>
            <div className="flex gap-2">
              {notifications.length > 0 && (
                <>
                  <button
                    onClick={handleMarkAllAsRead}
                    className="text-gray-500 hover:text-green-500 transition"
                    title="Marcar todas como lidas"
                  >
                    <CheckCircle size={16} />
                  </button>
                  <button
                    onClick={handleDeleteAll}
                    className="text-gray-500 hover:text-red-500 transition"
                    title="Apagar todas"
                  >
                    <Trash2 size={16} />
                  </button>
                </>
              )}
              <button
                onClick={() => setOpen(false)}
                className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                title="Fechar"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {notifications.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Sem notificações.
            </p>
          ) : (
            <ul className="space-y-2 max-h-60 overflow-y-auto">
              {notifications.map((n) => (
                <li
                  key={n.id}
                  className={`p-2 rounded-lg flex justify-between items-start gap-2 transition-all ${
                    n.type === 'error'
                      ? 'bg-red-100 dark:bg-red-900/50'
                      : n.type === 'warning'
                      ? 'bg-yellow-100 dark:bg-yellow-900/40'
                      : n.type === 'success'
                      ? 'bg-green-100 dark:bg-green-900/40'
                      : 'bg-gray-100 dark:bg-gray-800'
                  }`}
                >
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                      {n.title}
                    </p>
                    <p className="text-xs text-gray-700 dark:text-gray-400">
                      {n.message}
                    </p>
                    <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1">
                      {new Date(n.created_at).toLocaleString()}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDeleteNotification(n.id)}
                    className="text-gray-400 hover:text-red-500 transition"
                    title="Apagar notificação"
                  >
                    <Trash2 size={14} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
