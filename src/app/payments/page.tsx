'use client';
import { useState } from 'react';

export default function PaymentsPage() {
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string|undefined>();

  async function handlePay() {
    setLoading(true); setMessage(undefined);
    try {
      const normalized = amount.replace(',', '.').trim();
      const value = parseFloat(normalized);
      if (isNaN(value)) throw new Error('Informe um valor numérico');
      const cents = Math.round(value * 100);
      const res = await fetch('/payments/api/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amountCents: cents, description: 'Cobrança via Fechou' })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Falha ao criar pagamento');
      if (data.nextAction?.type === 'redirect' && data.nextAction.url) {
        window.location.href = data.nextAction.url;
      } else {
        setMessage('Pagamento iniciado. Aguarde Tap to Pay (ou simule via webhook).');
      }
    } catch (e: any) {
      setMessage(e.message);
    } finally { setLoading(false); }
  }

  return (
    <div className="max-w-md mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-4">Receber pagamento</h1>
      <label className="block mb-2">Valor (R$)</label>
      <input
        value={amount}
        onChange={e => setAmount(e.target.value)}
        placeholder="0,00"
        className="border rounded-xl p-3 w-full"
        inputMode="decimal"
      />
      <button onClick={handlePay} disabled={loading} className="mt-4 px-4 py-2 rounded-xl shadow bg-black text-white">
        {loading ? 'Processando...' : 'Cobrar'}
      </button>
      {message && <p className="mt-3 text-sm text-gray-600">{message}</p>}
    </div>
  );
}
