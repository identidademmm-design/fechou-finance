'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabaseBrowser } from '@/lib/supabase/client';

export interface Profile {
  id: string;
  user_id: string;
  name: string;
  initial_balance: number;
  color?: string;
  created_at: string;
  is_deleted?: boolean;
  deleted_at?: string | null;
}

export function useProfiles() {
  const supabase = supabaseBrowser();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

  // 🔹 Busca perfis do usuário logado (filtra os ativos)
  const fetchProfiles = useCallback(async () => {
    setLoading(true);
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData?.user?.id;

    if (!userId) {
      setProfiles([]);
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Erro ao buscar perfis:', error.message);
      setLoading(false);
      return;
    }

    // 🔸 Filtra apenas perfis não deletados
    const ativos = (data || []).filter(
      (p: any) => !p.is_deleted && !p.deleted_at
    );

    setProfiles(ativos);
    setLoading(false);
  }, [supabase]);

  // 🔹 Cria um novo perfil
  async function addProfile(
    name: string,
    initial_balance: number,
    color = '#D4AF37'
  ) {
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData?.user?.id;
    if (!userId) return;

    const { data, error } = await supabase
      .from('profiles')
      .insert([{ user_id: userId, name, initial_balance, color }])
      .select();

    if (error) {
      console.error('Erro ao criar perfil:', error.message);
      return;
    }

    if (data && data.length > 0) {
      setProfiles((prev) => [...prev, data[0]]);
    }
  }

  // 🔹 Atualiza perfil existente
  async function updateProfile(id: string, updates: Partial<Profile>) {
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', id)
      .select();

    if (error) {
      console.error('Erro ao atualizar perfil:', error.message);
      return;
    }

    if (data && data.length > 0) {
      setProfiles((prev) =>
        prev.map((p) => (p.id === id ? { ...p, ...data[0] } : p))
      );
    }
  }

  // 🔹 Realtime: escuta qualquer alteração em perfis do usuário
  useEffect(() => {
    fetchProfiles();

    const channel = supabase
      .channel('profiles_realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'profiles' },
        (payload) => {
          console.log('📡 Perfil atualizado via Realtime:', payload.eventType);
          fetchProfiles();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchProfiles, supabase]);

  // 🔹 Alias refresh (compatível com páginas antigas)
  const refresh = useCallback(() => {
    fetchProfiles();
  }, [fetchProfiles]);

  // 🔹 Retorno completo
  return { profiles, loading, addProfile, updateProfile, fetchProfiles, refresh };
}
