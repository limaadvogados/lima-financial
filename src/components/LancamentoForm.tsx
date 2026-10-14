import { useState } from "react";
import { Upload, FileCheck2, Loader2 } from "lucide-react";
import { useData } from "../context/DataContext";
import { supabase, RECIBOS_BUCKET } from "../lib/supabase";
import type {
  Lancamento,
  LancamentoInput,
  Moeda,
  StatusLancamento,
  TipoLancamento,
} from "../lib/types";
import { mesAtual } from "../lib/format";

interface Props {
  inicial?: Lancamento | null;
  onSalvo: () => void;
  onCancelar: () => void;
}

export default function LancamentoForm({ inicial, onSalvo, onCancelar }: Props) {
  const { assinaturas, salvarLancamento } = useData();
  const [f, setF] = useState<LancamentoInput>(() => ({
    data: inicial?.data ?? `${mesAtual()}-01`,
    descricao: inicial?.descricao ?? "",
    valor: inicial?.valor ?? 0,
    moeda: inicial?.moeda ?? "BRL",
    tipo: inicial?.tipo ?? "compra",
    categoria: inicial?.categoria ?? "",
    status: inicial?.status ?? "pago",
    assinatura_id: inicial?.assinatura_id ?? null,
    beneficiario: inicial?.beneficiario ?? null,
    reembolsado: inicial?.reembolsado ?? false,
    data_reembolso: inicial?.data_reembolso ?? null,
    recibo_url: inicial?.recibo_url ?? null,
    tem_recibo: inicial?.tem_recibo ?? false,
    observacao: inicial?.observacao ?? null,
  }));
  const [enviando, setEnviando] = useState(false);
  const [subindoRecibo, setSubindoRecibo] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  function set<K extends keyof LancamentoInput>(k: K, v: LancamentoInput[K]) {
    setF((old) => ({ ...old, [k]: v }));
  }

  async function subirRecibo(file: File) {
    setSubindoRecibo(true);
    setErro(null);
    try {
      const ext = file.name.split(".").pop() || "bin";
      const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const { error } = await supabase.storage.from(RECIBOS_BUCKET).upload(path, file);
      if (error) throw error;
      setF((old) => ({ ...old, recibo_url: path, tem_recibo: true }));
    } catch (e) {
      setErro("Falha ao subir o recibo: " + (e as Error).message);
    } finally {
      setSubindoRecibo(false);
    }
  }

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    setEnviando(true);
    try {
      const payload: LancamentoInput = {
        ...f,
        categoria: f.categoria?.trim() || null,
        beneficiario: f.tipo === "reembolso" ? f.beneficiario?.trim() || null : null,
        reembolsado: f.tipo === "reembolso" ? f.reembolsado : false,
        data_reembolso: f.tipo === "reembolso" && f.reembolsado ? f.data_reembolso : null,
        assinatura_id: f.tipo === "assinatura" ? f.assinatura_id : null,
        observacao: f.observacao?.trim() || null,
      };
      await salvarLancamento(payload, inicial?.id);
      onSalvo();
    } catch (e) {
      setErro((e as Error).message);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <form onSubmit={enviar} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Data</label>
          <input
            type="date"
            required
            className="field"
            value={f.data}
            onChange={(e) => set("data", e.target.value)}
          />
        </div>
        <div>
          <label className="label">Tipo</label>
          <select
            className="field"
            value={f.tipo}
            onChange={(e) => set("tipo", e.target.value as TipoLancamento)}
          >
            <option value="compra">Compra</option>
            <option value="assinatura">Assinatura</option>
            <option value="reembolso">Reembolso</option>
          </select>
        </div>
      </div>

      <div>
        <label className="label">Descrição</label>
        <input
          required
          className="field"
          value={f.descricao}
          onChange={(e) => set("descricao", e.target.value)}
          placeholder="Ex.: Jusbrasil, Papelaria, Recibo Uber…"
        />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="label">Valor</label>
          <input
            type="number"
            step="0.01"
            min="0"
            required
            className="field tnum"
            value={f.valor}
            onChange={(e) => set("valor", parseFloat(e.target.value) || 0)}
          />
        </div>
        <div>
          <label className="label">Moeda</label>
          <select
            className="field"
            value={f.moeda}
            onChange={(e) => set("moeda", e.target.value as Moeda)}
          >
            <option value="BRL">Real (R$)</option>
            <option value="USD">Dólar (US$)</option>
          </select>
        </div>
        <div>
          <label className="label">Status</label>
          <select
            className="field"
            value={f.status}
            onChange={(e) => set("status", e.target.value as StatusLancamento)}
          >
            <option value="pago">Pago</option>
            <option value="pendente">Pendente</option>
          </select>
        </div>
      </div>

      {f.tipo === "assinatura" ? (
        <div>
          <label className="label">Assinatura vinculada</label>
          <select
            className="field"
            value={f.assinatura_id ?? ""}
            onChange={(e) => set("assinatura_id", e.target.value || null)}
          >
            <option value="">— Nenhuma —</option>
            {assinaturas.map((a) => (
              <option key={a.id} value={a.id}>
                {a.nome}
              </option>
            ))}
          </select>
          <p className="mt-1 text-xs text-ink-400">
            Vincular ajuda o fechamento a saber que essa recorrente caiu no mês.
          </p>
        </div>
      ) : (
        <div>
          <label className="label">Categoria</label>
          <input
            className="field"
            value={f.categoria ?? ""}
            onChange={(e) => set("categoria", e.target.value)}
            placeholder="Ex.: Audiência, Transporte, Correios…"
          />
        </div>
      )}

      {f.tipo === "reembolso" && (
        <div className="rounded-md border border-line bg-paper/60 p-3">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Beneficiário</label>
              <input
                className="field"
                value={f.beneficiario ?? ""}
                onChange={(e) => set("beneficiario", e.target.value)}
                placeholder="Quem adiantou"
              />
            </div>
            <div>
              <label className="label">Data do reembolso</label>
              <input
                type="date"
                className="field"
                disabled={!f.reembolsado}
                value={f.data_reembolso ?? ""}
                onChange={(e) => set("data_reembolso", e.target.value || null)}
              />
            </div>
          </div>
          <label className="mt-3 flex items-center gap-2 text-sm text-ink-700">
            <input
              type="checkbox"
              checked={f.reembolsado}
              onChange={(e) =>
                setF((old) => ({
                  ...old,
                  reembolsado: e.target.checked,
                  data_reembolso: e.target.checked
                    ? old.data_reembolso ?? new Date().toISOString().slice(0, 10)
                    : null,
                }))
              }
            />
            Já reembolsado
          </label>
        </div>
      )}

      <div>
        <label className="label">Recibo / comprovante</label>
        <div className="flex items-center gap-3">
          <label className="btn-ghost cursor-pointer">
            {subindoRecibo ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
            {f.tem_recibo ? "Trocar arquivo" : "Anexar arquivo"}
            <input
              type="file"
              className="hidden"
              accept="image/*,application/pdf"
              onChange={(e) => e.target.files?.[0] && subirRecibo(e.target.files[0])}
            />
          </label>
          {f.tem_recibo && (
            <span className="flex items-center gap-1 text-sm text-status-ok">
              <FileCheck2 size={16} /> Recibo anexado
            </span>
          )}
          {!f.tem_recibo && (
            <label className="flex items-center gap-2 text-sm text-ink-500">
              <input
                type="checkbox"
                checked={f.tem_recibo}
                onChange={(e) => set("tem_recibo", e.target.checked)}
              />
              Marcar como tendo recibo (sem anexar)
            </label>
          )}
        </div>
      </div>

      <div>
        <label className="label">Observação</label>
        <textarea
          className="field min-h-[60px]"
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
          {enviando ? "Salvando…" : "Salvar lançamento"}
        </button>
      </div>
    </form>
  );
}
