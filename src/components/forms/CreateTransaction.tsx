'use client';

import { useState } from 'react';
import { useProfiles } from '@/hooks/useProfiles';
import { useSelectedProfile } from '@/hooks/useSelectedProfile';

export default function CreateTransaction() {
  const { profiles } = useProfiles();
  const { selectedProfile } = useSelectedProfile();

  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState('expense');
  const [profileId, setProfileId] = useState(selectedProfile || '');
  const [dueDate, setDueDate] = useState('');

  const handleSubmit = async (e: any) => {
    e.preventDefault();

    if (!profileId) {
      alert('Selecione um perfil!');
      return;
    }

    const res = await fetch('/api/transactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount: Number(amount),
        description,
        type,
        profile_id: profileId,
        due_date: dueDate,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      alert('Erro: ' + data.error);
      return;
    }

    alert('Transação criada com sucesso!');
    setAmount('');
    setDescription('');
    setDueDate('');
  };

  return (
    <form className="flex flex-col gap-4 bg-white p-6 rounded-lg shadow-md" onSubmit={handleSubmit}>
      <h2 className="text-xl font-bold">Criar Transação</h2>

      <input
        type="number"
        placeholder="Valor"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        className="border p-2 rounded"
        required
      />

      <input
        type="text"
        placeholder="Descrição"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        className="border p-2 rounded"
      />

      <select
        value={type}
        onChange={(e) => setType(e.target.value)}
        className="border p-2 rounded"
      >
        <option value="expense">Despesa</option>
        <option value="income">Receita</option>
      </select>

      <select
        value={profileId}
        onChange={(e) => setProfileId(e.target.value)}
        className="border p-2 rounded"
        required
      >
        <option value="">Selecione um perfil</option>
        {profiles.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name}
          </option>
        ))}
      </select>

      <input
        type="date"
        value={dueDate}
        onChange={(e) => setDueDate(e.target.value)}
        className="border p-2 rounded"
      />

      <button
        type="submit"
        className="bg-black text-yellow-400 p-2 rounded font-semibold"
      >
        Criar
      </button>
    </form>
  );
}
