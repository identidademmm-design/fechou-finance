'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabaseBrowser } from '@/lib/supabase/client';
import { useTransactionsRealtime } from '@/hooks/useTransactionsRealtime';
import { DollarSign, TrendingUp, TrendingDown, Calendar } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useProfiles, Profile } from '@/hooks/useProfiles';
import { useSelectedProfile } from '@/hooks/useSelectedProfile';
import Header from '@/components/Header';

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

  // 🔐 LOGIN CLIENT ONLY
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) router.push('/login');
      else setUser(data.user);
    });
  }, []);

  // 📌 BUSCA TODAS TRANSACOES CLIENT-SIDE
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
      .select('*')
      .eq('user_id', user.id);

    if (selectedProfile) {
      query = query.eq('profile_id', selectedProfile);
    }

    const { data = [] } = await query;

    const normalize = (tx: any) => tx.due_date || tx.date || tx.created_at;

    const filtered = data.filter((tx) => {
      const d = normalize(tx)?.slice(0, 10);
      return d >= startDate && d <= endDate;
    });

    const past = filtered.filter((tx) => normalize(tx) <= today);
    const future = filtered.filter((tx) => normalize(tx) > today);

    const income = past
      .filter((tx) => tx.type === 'income')
      .reduce((a, b) => a + Number(b.amount || 0), 0);

    const expenses = past
      .filter((tx) => tx.type === 'expense')
      .reduce((a, b) => a + Number(b.amount || 0), 0);

    const profile = profiles.find((p) => p.id === selectedProfile);
    const saldoInicial = profile?.initial_balance || 0;

    const saldoAtual = saldoInicial + (income - expenses);

    let running = saldoAtual;

    const projected = future
      .sort(
        (a, b) =>
          new Date(normalize(a)).getTime() -
          new Date(normalize(b)).getTime()
      )
      .map((tx) => {
        running += tx.type === 'expense'
          ? -Number(tx.amount)
          : Number(tx.amount);

        return {
          date: new Date(normalize(tx)).toLocaleDateString(),
          balance: running,
        };
      });

    setSummary({ total: saldoAtual, income, expenses });
    setProjections(projected);
    setLoading(false);
  }, [user, selectedMonth, selectedProfile, profiles]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useTransactionsRealtime(fetchData);

  return (
    <div className="min-h-screen bg-[#F8F9FA] dark:bg-[#0d0d0d]">
      <Header />

      <div className="flex flex-col gap-8 p-10">
        {/* Filtros */}
        <div className="flex gap-3 flex-col md:flex-row md:items-center">
          <div className="flex items-center gap-3">
            <Calendar size={20} />
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="border rounded-lg p-2"
            />
          </div>

          <select
            value={selectedProfile}
            onChange={(e) => updateProfile(e.target.value)}
            className="border rounded-lg p-2"
          >
            <option value="">Todos os Perfis</option>
            {profiles.map((p: Profile) => (
              <option key={p.id} value={p.id}>
                {p.name}
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
            <div className="bg-black text-[#D4AF37] rounded-2xl p-6">
              <h3>Saldo Real</h3>
              <p className="text-3xl font-bold">R$ {summary.total.toFixed(2)}</p>
            </div>

            <div className="bg-white dark:bg-[#1a1a1a] rounded-2xl p-6">
              <h3>Receitas</h3>
              <p className="text-3xl text-green-500">
                R$ {summary.income.toFixed(2)}
              </p>
            </div>

            <div className="bg-white dark:bg-[#1a1a1a] rounded-2xl p-6">
              <h3>Despesas</h3>
              <p className="text-3xl text-red-500">
                R$ {summary.expenses.toFixed(2)}
              </p>
            </div>
          </div>
        )}

        {/* Projeção */}
        <div className="bg-white dark:bg-[#1a1a1a] p-6 rounded-2xl">
          <h2>📅 Projeção de Saldo Futuro</h2>

          {loading ? (
            <p>Carregando...</p>
          ) : projections.length === 0 ? (
            <p>Sem lançamentos futuros.</p>
          ) : (
            <table className="w-full">
              <tbody>
                {projections.map((p, i) => (
                  <tr key={i}>
                    <td>{p.date}</td>
                    <td
                      className={
                        p.balance < 0 ? 'text-red-500' : 'text-green-500'
                      }
                    >
                      R$ {p.balance.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
