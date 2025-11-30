'use client';

import { useEffect, useState } from 'react';
import { supabaseBrowser } from '@/lib/supabase/client';

/**
 * Hook que:
 * 1) Busca todas as transações do usuário (e perfil, se tiver)
 * 2) Fica ouvindo o Supabase em tempo real
 * 3) Sempre retorna a lista atualizada de transações
 */
export function useTransactionsRealtime(userId?: string, profileId?: string) {
  const [transactions, setTransactions] = useState<any[]>([]);
  const supabase = supabaseBrowser();

  // 1) Busca inicial
  useEffect(() => {
    if (!userId) return;

    async function load() {
      let query = supabase
        .from('transactions')
        .select('*')
        .eq('user_id', userId)
        .order('due_date', { ascending: true });

      if (profileId) {
        query = query.eq('profile_id', profileId);
      }

      const { data } = await query;
      setTransactions(data || []);
    }

    load();
  }, [userId, profileId, supabase]);

  // 2) Atualização em tempo real
  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel('transactions-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'transactions' },
        async () => {
          let query = supabase
            .from('transactions')
            .select('*')
            .eq('user_id', userId)
            .order('due_date', { ascending: true });

          if (profileId) {
            query = query.eq('profile_id', profileId);
          }

          const { data } = await query;
          setTransactions(data || []);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, profileId, supabase]);

  return transactions;
}
