import type { ReactNode } from "react";

interface Props {
  rotulo: string;
  valor: ReactNode;
  detalhe?: ReactNode;
  tom?: "neutro" | "alerta" | "ok";
  icone?: ReactNode;
}

export default function StatTile({ rotulo, valor, detalhe, tom = "neutro", icone }: Props) {
  const corValor =
    tom === "alerta" ? "text-status-alert" : tom === "ok" ? "text-status-ok" : "text-ink-900";
  return (
    <div className="card px-4 py-4">
      <div className="flex items-start justify-between">
        <p className="text-sm text-ink-500">{rotulo}</p>
        {icone && <span className="text-ink-400">{icone}</span>}
      </div>
      <p className={`mt-2 text-2xl font-semibold tnum ${corValor}`}>{valor}</p>
      {detalhe && <p className="mt-1 text-xs text-ink-400">{detalhe}</p>}
    </div>
  );
}
