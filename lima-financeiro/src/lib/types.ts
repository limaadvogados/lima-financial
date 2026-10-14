export type Moeda = "BRL" | "USD";
export type Ciclo = "mensal" | "anual";
export type TipoLancamento = "assinatura" | "reembolso" | "compra";
export type StatusLancamento = "pago" | "pendente";

export interface Assinatura {
  id: string;
  nome: string;
  categoria: string;
  valor_esperado: number;
  moeda: Moeda;
  ciclo: Ciclo;
  dia_vencimento: number | null;
  ativo: boolean;
  observacao: string | null;
  created_at: string;
}

export interface Lancamento {
  id: string;
  data: string; // YYYY-MM-DD
  descricao: string;
  valor: number;
  moeda: Moeda;
  tipo: TipoLancamento;
  categoria: string | null;
  status: StatusLancamento;
  assinatura_id: string | null;
  beneficiario: string | null;
  reembolsado: boolean;
  data_reembolso: string | null;
  recibo_url: string | null;
  tem_recibo: boolean;
  observacao: string | null;
  created_at: string;
}

export type LancamentoInput = Omit<Lancamento, "id" | "created_at">;
export type AssinaturaInput = Omit<Assinatura, "id" | "created_at">;

export const TIPO_LABEL: Record<TipoLancamento, string> = {
  assinatura: "Assinatura",
  reembolso: "Reembolso",
  compra: "Compra",
};
