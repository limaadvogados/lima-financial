import type { Assinatura, Lancamento } from "./types";
import { mesDoLancamento, shiftMes } from "./format";

/** Lançamentos de um mês (YYYY-MM). */
export function lancamentosDoMes(lancs: Lancamento[], mes: string): Lancamento[] {
  return lancs.filter((l) => mesDoLancamento(l.data) === mes);
}

export interface LinhaAssinatura {
  assinatura: Assinatura;
  caiu: boolean;
  valorCobrado: number | null;
  divergente: boolean; // cobrado diferente do esperado
  lancamento: Lancamento | null;
}

/**
 * Para o mês selecionado, confere cada assinatura ativa:
 * - mensal: precisa ter um lançamento tipo 'assinatura' vinculado no próprio mês.
 * - anual: considera "em dia" se houve cobrança nos últimos 12 meses (até o mês).
 */
export function conferirAssinaturas(
  assinaturas: Assinatura[],
  lancs: Lancamento[],
  mes: string
): LinhaAssinatura[] {
  const ativas = assinaturas.filter((a) => a.ativo);
  const ultimos12: string[] = [];
  for (let i = 0; i < 12; i++) ultimos12.push(shiftMes(mes, -i));

  return ativas
    .map((a) => {
      const vinculados = lancs.filter((l) => l.assinatura_id === a.id);
      let lanc: Lancamento | null = null;
      if (a.ciclo === "mensal") {
        lanc = vinculados.find((l) => mesDoLancamento(l.data) === mes) ?? null;
      } else {
        // anual: a cobrança mais recente dentro da janela de 12 meses
        lanc =
          vinculados
            .filter((l) => ultimos12.includes(mesDoLancamento(l.data)))
            .sort((x, y) => (x.data < y.data ? 1 : -1))[0] ?? null;
      }
      const valorCobrado = lanc ? lanc.valor : null;
      const divergente =
        lanc != null && Math.abs(lanc.valor - a.valor_esperado) > 0.001;
      return { assinatura: a, caiu: lanc != null, valorCobrado, divergente, lancamento: lanc };
    })
    .sort((a, b) => Number(a.caiu) - Number(b.caiu) || a.assinatura.nome.localeCompare(b.assinatura.nome));
}

export interface GrupoReembolso {
  beneficiario: string;
  itens: Lancamento[];
  totalDevido: number;
  totalPago: number;
  totalPendente: number;
}

/** Reembolsos do mês, agrupados por beneficiário. */
export function agruparReembolsos(lancs: Lancamento[], mes: string): GrupoReembolso[] {
  const doMes = lancamentosDoMes(lancs, mes).filter((l) => l.tipo === "reembolso");
  const mapa = new Map<string, Lancamento[]>();
  for (const l of doMes) {
    const b = l.beneficiario?.trim() || "Sem beneficiário";
    if (!mapa.has(b)) mapa.set(b, []);
    mapa.get(b)!.push(l);
  }
  return Array.from(mapa.entries())
    .map(([beneficiario, itens]) => {
      const totalDevido = soma(itens);
      const totalPago = soma(itens.filter((i) => i.reembolsado));
      return {
        beneficiario,
        itens: itens.sort((a, b) => (a.data < b.data ? -1 : 1)),
        totalDevido,
        totalPago,
        totalPendente: totalDevido - totalPago,
      };
    })
    .sort((a, b) => b.totalPendente - a.totalPendente || a.beneficiario.localeCompare(b.beneficiario));
}

export interface ConfRecibos {
  total: number;
  comRecibo: number;
  semRecibo: Lancamento[];
  pct: number; // 0-100
}

/** Conferência de recibos do mês. */
export function conferirRecibos(lancs: Lancamento[], mes: string): ConfRecibos {
  const doMes = lancamentosDoMes(lancs, mes);
  const comRecibo = doMes.filter((l) => l.tem_recibo).length;
  const semRecibo = doMes
    .filter((l) => !l.tem_recibo)
    .sort((a, b) => (a.data < b.data ? -1 : 1));
  const total = doMes.length;
  return {
    total,
    comRecibo,
    semRecibo,
    pct: total === 0 ? 100 : Math.round((comRecibo / total) * 100),
  };
}

export function soma(lancs: Lancamento[]): number {
  return lancs.reduce((acc, l) => acc + (l.valor || 0), 0);
}

/** Total em BRL do mês (ignora USD, que é tratado à parte). */
export function totalBRLMes(lancs: Lancamento[], mes: string): number {
  return soma(lancamentosDoMes(lancs, mes).filter((l) => l.moeda === "BRL"));
}

export function totalUSDMes(lancs: Lancamento[], mes: string): number {
  return soma(lancamentosDoMes(lancs, mes).filter((l) => l.moeda === "USD"));
}

export interface ResumoMes {
  totalBRL: number;
  totalUSD: number;
  qtdLancamentos: number;
  assinaturasFaltando: number;
  reembolsosPendentesValor: number;
  reembolsosPendentesQtd: number;
  semReciboQtd: number;
  pendencias: number;
}

export function resumoMes(
  assinaturas: Assinatura[],
  lancs: Lancamento[],
  mes: string
): ResumoMes {
  const doMes = lancamentosDoMes(lancs, mes);
  const faltando = conferirAssinaturas(assinaturas, lancs, mes).filter((l) => !l.caiu).length;
  const grupos = agruparReembolsos(lancs, mes);
  const pendItens = doMes.filter((l) => l.tipo === "reembolso" && !l.reembolsado);
  const recibos = conferirRecibos(lancs, mes);
  const reembPendValor = grupos.reduce((acc, g) => acc + g.totalPendente, 0);
  return {
    totalBRL: soma(doMes.filter((l) => l.moeda === "BRL")),
    totalUSD: soma(doMes.filter((l) => l.moeda === "USD")),
    qtdLancamentos: doMes.length,
    assinaturasFaltando: faltando,
    reembolsosPendentesValor: reembPendValor,
    reembolsosPendentesQtd: pendItens.length,
    semReciboQtd: recibos.semRecibo.length,
    pendencias: faltando + pendItens.length + recibos.semRecibo.length,
  };
}

/** Gasto em BRL por tipo, no mês. */
export function gastoPorTipo(lancs: Lancamento[], mes: string) {
  const doMes = lancamentosDoMes(lancs, mes).filter((l) => l.moeda === "BRL");
  const base = { assinatura: 0, reembolso: 0, compra: 0 };
  for (const l of doMes) base[l.tipo] += l.valor || 0;
  return base;
}

/** Série de gasto total BRL por mês (últimos n meses até `mes`). */
export function serieMensal(lancs: Lancamento[], mes: string, n = 6) {
  const out: { mes: string; total: number }[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const m = shiftMes(mes, -i);
    out.push({ mes: m, total: totalBRLMes(lancs, m) });
  }
  return out;
}
