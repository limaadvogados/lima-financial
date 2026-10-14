import type { Moeda } from "./types";

export function formatBRL(v: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(v || 0);
}

export function formatUSD(v: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "USD",
  }).format(v || 0);
}

export function formatMoeda(v: number, moeda: Moeda): string {
  return moeda === "USD" ? formatUSD(v) : formatBRL(v);
}

/** Data YYYY-MM-DD -> dd/mm/aaaa (sem fuso, trata string pura). */
export function formatData(iso: string | null): string {
  if (!iso) return "—";
  const [y, m, d] = iso.slice(0, 10).split("-");
  if (!y || !m || !d) return iso;
  return `${d}/${m}/${y}`;
}

/** Mês de referência atual no formato YYYY-MM (horário local). */
export function mesAtual(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

const MESES_PT = [
  "janeiro", "fevereiro", "março", "abril", "maio", "junho",
  "julho", "agosto", "setembro", "outubro", "novembro", "dezembro",
];

/** YYYY-MM -> "outubro de 2026" */
export function nomeMes(mes: string): string {
  const [y, m] = mes.split("-").map(Number);
  if (!y || !m) return mes;
  return `${MESES_PT[m - 1]} de ${y}`;
}

/** YYYY-MM -> "out/26" (compacto para eixos) */
export function mesCurto(mes: string): string {
  const [y, m] = mes.split("-").map(Number);
  if (!y || !m) return mes;
  return `${MESES_PT[m - 1].slice(0, 3)}/${String(y).slice(2)}`;
}

export function mesDoLancamento(dataIso: string): string {
  return dataIso.slice(0, 7);
}

/** Avança/retrocede um mês YYYY-MM. */
export function shiftMes(mes: string, delta: number): string {
  const [y, m] = mes.split("-").map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}
