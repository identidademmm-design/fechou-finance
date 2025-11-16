'use client';

import { useEffect, useState } from 'react';
import { supabaseBrowser } from '@/lib/supabase/client';

export default function TestPage() {
  const [data, setData] = useState<string>('Verificando conexão...');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const supabase = supabaseBrowser();
        const { data, error } = await supabase.from('profiles').select('*');

        if (error) {
          setData('Conexão com Supabase estabelecida ✅ (mas tabela não encontrada)');
        } else {
          setData('Conexão com Supabase estabelecida e tabela encontrada ✅');
        }
      } catch (err) {
        setData('Erro ao conectar ❌');
      }
    };

    fetchData();
  }, []);

  return (
    <main className="flex flex-col items-center justify-center h-screen text-center">
      <h1 className="text-2xl font-bold mb-4">Teste de Conexão com Supabase</h1>
      <p>{data}</p>
    </main>
  );
}
