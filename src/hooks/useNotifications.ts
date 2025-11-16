'use client';

import { useEffect, useState } from 'react';
import { supabaseBrowser } from '@/lib/supabase/client';

export function useNotifications(userId?: string) {
  const supabase = supabaseBrowser();
  const [notifications, setNotifications] = useState<any[]>([]);

  useEffect(() => {
    // 🛡️ Só busca se o userId for válido
    if (!userId || userId === 'guest' || userId.length !== 36) {
      setNotifications([]);
      return;
    }

    async function fetchNotifications() {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .eq('deleted', false)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Erro ao buscar notificações:', error.message);
        return;
      }

      setNotifications(data || []);
    }

    fetchNotifications();

    // 🔁 Realtime: escuta inserts/updates na tabela
    const channel = supabase
      .channel('notifications-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'notifications' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setNotifications((prev) => [payload.new, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            setNotifications((prev) =>
              prev.map((n) => (n.id === payload.new.id ? payload.new : n))
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  return { notifications, setNotifications };
}

