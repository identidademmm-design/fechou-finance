'use client';

import { useState } from 'react';
import { supabaseBrowser } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

export default function ResetPasswordPage() {
  const supabase = supabaseBrowser();
  const router = useRouter();

  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      setMessage('Erro ao redefinir senha. Tente novamente.');
    } else {
      setMessage('Senha alterada com sucesso! Redirecionando...');
      setTimeout(() => router.push('/login'), 2000);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0d0d0d]">
      <form
        onSubmit={handleReset}
        className="bg-[#111] p-8 rounded-2xl shadow-lg w-full max-w-md border border-gray-800"
      >
        <h1 className="text-3xl font-bold text-[#D4AF37] mb-6 text-center">
          Nova Senha
        </h1>

        <input
          type="password"
          placeholder="Digite sua nova senha"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full mb-3 p-2 rounded-lg bg-[#1a1a1a] border border-gray-700 text-gray-100 focus:ring-2 focus:ring-[#D4AF37]"
        />

        <button
          type="submit"
          className="w-full bg-[#D4AF37] text-black py-2 rounded-lg font-semibold hover:bg-[#c19c32] transition"
        >
          Redefinir senha
        </button>

        {message && (
          <p className="mt-4 text-center text-sm text-gray-300">{message}</p>
        )}
      </form>
    </div>
  );
}
