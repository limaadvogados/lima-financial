import { useEffect, type ReactNode } from "react";
import { X } from "lucide-react";

interface Props {
  aberto: boolean;
  titulo: string;
  onFechar: () => void;
  children: ReactNode;
  largura?: string;
}

export default function Modal({ aberto, titulo, onFechar, children, largura = "max-w-lg" }: Props) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onFechar();
    }
    if (aberto) document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [aberto, onFechar]);

  if (!aberto) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-ink-900/40 p-4 pt-[6vh]"
      onMouseDown={onFechar}
    >
      <div
        className={`card w-full ${largura} shadow-pop`}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <h2 className="display text-lg text-ink-900">{titulo}</h2>
          <button
            onClick={onFechar}
            className="rounded-md p-1 text-ink-400 hover:bg-paper hover:text-ink-700"
            aria-label="Fechar"
          >
            <X size={18} />
          </button>
        </div>
        <div className="px-5 py-4">{children}</div>
      </div>
    </div>
  );
}
