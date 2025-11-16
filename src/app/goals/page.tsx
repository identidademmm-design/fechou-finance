'use client';

import { useEffect, useState } from 'react';
import { supabaseBrowser } from '@/lib/supabase/client';
import {
  Target,
  PlusCircle,
  Loader2,
  RefreshCcw,
  Edit2,
  X,
  Save,
  Trash2,
} from 'lucide-react';
import { useRouter } from 'next/navigation';

interface Goal {
  id: string;
  title: string;
  target_amount: number;
  current_amount: number;
  user_id: string;
  profile_id?: string;
}

interface Profile {
  id: string;
  name: string;
  color: string;
}

export default function GoalsPage() {
  const supabase = supabaseBrowser();
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [form, setForm] = useState({
    title: '',
    target_amount: '',
    profile_id: '',
  });

  // 🔐 Verifica login
  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      if (!data.user) router.push('/login');
      else setUser(data.user);
    })();
  }, [supabase, router]);

  // 📊 Busca metas e perfis
  useEffect(() => {
    if (!user) return;
    fetchProfiles();
    fetchGoals();
  }, [user]);

  const fetchProfiles = async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, name, color')
      .eq('user_id', user.id);
    if (!error) setProfiles(data || []);
  };

  const fetchGoals = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('goals')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) console.error('Erro ao buscar metas:', error.message);
    else setGoals(data || []);
    setLoading(false);
  };

  // ➕ Criar nova meta
  const handleAddGoal = async () => {
    if (!form.title || !form.target_amount || !form.profile_id) {
      alert('Preencha todos os campos antes de salvar.');
      return;
    }

    const { error } = await supabase.from('goals').insert([
      {
        title: form.title,
        target_amount: Number(form.target_amount),
        current_amount: 0,
        user_id: user.id,
        profile_id: form.profile_id,
      },
    ]);

    if (error) alert('Erro ao criar meta: ' + error.message);
    else {
      setForm({ title: '', target_amount: '', profile_id: '' });
      fetchGoals();
    }
  };

  // ✏️ Abrir modal de edição
  const openEdit = (goal: Goal) => {
    setEditingGoal(goal);
    setForm({
      title: goal.title,
      target_amount: goal.target_amount.toString(),
      profile_id: goal.profile_id || '',
    });
    setShowModal(true);
  };

  // 💾 Salvar edição
  const saveEdit = async () => {
    if (!editingGoal) return;

    const { error } = await supabase
      .from('goals')
      .update({
        title: form.title.trim(),
        target_amount: Number(form.target_amount),
        profile_id: form.profile_id,
      })
      .eq('id', editingGoal.id)
      .eq('user_id', user.id);

    if (error) alert('Erro ao salvar meta: ' + error.message);
    else {
      setShowModal(false);
      setEditingGoal(null);
      fetchGoals();
    }
  };

  // ❌ Excluir meta
  const deleteGoal = async () => {
    if (!editingGoal) return;
    if (!confirm('Tem certeza que deseja excluir esta meta?')) return;

    const { error } = await supabase
      .from('goals')
      .delete()
      .eq('id', editingGoal.id)
      .eq('user_id', user.id);

    if (error) alert('Erro ao excluir meta: ' + error.message);
    else {
      setShowModal(false);
      setEditingGoal(null);
      fetchGoals();
    }
  };

  // 🔄 Atualiza metas com base nas receitas
  const handleSyncWithTransactions = async () => {
    setUpdating(true);
    const { data: transactions, error: txError } = await supabase
      .from('transactions')
      .select('amount, type, user_id')
      .eq('user_id', user.id)
      .eq('type', 'income');

    if (txError) {
      console.error('Erro ao buscar transações:', txError.message);
      setUpdating(false);
      return;
    }

    const totalReceitas =
      transactions?.reduce((acc, tx) => acc + Number(tx.amount || 0), 0) || 0;

    for (const goal of goals) {
      const novoProgresso = Math.min(totalReceitas, goal.target_amount);
      await supabase
        .from('goals')
        .update({ current_amount: novoProgresso })
        .eq('id', goal.id)
        .eq('user_id', user.id);
    }

    await fetchGoals();
    setUpdating(false);
  };

  return (
    <div className="p-10 bg-[#F8F9FA] dark:bg-[#0d0d0d] min-h-screen flex flex-col gap-8 transition-colors duration-300">
      {/* Cabeçalho */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-[#D4AF37] flex items-center gap-2">
          <Target className="text-[#D4AF37]" />
          Metas Financeiras
        </h1>
        <button
          onClick={handleSyncWithTransactions}
          disabled={updating}
          className="flex items-center gap-2 bg-black dark:bg-[#222] text-white dark:text-gray-100 px-4 py-2 rounded-lg hover:bg-gray-800 dark:hover:bg-[#333] transition"
        >
          {updating ? (
            <>
              <Loader2 className="animate-spin" size={18} /> Atualizando...
            </>
          ) : (
            <>
              <RefreshCcw size={18} /> Sincronizar Receitas
            </>
          )}
        </button>
      </div>

      {/* Nova Meta */}
      <div className="bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-gray-800 rounded-2xl p-6 shadow-sm">
        <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-[#D4AF37]">
          Nova Meta
        </h2>
        <div className="flex flex-col md:flex-row gap-3">
          <input
            type="text"
            placeholder="Título da meta"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            className="border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#111] text-gray-900 dark:text-gray-100 rounded-lg p-2 w-full focus:ring-2 focus:ring-[#D4AF37]"
          />
          <input
            type="number"
            placeholder="Valor (R$)"
            value={form.target_amount}
            onChange={(e) => setForm({ ...form, target_amount: e.target.value })}
            className="border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#111] text-gray-900 dark:text-gray-100 rounded-lg p-2 w-full md:w-40 focus:ring-2 focus:ring-[#D4AF37]"
          />
          <select
            value={form.profile_id}
            onChange={(e) => setForm({ ...form, profile_id: e.target.value })}
            className="border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#111] text-gray-900 dark:text-gray-100 rounded-lg p-2 focus:ring-2 focus:ring-[#D4AF37]"
          >
            <option value="">Selecione o perfil</option>
            {profiles.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
          <button
            onClick={handleAddGoal}
            className="flex items-center justify-center gap-2 bg-black dark:bg-[#222] text-white dark:text-gray-100 rounded-lg px-4 py-2 hover:bg-gray-800 dark:hover:bg-[#333] transition"
          >
            <PlusCircle size={18} /> Adicionar
          </button>
        </div>
      </div>

      {/* Lista de Metas */}
      <div className="bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-gray-800 rounded-2xl p-6 shadow-sm">
        <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-[#D4AF37]">
          Suas Metas
        </h2>

        {loading ? (
          <div className="flex justify-center items-center py-10 text-gray-500 dark:text-gray-400">
            <Loader2 className="animate-spin mr-2" size={20} />
            Carregando metas...
          </div>
        ) : goals.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400">
            Nenhuma meta encontrada.
          </p>
        ) : (
          <div className="flex flex-col gap-6">
            {goals.map((goal) => {
              const profile = profiles.find((p) => p.id === goal.profile_id);
              const progress =
                (goal.current_amount / goal.target_amount) * 100 || 0;
              return (
                <div
                  key={goal.id}
                  className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm bg-white dark:bg-[#111] transition-all"
                >
                  <div className="flex justify-between items-center mb-2">
                    <div>
                      <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100 flex items-center gap-2">
                        {goal.title}
                        {profile && (
                          <span
                            className="text-xs px-2 py-1 rounded-full"
                            style={{ background: profile.color, color: '#000' }}
                          >
                            {profile.name}
                          </span>
                        )}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        R$ {goal.current_amount.toFixed(2)} de R${' '}
                        {goal.target_amount.toFixed(2)}
                      </p>
                    </div>
                    <button
                      onClick={() => openEdit(goal)}
                      className="text-blue-600 dark:text-blue-400 hover:text-blue-800 transition"
                    >
                      <Edit2 size={18} />
                    </button>
                  </div>

                  <div className="w-full bg-gray-200 dark:bg-[#222] rounded-full h-3 overflow-hidden">
                    <div
                      className={`h-3 rounded-full transition-all duration-700 ${
                        progress >= 100
                          ? 'bg-green-600'
                          : progress >= 70
                          ? 'bg-yellow-500'
                          : 'bg-[#D4AF37]'
                      }`}
                      style={{ width: `${Math.min(progress, 100)}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal de Edição */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-gray-800 rounded-2xl shadow-2xl w-full max-w-md p-6 relative transition-all">
            <button
              className="absolute top-3 right-3 text-gray-500 dark:text-gray-300 hover:text-black dark:hover:text-white"
              onClick={() => setShowModal(false)}
            >
              <X size={22} />
            </button>

            <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-[#D4AF37]">
              Editar Meta
            </h2>

            <div className="flex flex-col gap-3">
              <input
                type="text"
                placeholder="Título"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="border border-gray-300 dark:border-gray-700 rounded-lg p-2 bg-white dark:bg-[#111] text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-[#D4AF37]"
              />
              <input
                type="number"
                placeholder="Valor (R$)"
                value={form.target_amount}
                onChange={(e) =>
                  setForm({ ...form, target_amount: e.target.value })
                }
                className="border border-gray-300 dark:border-gray-700 rounded-lg p-2 bg-white dark:bg-[#111] text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-[#D4AF37]"
              />
              <select
                value={form.profile_id}
                onChange={(e) =>
                  setForm({ ...form, profile_id: e.target.value })
                }
                className="border border-gray-300 dark:border-gray-700 rounded-lg p-2 bg-white dark:bg-[#111] text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-[#D4AF37]"
              >
                <option value="">Selecione o perfil</option>
                {profiles.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>

              <div className="flex justify-between mt-4">
                <button
                  onClick={deleteGoal}
                  className="flex items-center gap-2 text-red-600 dark:text-red-400 hover:text-red-800"
                >
                  <Trash2 size={18} /> Excluir
                </button>

                <div className="flex gap-2">
                  <button
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 dark:bg-[#222] dark:text-gray-100 dark:hover:bg-[#333] transition"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={saveEdit}
                    className="px-4 py-2 rounded-lg bg-black text-white hover:bg-gray-800 dark:bg-[#D4AF37] dark:text-black dark:hover:bg-[#c19c32] transition"
                  >
                    <Save size={18} className="inline-block mr-1" />
                    Salvar
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
