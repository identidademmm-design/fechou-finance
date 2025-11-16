'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabaseBrowser } from '@/lib/supabase/client';
import { useTransactionsRealtime } from '@/hooks/useTransactionsRealtime';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Calendar,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useProfiles, Profile } from '@/hooks/useProfiles';
import { useSelectedProfile } from '@/hooks/useSelectedProfile';
import Header from '@/components/Header'; // ✅ Import do Header com o sino

function SkeletonCard() {
  return (
    <div className="animate-pulse bg-gray-200 dark:bg-[#1a1a1a] rounded-2xl p-6 h-32 shadow-sm border border-transparent dark:border-gray-800" />
  );
}

export default function DashboardPage() {
  const supabase = supabaseBrowser();
  const router = useRouter();
  const { profiles } = useProfiles();
  const { selectedProfile, updateProfile } = useSelectedProfile();

  const [user, setUser] = useState<any>(null);
  const [summary, setSummary] = useState({ total: 0, income: 0, expenses: 0 });
  const [projections, setProjections] = useState<any[]>([]);
  const [selectedMonth, setSelectedMonth] = useState(
    new Date().toISOString().slice(0, 7)
  );
  const [loading, setLoading] = useState(true);

  // 🔐 Verifica login
  useEffect(() => {
    const checkUser = async () => {
      const { data } = await supabase.auth.getUser();
      if (!data.user) router.push('/login');
      else setUser(data.user);
    };
    checkUser();
  }, [supabase, router]);

  // 📊 Busca transações e calcula saldo considerando saldo inicial
  const fetchData = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    const startDate = `${selectedMonth}-01`;
    const endDate = new Date(
      new Date(startDate).getFullYear(),
      new Date(startDate).getMonth() + 1,
      0
    )
      .toISOString()
      .slice(0, 10);

    const today = new Date().toISOString().slice(0, 10);

    let query = supabase
      .from('transactions')
      .select('type, amount, created_at, due_date, profile_id')
      .eq('user_id', user.id)
      .gte('due_date', startDate)
      .lte('due_date', `${endDate}T23:59:59`);

    if (selectedProfile) query = query.eq('profile_id', selectedProfile);

    const { data, error } = await query;

    if (error) {
      console.error('Erro ao buscar transações:', error.message);
      setLoading(false);
      return;
    }

    const profileData = profiles.find((p) => p.id === selectedProfile);
    const saldoInicial = profileData?.initial_balance || 0;

    const past = data.filter(
      (tx) =>
        new Date(tx.due_date || tx.created_at).toISOString().slice(0, 10) <=
        today
    );
    const future = data.filter(
      (tx) =>
        new Date(tx.due_date || tx.created_at).toISOString().slice(0, 10) >
        today
    );

    const incomeNow = past
      .filter((tx) => tx.type === 'income')
      .reduce((acc, tx) => acc + tx.amount, 0);

    const expenseNow = past
      .filter((tx) => tx.type === 'expense')
      .reduce((acc, tx) => acc + tx.amount, 0);

    const saldoAtual = saldoInicial + (incomeNow - expenseNow);

    let runningBalance = saldoAtual;
    const sortedFuture = [...future].sort(
      (a, b) =>
        new Date(a.due_date || a.created_at).getTime() -
        new Date(b.due_date || b.created_at).getTime()
    );

    const futureProjection = sortedFuture.map((tx) => {
      runningBalance += tx.type === 'expense' ? -tx.amount : tx.amount;
      return {
        date: tx.due_date
          ? new Date(tx.due_date).toLocaleDateString()
          : new Date(tx.created_at).toLocaleDateString(),
        balance: runningBalance,
      };
    });

    setSummary({
      total: saldoAtual,
      income: incomeNow,
      expenses: expenseNow,
    });

    setProjections(futureProjection);
    setLoading(false);
  }, [selectedMonth, selectedProfile, supabase, profiles, user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // 🔄 Atualização em tempo real
  useTransactionsRealtime(() => {
    fetchData();
  });

  return (
    <div className="min-h-screen bg-[#F8F9FA] dark:bg-[#0d0d0d] transition-colors duration-300">
      <Header /> {/* ✅ Header com o sino e botão de sair */}

      <div className="flex flex-col gap-8 p-10">
        {/* Filtros */}
        <div className="flex flex-col md:flex-row md:items-center gap-3">
          <div className="flex items-center gap-3">
            <Calendar size={20} className="text-gray-600 dark:text-gray-300" />
            <input
              type="month"
              className="border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-gray-100 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
            />
          </div>

          <select
            value={selectedProfile}
            onChange={(e) => updateProfile(e.target.value)}
            className="border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-gray-100 rounded-lg p-2 md:ml-3 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
          >
            <option value="">Todos os Perfis</option>
            {profiles.map((p: Profile) => (
              <option key={p.id} value={p.id}>
                {p.name} (Saldo inicial: R$ {p.initial_balance?.toFixed(2) || '0.00'})
              </option>
            ))}
          </select>
        </div>

        {/* Cards */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-black dark:bg-[#111] text-[#D4AF37] rounded-2xl p-6 shadow-lg">
              <div className="flex items-center gap-3 mb-2">
                <DollarSign size={24} />
                <h3 className="text-lg font-semibold">Saldo Real (Hoje)</h3>
              </div>
              <p className="text-3xl font-bold">R$ {summary.total.toFixed(2)}</p>
            </div>

            <div className="bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-gray-800 rounded-2xl p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-2 text-green-600">
                <TrendingUp size={24} />
                <h3 className="text-lg font-semibold">Receitas até hoje</h3>
              </div>
              <p className="text-3xl font-bold text-green-500">
                R$ {summary.income.toFixed(2)}
              </p>
            </div>

            <div className="bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-gray-800 rounded-2xl p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-2 text-red-600">
                <TrendingDown size={24} />
                <h3 className="text-lg font-semibold">Despesas até hoje</h3>
              </div>
              <p className="text-3xl font-bold text-red-400">
                R$ {summary.expenses.toFixed(2)}
              </p>
            </div>
          </div>
        )}

        {/* Projeções Futuras */}
        <div className="bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-gray-800 rounded-2xl p-6 shadow-sm">
          <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-[#D4AF37]">
            📅 Projeção de Saldo Futuro
          </h2>

          {loading ? (
            <p className="text-gray-500 dark:text-gray-400">Carregando projeções...</p>
          ) : projections.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400">
              Nenhum lançamento futuro.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="py-2 px-3 text-gray-600 dark:text-gray-400">Data</th>
                    <th className="py-2 px-3 text-gray-600 dark:text-gray-400">
                      Saldo Estimado (R$)
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {projections.map((p, i) => (
                    <tr
                      key={i}
                      className="border-b last:border-none border-gray-100 dark:border-gray-800"
                    >
                      <td className="py-2 px-3 text-gray-800 dark:text-gray-300">
                        {p.date}
                      </td>
                      <td
                        className={`py-2 px-3 font-medium ${
                          p.balance < 0
                            ? 'text-red-600'
                            : 'text-green-600 dark:text-green-400'
                        }`}
                      >
                        R$ {p.balance.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
