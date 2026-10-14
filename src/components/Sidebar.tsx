import { NavLink } from "react-router-dom";
import { LayoutDashboard, Receipt, RefreshCw, ClipboardCheck, Scale, LogOut } from "lucide-react";
import { useAuth } from "../context/AuthContext";

const NAV = [
  { to: "/", label: "Painel", icon: LayoutDashboard, end: true },
  { to: "/lancamentos", label: "Lançamentos", icon: Receipt, end: false },
  { to: "/assinaturas", label: "Assinaturas", icon: RefreshCw, end: false },
  { to: "/fechamento", label: "Fechamento", icon: ClipboardCheck, end: false },
];

export default function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const { session, sair } = useAuth();
  return (
    <div className="flex h-full flex-col bg-brand-900 text-white">
      <div className="flex items-center gap-2.5 px-5 pb-6 pt-6">
        <span className="grid h-9 w-9 place-items-center rounded-md bg-gold/20 ring-1 ring-gold/30">
          <Scale size={20} className="text-gold" />
        </span>
        <div className="leading-tight">
          <p className="display text-[15px] font-semibold">Lima Advogados</p>
          <p className="text-[11px] text-white/55">Controle financeiro</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-3">
        {NAV.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={onNavigate}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-md px-3 py-2.5 text-sm transition ${
                isActive
                  ? "bg-white/12 font-semibold text-white"
                  : "text-white/70 hover:bg-white/8 hover:text-white"
              }`
            }
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-white/10 px-5 py-4">
        <p className="truncate text-xs text-white/50" title={session?.user.email ?? ""}>
          {session?.user.email}
        </p>
        <button
          onClick={sair}
          className="mt-2 flex items-center gap-2 text-sm text-white/70 hover:text-white"
        >
          <LogOut size={16} /> Sair
        </button>
      </div>
    </div>
  );
}
