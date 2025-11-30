'use client';

import { useState, useEffect } from 'react';
import { Menu, X } from 'lucide-react';
import Sidebar from './Sidebar';

export default function MobileHeader() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (open) document.body.classList.add("menu-open");
    else document.body.classList.remove("menu-open");
  }, [open]);

  return (
    <>
      {/* Top bar — só no mobile */}
      <header className="md:hidden fixed top-0 left-0 w-full h-16 bg-black text-white flex items-center justify-between px-4 z-30 shadow-lg">
        <h1 className="text-lg font-bold">
          Fechou <span className="text-[#D4AF37]">Finance</span>
        </h1>

        <button onClick={() => setOpen(true)}>
          <Menu size={28} />
        </button>
      </header>

      {/* MENU MOBILE */}
      {open && (
        <div
          className="mobile-overlay"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-72 h-full bg-black shadow-xl p-4 animate-slide-right"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setOpen(false)}
              className="absolute top-4 right-4 text-white"
            >
              <X size={26} />
            </button>

            <Sidebar onNavigate={() => setOpen(false)} />
          </div>
        </div>
      )}

      <div className="h-16 md:hidden" />
    </>
  );
}
