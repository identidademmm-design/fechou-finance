'use client';

import { useEffect, useState } from 'react';
import { supabaseBrowser } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { Plus, Edit2, Trash2, X, Save, Users } from 'lucide-react';
import { useProfiles } from '@/hooks/useProfiles';

export default function ProfilesPage() {
  const supabase = supabaseBrowser();
  const router = useRouter();
  const { profiles, loading, fetchProfiles } = useProfiles(); // ✅ Corrigido

  const [user, setUser] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', color: '#D4AF37' });

  // 🔐 Verifica usuário logado
  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      if (!data.user) router.push('/login');
      else setUser(data.user);
    })();
  }, [supabase, router]);

  // 🟢 Criação e edição
  function openCreate() {
    setEditingId(null);
    setForm({ name: '', color: '#D4AF37' });
    setShowModal(true);
  }

  function openEdit(p: any) {
    setEditingId(p.id);
    setForm({ name: p.name, color: p.color || '#D4AF37' });
    setShowModal(true);
  }

  async function save() {
    if (!form.name.trim()) return;

    if (editingId) {
      await supabase
        .from('profiles')
        .update({ name: form.name.trim(), color: form.color })
        .eq('id', editingId);
    } else {
      await supabase.from('profiles').insert([
        {
          user_id: user.id,
          name: form.name.trim(),
          color: form.color,
        },
      ]);
    }

    setShowModal(false);
    setEditingId(null);
    setForm({ name: '', color: '#D4AF37' });
    fetchProfiles(); // ✅ Atualiza corretamente
  }

  // 🔴 Exclusão completa (perfil + transações + metas)
  async function remove(id: string) {
    if (
      !confirm(
        '⚠️ Tem certeza que deseja excluir este perfil? Todas as transações e metas vinculadas a ele serão permanentemente apagadas!'
      )
    )
      return;

    try {
      // 🔹 1. Apaga transações vinculadas a este perfil
      const { error: txError } = await supabase
        .from('transactions')
        .delete()
        .eq('profile_id', id);

      if (txError) {
        console.error('Erro ao excluir transações:', txError.message);
        alert('Erro ao excluir as transações deste perfil.');
        return;
      }

      // 🔹 2. Apaga metas vinculadas (caso use tabela "goals")
      const { error: goalsError } = await supabase
        .from('goals')
        .delete()
        .eq('profile_id', id);

      if (goalsError) {
        console.error('Erro ao excluir metas:', goalsError.message);
        alert('Erro ao excluir metas deste perfil.');
        return;
      }

      // 🔹 3. Finalmente, apaga o perfil
      const { error: profileError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', id);

      if (profileError) {
        console.error('Erro ao excluir perfil:', profileError.message);
        alert('Erro ao excluir o perfil.');
        return;
      }

      // 🔹 4. Atualiza a lista de perfis
      fetchProfiles();

      alert('✅ Perfil e todos os dados vinculados foram excluídos com sucesso!');
    } catch (err) {
      console.error('Erro inesperado ao excluir perfil:', err);
      alert('Erro inesperado ao excluir o perfil.');
    }
  }

  return (
    <div className="p-10 bg-[#F8F9FA] dark:bg-[#0d0d0d] min-h-screen flex flex-col gap-6 transition-all duration-300">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center gap-2 text-gray-900 dark:text-[#D4AF37]">
          <Users className="text-[#D4AF37]" /> Perfis Financeiros
        </h1>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 bg-black dark:bg-[#222] text-white dark:text-gray-100 px-4 py-2 rounded-lg hover:bg-gray-800 dark:hover:bg-[#333] transition"
        >
          <Plus size={18} /> Novo perfil
        </button>
      </div>

      {/* Lista de Perfis */}
      <div className="bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-gray-800 rounded-2xl p-6 shadow-sm">
        {loading ? (
          <p className="text-gray-500 dark:text-gray-400">Carregando…</p>
        ) : profiles.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400">
            Nenhum perfil ainda. Crie o primeiro!
          </p>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {profiles.map((p) => (
              <div
                key={p.id}
                className="border dark:border-gray-700 rounded-xl p-4 flex items-center justify-between bg-white dark:bg-[#111] hover:shadow-md dark:hover:bg-[#1a1a1a] transition-all"
              >
                <div className="flex items-center gap-3">
                  <span
                    className="inline-block w-3 h-3 rounded-full"
                    style={{ background: p.color || '#D4AF37' }}
                  />
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-gray-100">
                      {p.name}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Criado em {new Date(p.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => openEdit(p)}
                    className="text-blue-600 dark:text-blue-400 hover:text-blue-800"
                  >
                    <Edit2 size={18} />
                  </button>
                  <button
                    onClick={() => remove(p.id)}
                    className="text-red-600 dark:text-red-400 hover:text-red-800"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal de Criação/Edição */}
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
              {editingId ? 'Editar Perfil' : 'Novo Perfil'}
            </h2>

            <div className="flex flex-col gap-3">
              <input
                type="text"
                placeholder="Nome do perfil (ex: Pessoal, Empresa, Mãe)"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="border border-gray-300 dark:border-gray-700 rounded-lg p-2 bg-white dark:bg-[#111] text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-[#D4AF37] focus:outline-none"
              />
              <div className="flex items-center gap-3">
                <label className="text-sm text-gray-600 dark:text-gray-300">
                  Cor:
                </label>
                <input
                  type="color"
                  value={form.color}
                  onChange={(e) => setForm({ ...form, color: e.target.value })}
                  className="w-10 h-10 p-0 border border-gray-300 dark:border-gray-700 rounded cursor-pointer"
                />
              </div>
              <div className="flex justify-end gap-2 mt-2">
                <button
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 dark:bg-[#222] dark:text-gray-100 dark:hover:bg-[#333] transition"
                >
                  Cancelar
                </button>
                <button
                  onClick={save}
                  className="px-4 py-2 rounded-lg bg-black text-white hover:bg-gray-800 dark:bg-[#D4AF37] dark:text-black dark:hover:bg-[#c19c32] transition"
                >
                  <Save size={18} className="inline-block mr-1" />
                  Salvar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
