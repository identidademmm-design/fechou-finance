'use client';

import { useState } from 'react';
import { supabaseBrowser } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const supabase = supabaseBrowser();
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isResetting, setIsResetting] = useState(false);
  const [message, setMessage] = useState('');

  // 🔐 Login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setMessage('E-mail ou senha incorretos.');
    } else {
      router.push('/dashboard');
    }
  };

  // 🔁 Esqueci a senha
  const handleResetPassword = async () => {
    if (!email) {
      setMessage('Digite seu e-mail para redefinir a senha.');
      return;
    }

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: 'http://localhost:3000/reset-password',
    });

    if (error) {
      setMessage('Erro ao enviar o link. Verifique o e-mail digitado.');
    } else {
      setMessage('Verifique seu e-mail. Um link para redefinição foi enviado.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center transition-colors duration-300 bg-[#F8F9FA] dark:bg-[#0d0d0d]">
      <form
        onSubmit={handleLogin}
        className="p-8 rounded-2xl shadow-lg w-full max-w-md border transition-all duration-300
          bg-white border-gray-200 text-gray-900
          dark:bg-[#111] dark:border-gray-800 dark:text-gray-100"
      >
        {/* Logo / Título */}
        <h1 className="text-3xl font-bold text-[#D4AF37] mb-2 text-center">
          Fechou Finance
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mb-8 text-center">
          Acesse sua conta
        </p>

        {/* Campos */}
        <input
          type="email"
          placeholder="Seu e-mail"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full mb-3 p-2 rounded-lg border border-gray-300 text-gray-900 
            bg-gray-50 focus:ring-2 focus:ring-[#D4AF37] focus:outline-none
            dark:bg-[#1a1a1a] dark:border-gray-700 dark:text-gray-100"
        />

        {!isResetting && (
          <>
            <input
              type="password"
              placeholder="Sua senha"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full mb-3 p-2 rounded-lg border border-gray-300 text-gray-900 
                bg-gray-50 focus:ring-2 focus:ring-[#D4AF37] focus:outline-none
                dark:bg-[#1a1a1a] dark:border-gray-700 dark:text-gray-100"
            />

            <button
              type="submit"
              className="w-full py-2 rounded-lg font-semibold transition-all
                bg-[#D4AF37] text-black hover:bg-[#c19c32]
                dark:bg-[#D4AF37] dark:text-black dark:hover:bg-[#c19c32]"
            >
              Entrar
            </button>

            <button
              type="button"
              onClick={() => setIsResetting(true)}
              className="mt-4 w-full text-sm hover:underline text-[#D4AF37] dark:text-[#D4AF37]"
            >
              Esqueci minha senha
            </button>
          </>
        )}

        {/* Reset de senha */}
        {isResetting && (
          <>
            <button
              type="button"
              onClick={handleResetPassword}
              className="w-full py-2 rounded-lg font-semibold transition-all
                bg-[#D4AF37] text-black hover:bg-[#c19c32]
                dark:bg-[#D4AF37] dark:text-black dark:hover:bg-[#c19c32]"
            >
              Enviar link de redefinição
            </button>

            <button
              type="button"
              onClick={() => setIsResetting(false)}
              className="mt-4 w-full text-sm hover:underline text-gray-600 dark:text-gray-400"
            >
              Voltar ao login
            </button>
          </>
        )}

        {/* Mensagem */}
        {message && (
          <p className="mt-4 text-center text-sm text-gray-600 dark:text-gray-400">
            {message}
          </p>
        )}
      </form>
    </div>
  );
}
