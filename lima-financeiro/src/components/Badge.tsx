import type { TipoLancamento } from "../lib/types";
import { TIPO_LABEL } from "../lib/types";

const TIPO_CLASSES: Record<TipoLancamento, string> = {
  assinatura: "bg-data-assinatura/10 text-data-assinatura",
  reembolso: "bg-data-reembolso/10 text-data-reembolso",
  compra: "bg-data-compra/10 text-data-compra",
};

export function TipoBadge({ tipo }: { tipo: TipoLancamento }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${TIPO_CLASSES[tipo]}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden />
      {TIPO_LABEL[tipo]}
    </span>
  );
}

export function StatusBadge({ status }: { status: "pago" | "pendente" }) {
  const pago = status === "pago";
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
        pago ? "bg-status-ok/10 text-status-ok" : "bg-status-warn/15 text-[#8a5d00]"
      }`}
    >
      {pago ? "Pago" : "Pendente"}
    </span>
  );
}
