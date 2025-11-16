'use client';

import { useState } from 'react';
import { supabaseBrowser } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { UserPlus, Loader2 } from 'lucide-react';

export default function RegisterPage() {
  const supabase = supabaseBrowser();
  const router = useRouter();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setMessage('');

    if (password !== confirmPassword) {
      setMessage('⚠️ As senhas não coincidem.');
      return;
    }

    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name },
      },
    });

    if (error) {
      setMessage(`❌ Erro: ${error.message}`);
    } else {
      setMessage('✅ Conta criada com sucesso! Redirecionando...');
      setTimeout(() => router.push('/login'), 1500);
    }
    setLoading(false);
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#F8F9FA] dark:bg-[#0d0d0d] transition-colors duration-300">
      <form
        onSubmit={handleRegister}
        className="bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-gray-800 p-8 rounded-2xl shadow-xl w-full max-w-md transition-all"
      >
        {/* Cabeçalho */}
        <div className="flex flex-col items-center mb-6">
          <UserPlus className="text-[#D4AF37]" size={32} />
          <h1 className="text-2xl font-bold mt-2 text-gray-900 dark:text-[#D4AF37] text-center">
            Criar Conta
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 text-center">
            Junte-se ao Fechou Finance e comece sua jornada financeira.
          </p>
        </div>

        {/* Campos */}
        <input
          type="text"
          placeholder="Nome completo"
          className="w-full p-3 border border-gray-300 dark:border-gray-700 rounded-lg mb-4 bg-white dark:bg-[#111] text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-[#D4AF37] focus:outline-none transition"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />

        <input
          type="email"
          placeholder="E-mail"
          className="w-full p-3 border border-gray-300 dark:border-gray-700 rounded-lg mb-4 bg-white dark:bg-[#111] text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-[#D4AF37] focus:outline-none transition"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <input
          type="password"
          placeholder="Senha"
          className="w-full p-3 border border-gray-300 dark:border-gray-700 rounded-lg mb-4 bg-white dark:bg-[#111] text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-[#D4AF37] focus:outline-none transition"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <input
          type="password"
          placeholder="Confirmar senha"
          className="w-full p-3 border border-gray-300 dark:border-gray-700 rounded-lg mb-4 bg-white dark:bg-[#111] text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-[#D4AF37] focus:outline-none transition"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
        />

        {/* Botão */}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-black dark:bg-[#222] text-white dark:text-gray-100 py-3 rounded-lg font-semibold hover:bg-gray-800 dark:hover:bg-[#333] transition flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="animate-spin" size={18} />
              Criando conta...
            </>
          ) : (
            'Criar conta'
          )}
        </button>

        {/* Mensagem */}
        {message && (
          <p
            className={`text-center mt-4 text-sm font-medium ${
              message.includes('❌')
                ? 'text-red-500'
                : message.includes('⚠️')
                ? 'text-yellow-500'
                : 'text-green-600'
            }`}
          >
            {message}
          </p>
        )}

        {/* Link para login */}
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-6 text-center">
          Já tem uma conta?{' '}
          <button
            type="button"
            onClick={() => router.push('/login')}
            className="text-[#D4AF37] hover:underline"
          >
            Entrar
          </button>
        </p>
      </form>
    </div>
  );
}
