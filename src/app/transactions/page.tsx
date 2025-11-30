'use client';

import { useEffect, useState } from 'react';
import { supabaseBrowser } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import {
  PlusCircle,
  ArrowUpCircle,
  ArrowDownCircle,
  Loader2,
  Edit2,
  Trash2,
  Save,
  X,
} from 'lucide-react';
import { useTransactionsRealtime } from '@/hooks/useTransactionsRealtime';
import { useProfiles, Profile } from '@/hooks/useProfiles';
import { useSelectedProfile } from '@/hooks/useSelectedProfile';

//
// 🔧 Correção DEFINITIVA do bug da data (SEM UTC)
//
function todayLocal() {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

interface Transaction {
  id: string;
  type: 'income' | 'expense';
  amount: number;
  category: string;
  description: string;
  created_at: string;
  due_date: string | null;
  profile_id: string | null;
}

export default function TransactionsPage() {
  const supabase = supabaseBrowser();
  const router = useRouter();
  const { profiles } = useProfiles();
  const { selectedProfile, updateProfile } = useSelectedProfile();

  const [user, setUser] = useState<any>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editedTransaction, setEditedTransaction] = useState<Partial<Transaction>>({});
  const [newTransaction, setNewTransaction] = useState({
    type: 'income',
    amount: '',
    category: '',
    description: '',
    due_date: '',
    profile_id: '',
  });

  // 🔐 Verifica login
  useEffect(() => {
    const checkUser = async () => {
      const { data } = await supabase.auth.getUser();
      if (!data.user) router.push('/login');
      else setUser(data.user);
    };
    checkUser();
  }, [supabase, router]);

  // 📦 Busca transações
  const fetchTransactions = async () => {
    if (!user) return;
    setLoading(true);

    let query = supabase
      .from('transactions')
      .select('*')
      .eq('user_id', user.id)
      .order('due_date', { ascending: true });

    if (selectedProfile) query = query.eq('profile_id', selectedProfile);

    const { data, error } = await query;
    if (!error) setTransactions(data || []);

    setLoading(false);
  };

  useEffect(() => {
    if (user) fetchTransactions();
  }, [user, selectedProfile]);

  // 🧠 Atualização em tempo real
  useTransactionsRealtime(() => {
    fetchTransactions();
  });

  // ➕ Criar transação
  const addTransaction = async () => {
    if (!user) return;
    if (!newTransaction.amount) return alert('Informe um valor.');

    await supabase.from('transactions').insert([
      {
        user_id: user.id,
        type: newTransaction.type,
        amount: Number(newTransaction.amount),
        category: newTransaction.category || null,
        description: newTransaction.description || null,
        due_date: newTransaction.due_date || todayLocal(),
        profile_id: selectedProfile || null,
      },
    ]);

    setNewTransaction({
      type: 'income',
      amount: '',
      category: '',
      description: '',
      due_date: '',
      profile_id: '',
    });
  };

  // ✏️ Editar transação
  const startEditing = (tx: Transaction) => {
    setEditingId(tx.id);
    setEditedTransaction({ ...tx });
  };

  const saveEdit = async () => {
    if (!editingId) return;

    await supabase
      .from('transactions')
      .update({
        type: editedTransaction.type,
        amount: Number(editedTransaction.amount),
        category: editedTransaction.category,
        description: editedTransaction.description,
        due_date: editedTransaction.due_date || todayLocal(),
        profile_id: editedTransaction.profile_id,
      })
      .eq('id', editingId);

    setEditingId(null);
    setEditedTransaction({});
  };

  // ❌ Excluir
  const deleteTransaction = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta transação?')) return;
    await supabase.from('transactions').delete().eq('id', id);
  };

  return (
    <div className="p-6 md:p-10 bg-[#F8F9FA] dark:bg-[#0d0d0d] min-h-screen flex flex-col gap-8 transition-colors duration-300">

      {/* Cabeçalho */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-[#D4AF37] flex items-center gap-2">
          💸 Transações
        </h1>

        <select
          value={selectedProfile}
          onChange={(e) => updateProfile(e.target.value)}
          className="border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-gray-100 rounded-lg p-3 w-full md:w-64"
        >
          <option value="">Todos os Perfis</option>
          {profiles.map((p: Profile) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </div>

      {/* Formulário */}
      <div className="bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-gray-800 rounded-2xl p-6 shadow-sm">
        <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-[#D4AF37]">
          Adicionar Transação
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          <select
            value={newTransaction.type}
            onChange={(e) =>
              setNewTransaction({ ...newTransaction, type: e.target.value })
            }
            className="border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-gray-100 rounded-lg p-2 w-full"
          >
            <option value="income">Receita</option>
            <option value="expense">Despesa</option>
          </select>

          <input
            type="number"
            placeholder="Valor (R$)"
            value={newTransaction.amount}
            onChange={(e) =>
              setNewTransaction({ ...newTransaction, amount: e.target.value })
            }
            className="border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-gray-100 rounded-lg p-2 w-full"
          />

          <input
            type="text"
            placeholder="Categoria"
            value={newTransaction.category}
            onChange={(e) =>
              setNewTransaction({ ...newTransaction, category: e.target.value })
            }
            className="border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-gray-100 rounded-lg p-2 w-full"
          />

          <input
            type="text"
            placeholder="Descrição"
            value={newTransaction.description}
            onChange={(e) =>
              setNewTransaction({ ...newTransaction, description: e.target.value })
            }
            className="border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-gray-100 rounded-lg p-2 w-full"
          />

          <input
            type="date"
            value={newTransaction.due_date}
            onChange={(e) =>
              setNewTransaction({ ...newTransaction, due_date: e.target.value })
            }
            className="border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-gray-100 rounded-lg p-2 w-full"
          />
        </div>

        <button
          onClick={addTransaction}
          className="mt-4 flex items-center justify-center gap-2 bg-black dark:bg-[#222] text-white rounded-lg px-6 py-3 hover:bg-gray-800 transition w-full md:w-auto"
        >
          <PlusCircle size={18} />
          Adicionar
        </button>
      </div>

      {/* Histórico */}
      <div className="bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-gray-800 rounded-2xl p-6 shadow-sm">
        <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-[#D4AF37]">
          Histórico
        </h2>

        {loading ? (
          <div className="flex justify-center items-center py-10 text-gray-500 dark:text-gray-400">
            <Loader2 className="animate-spin mr-2" size={20} />
            Carregando transações...
          </div>
        ) : transactions.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400">
            Nenhuma transação encontrada.
          </p>
        ) : (
          <div className="flex flex-col divide-y divide-gray-200 dark:divide-gray-800">
            {transactions.map((tx) => (
              <div
                key={tx.id}
                className="flex justify-between items-center py-3 text-gray-700 dark:text-gray-200"
              >
                {editingId === tx.id ? (
                  <div className="flex flex-1 flex-wrap items-center gap-2">
                    <select
                      value={editedTransaction.type}
                      onChange={(e) =>
                        setEditedTransaction({
                          ...editedTransaction,
                          type: e.target.value as 'income' | 'expense',
                        })
                      }
                      className="border p-1 rounded dark:bg-[#1a1a1a] dark:border-gray-700"
                    >
                      <option value="income">Receita</option>
                      <option value="expense">Despesa</option>
                    </select>

                    <input
                      type="number"
                      value={editedTransaction.amount || ''}
                      onChange={(e) =>
                        setEditedTransaction({
                          ...editedTransaction,
                          amount: Number(e.target.value),
                        })
                      }
                      className="border p-1 rounded w-24 dark:bg-[#1a1a1a] dark:border-gray-700"
                    />

                    <input
                      type="text"
                      value={editedTransaction.category || ''}
                      onChange={(e) =>
                        setEditedTransaction({
                          ...editedTransaction,
                          category: e.target.value,
                        })
                      }
                      className="border p-1 rounded w-32 dark:bg-[#1a1a1a] dark:border-gray-700"
                    />

                    <input
                      type="text"
                      value={editedTransaction.description || ''}
                      onChange={(e) =>
                        setEditedTransaction({
                          ...editedTransaction,
                          description: e.target.value,
                        })
                      }
                      className="border p-1 rounded flex-1 dark:bg-[#1a1a1a] dark:border-gray-700"
                    />

                    <input
                      type="date"
                      value={editedTransaction.due_date || ''}
                      onChange={(e) =>
                        setEditedTransaction({
                          ...editedTransaction,
                          due_date: e.target.value,
                        })
                      }
                      className="border p-1 rounded w-36 dark:bg-[#1a1a1a] dark:border-gray-700"
                    />

                    <button
                      onClick={saveEdit}
                      className="text-green-600 hover:text-green-800"
                    >
                      <Save size={20} />
                    </button>

                    <button
                      onClick={() => setEditingId(null)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <X size={20} />
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-3">
                      {tx.type === 'income' ? (
                        <ArrowUpCircle className="text-green-600" size={22} />
                      ) : (
                        <ArrowDownCircle className="text-red-600" size={22} />
                      )}

                      <div>
                        <p className="font-medium">
                          {tx.category || 'Sem categoria'}
                        </p>

                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {tx.description} •{' '}
                          {tx.due_date
                            ? tx.due_date.split('-').reverse().join('/')
                            : '-'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span
                        className={`font-semibold ${
                          tx.type === 'income'
                            ? 'text-green-600'
                            : 'text-red-600'
                        }`}
                      >
                        {tx.type === 'income' ? '+' : '-'} R${' '}
                        {tx.amount.toFixed(2)}
                      </span>

                      <button
                        onClick={() => startEditing(tx)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        <Edit2 size={18} />
                      </button>

                      <button
                        onClick={() => deleteTransaction(tx.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
