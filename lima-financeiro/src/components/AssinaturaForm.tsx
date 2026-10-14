import { useState } from "react";
import { useData } from "../context/DataContext";
import type { Assinatura, AssinaturaInput, Ciclo, Moeda } from "../lib/types";

interface Props {
  inicial?: Assinatura | null;
  onSalvo: () => void;
  onCancelar: () => void;
}

export default function AssinaturaForm({ inicial, onSalvo, onCancelar }: Props) {
  const { salvarAssinatura } = useData();
  const [f, setF] = useState<AssinaturaInput>(() => ({
    nome: inicial?.nome ?? "",
    categoria: inicial?.categoria ?? "Geral",
    valor_esperado: inicial?.valor_esperado ?? 0,
    moeda: inicial?.moeda ?? "BRL",
    ciclo: inicial?.ciclo ?? "mensal",
    dia_vencimento: inicial?.dia_vencimento ?? null,
    ativo: inicial?.ativo ?? true,
    observacao: inicial?.observacao ?? null,
  }));
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  function set<K extends keyof AssinaturaInput>(k: K, v: AssinaturaInput[K]) {
    setF((old) => ({ ...old, [k]: v }));
  }

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    setEnviando(true);
    try {
      await salvarAssinatura(
        {
          ...f,
          categoria: f.categoria.trim() || "Geral",
          observacao: f.observacao?.trim() || null,
        },
        inicial?.id
      );
      onSalvo();
    } catch (e) {
      setErro((e as Error).message);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <form onSubmit={enviar} className="space-y-4">
      <div>
        <label className="label">Nome</label>
        <input required className="field" value={f.nome} onChange={(e) => set("nome", e.target.value)} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Categoria</label>
          <input
            className="field"
            value={f.categoria}
            onChange={(e) => set("categoria", e.target.value)}
            placeholder="Software, Jurídico…"
          />
        </div>
        <div>
          <label className="label">Ciclo</label>
          <select className="field" value={f.ciclo} onChange={(e) => set("ciclo", e.target.value as Ciclo)}>
            <option value="mensal">Mensal</option>
            <option value="anual">Anual</option>
          </select>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="label">Valor esperado</label>
          <input
            type="number"
            step="0.01"
            min="0"
            required
            className="field tnum"
            value={f.valor_esperado}
            onChange={(e) => set("valor_esperado", parseFloat(e.target.value) || 0)}
          />
        </div>
        <div>
          <label className="label">Moeda</label>
          <select className="field" value={f.moeda} onChange={(e) => set("moeda", e.target.value as Moeda)}>
            <option value="BRL">Real (R$)</option>
            <option value="USD">Dólar (US$)</option>
          </select>
        </div>
        <div>
          <label className="label">Dia venc.</label>
          <input
            type="number"
            min="1"
            max="31"
            className="field tnum"
            value={f.dia_vencimento ?? ""}
            onChange={(e) => set("dia_vencimento", e.target.value ? parseInt(e.target.value) : null)}
          />
        </div>
      </div>
      <label className="flex items-center gap-2 text-sm text-ink-700">
        <input type="checkbox" checked={f.ativo} onChange={(e) => set("ativo", e.target.checked)} />
        Assinatura ativa (entra no fechamento mensal)
      </label>
      <div>
        <label className="label">Observação</label>
        <textarea
          className="field min-h-[56px]"
          value={f.observacao ?? ""}
          onChange={(e) => set("observacao", e.target.value)}
        />
      </div>

      {erro && <p className="text-sm text-status-alert">{erro}</p>}

      <div className="flex justify-end gap-2 pt-2">
        <button type="button" className="btn-ghost" onClick={onCancelar}>
          Cancelar
        </button>
        <button type="submit" className="btn-primary" disabled={enviando}>
          {enviando ? "Salvando…" : "Salvar assinatura"}
        </button>
      </div>
    </form>
  );
}
