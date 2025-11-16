'use client';

import { useEffect } from 'react';
import { supabaseBrowser } from '@/lib/supabase/client';

export function useTransactionsRealtime(onChange: () => void) {
  useEffect(() => {
    const supabase = supabaseBrowser();

    const channel = supabase
      .channel('transactions-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'transactions' },
        () => {
          onChange();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [onChange]);
}
