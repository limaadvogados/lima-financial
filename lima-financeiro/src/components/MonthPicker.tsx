import { ChevronLeft, ChevronRight } from "lucide-react";
import { useMonth } from "../context/MonthContext";
import { nomeMes, shiftMes } from "../lib/format";

export default function MonthPicker() {
  const { mes, setMes } = useMonth();
  return (
    <div className="flex items-center gap-1 rounded-md border border-line bg-white p-1">
      <button
        className="rounded p-1.5 text-ink-500 hover:bg-paper hover:text-ink-900"
        onClick={() => setMes(shiftMes(mes, -1))}
        aria-label="Mês anterior"
      >
        <ChevronLeft size={18} />
      </button>
      <span className="min-w-[9.5rem] text-center text-sm font-semibold capitalize text-ink-900">
        {nomeMes(mes)}
      </span>
      <button
        className="rounded p-1.5 text-ink-500 hover:bg-paper hover:text-ink-900"
        onClick={() => setMes(shiftMes(mes, 1))}
        aria-label="Próximo mês"
      >
        <ChevronRight size={18} />
      </button>
    </div>
  );
}
