'use client';

import { useEffect, useState } from 'react';

/**
 * Hook responsável por manter o perfil selecionado salvo entre páginas
 * e persistido no localStorage.
 */
export function useSelectedProfile() {
  const [selectedProfile, setSelectedProfile] = useState<string>('');

  // 🔹 Carrega o perfil salvo quando o app inicia
  useEffect(() => {
    const stored = localStorage.getItem('selectedProfile');
    if (stored) setSelectedProfile(stored);
  }, []);

  // 🔹 Atualiza o perfil selecionado e salva no localStorage
  const updateProfile = (id: string) => {
    setSelectedProfile(id);
    if (id) {
      localStorage.setItem('selectedProfile', id);
    } else {
      localStorage.removeItem('selectedProfile');
    }
  };

  return { selectedProfile, updateProfile };
}
