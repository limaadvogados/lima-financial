import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";

interface Props {
  rotulo: string;
  valor: ReactNode;
  detalhe?: ReactNode;
  tom?: "neutro" | "alerta" | "ok";
  icone?: ReactNode;
  to?: string;
}

export default function StatTile({ rotulo, valor, detalhe, tom = "neutro", icone, to }: Props) {
  const corValor =
    tom === "alerta" ? "text-status-alert" : tom === "ok" ? "text-status-ok" : "text-ink-900";

  const conteudo = (
    <>
      <div className="flex items-start justify-between">
        <p className="text-sm text-ink-500">{rotulo}</p>
        <span className="text-ink-400">{to ? <ArrowUpRight size={16} /> : icone}</span>
      </div>
      <p className={`mt-2 text-2xl font-semibold tnum ${corValor}`}>{valor}</p>
      {detalhe && <p className="mt-1 text-xs text-ink-400">{detalhe}</p>}
    </>
  );

  if (to) {
    return (
      <Link
        to={to}
        className="card group px-4 py-4 text-left transition hover:border-brand-600/40 hover:shadow-pop focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
      >
        {conteudo}
      </Link>
    );
  }
  return <div className="card px-4 py-4">{conteudo}</div>;
}
