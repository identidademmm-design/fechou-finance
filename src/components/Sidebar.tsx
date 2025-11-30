'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  Home,
  TrendingUp,
  Target,
  Settings,
  CreditCard,
  Users,
} from 'lucide-react';

const menuItems = [
  { name: 'Dashboard', icon: Home, href: '/dashboard' },
  { name: 'Transações', icon: TrendingUp, href: '/transactions' },
  { name: 'Perfis', icon: Users, href: '/profiles' },
  { name: 'Metas', icon: Target, href: '/goals' },
  { name: 'Pagamentos', icon: CreditCard, href: '/payments' },
  { name: 'Configurações', icon: Settings, href: '/settings' },
];

export default function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <div className="w-full h-full bg-black text-white flex flex-col">
      {/* Logo */}
      <div className="p-6 text-center border-b border-white/10">
        <h1 className="text-2xl font-bold">
          <span className="text-[#D4AF37]">Fechou</span> Finance
        </h1>
        <p className="text-xs text-gray-400">Gestão Simplificada</p>
      </div>

      {/* Menu */}
      <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
        {menuItems.map(({ name, icon: Icon, href }) => {
          const active = pathname === href;

          return (
            <Link
              key={href}
              href={href}
              onClick={onNavigate}
              className={`flex items-center gap-3 px-4 py-2 rounded-xl transition-all ${
                active
                  ? 'bg-[#D4AF37] text-black font-semibold shadow-md'
                  : 'hover:bg-[#D4AF37]/20'
              }`}
            >
              <Icon size={20} />
              <span>{name}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
