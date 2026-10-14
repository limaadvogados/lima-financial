import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Plus, Search, Pencil, Trash2, FileText, Check, X } from "lucide-react";
import { useData } from "../context/DataContext";
import { useMonth } from "../context/MonthContext";
import { supabase, RECIBOS_BUCKET } from "../lib/supabase";
import { formatBRL, formatUSD, formatData, nomeMes, mesDoLancamento } from "../lib/format";
import type { Lancamento, TipoLancamento } from "../lib/types";
import { TipoBadge, StatusBadge } from "../components/Badge";
import Modal from "../components/Modal";
import LancamentoForm from "../components/LancamentoForm";

export default function Lancamentos() {
  const { lancamentos, loading, excluirLancamento } = useData();
  const { mes } = useMonth();

  const [params] = useSearchParams();
  const [escopo, setEscopo] = useState<"mes" | "todos">(
    params.get("escopo") === "todos" ? "todos" : "mes"
  );
  const [tipo, setTipo] = useState<TipoLancamento | "todos">(() => {
    const t = params.get("tipo");
    return t === "assinatura" || t === "reembolso" || t === "compra" ? t : "todos";
  });
  const [status, setStatus] = useState<"todos" | "pago" | "pendente">(() => {
    const s = params.get("status");
    return s === "pago" || s === "pendente" ? s : "todos";
  });
  const [recibo, setRecibo] = useState<"todos" | "com" | "sem">(() => {
    const r = params.get("recibo");
    return r === "com" || r === "sem" ? r : "todos";
  });
  const [busca, setBusca] = useState("");

  const [modalAberto, setModalAberto] = useState(false);
  const [editando, setEditando] = useState<Lancamento | null>(null);
  const [excluindo, setExcluindo] = useState<Lancamento | null>(null);

  const filtrados = useMemo(() => {
    const q = busca.trim().toLowerCase();
    return lancamentos.filter((l) => {
      if (escopo === "mes" && mesDoLancamento(l.data) !== mes) return false;
      if (tipo !== "todos" && l.tipo !== tipo) return false;
      if (status !== "todos" && l.status !== status) return false;
      if (recibo === "com" && !l.tem_recibo) return false;
      if (recibo === "sem" && l.tem_recibo) return false;
      if (q && !l.descricao.toLowerCase().includes(q) && !(l.categoria ?? "").toLowerCase().includes(q))
        return false;
      return true;
    });
  }, [lancamentos, escopo, mes, tipo, status, recibo, busca]);

  async function verRecibo(l: Lancamento) {
    if (!l.recibo_url) return;
    const { data, error } = await supabase.storage
      .from(RECIBOS_BUCKET)
      .createSignedUrl(l.recibo_url, 60);
    if (!error && data) window.open(data.signedUrl, "_blank");
  }

  function novo() {
    setEditando(null);
    setModalAberto(true);
  }
  function editar(l: Lancamento) {
    setEditando(l);
    setModalAberto(true);
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="display text-2xl text-ink-900">Lançamentos</h1>
          <p className="text-sm text-ink-500">
            {filtrados.length} registro(s) {escopo === "mes" ? `em ${nomeMes(mes)}` : "no total"}
          </p>
        </div>
        <button className="btn-primary" onClick={novo}>
          <Plus size={16} /> Novo lançamento
        </button>
      </div>

      {/* Filtros */}
      <div className="card flex flex-wrap items-center gap-2 p-3">
        <div className="relative min-w-[180px] flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
          <input
            className="field pl-9"
            placeholder="Buscar descrição ou categoria…"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />
        </div>
        <select className="field w-auto" value={escopo} onChange={(e) => setEscopo(e.target.value as any)}>
          <option value="mes">Mês de referência</option>
          <option value="todos">Todos os meses</option>
        </select>
        <select className="field w-auto" value={tipo} onChange={(e) => setTipo(e.target.value as any)}>
          <option value="todos">Todos os tipos</option>
          <option value="assinatura">Assinaturas</option>
          <option value="reembolso">Reembolsos</option>
          <option value="compra">Compras</option>
        </select>
        <select className="field w-auto" value={status} onChange={(e) => setStatus(e.target.value as any)}>
          <option value="todos">Todos os status</option>
          <option value="pago">Pago</option>
          <option value="pendente">Pendente</option>
        </select>
        <select className="field w-auto" value={recibo} onChange={(e) => setRecibo(e.target.value as any)}>
          <option value="todos">Recibo: todos</option>
          <option value="com">Com recibo</option>
          <option value="sem">Sem recibo</option>
        </select>
      </div>

      {/* Tabela */}
      <div className="card overflow-hidden">
        {loading ? (
          <p className="py-16 text-center text-ink-400">Carregando…</p>
        ) : filtrados.length === 0 ? (
          <p className="py-16 text-center text-ink-400">Nenhum lançamento com esses filtros.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-ink-400">
                  <th className="px-4 py-3 font-medium">Data</th>
                  <th className="px-4 py-3 font-medium">Descrição</th>
                  <th className="px-4 py-3 font-medium">Tipo</th>
                  <th className="px-4 py-3 text-center font-medium">Recibo</th>
                  <th className="px-4 py-3 text-center font-medium">Status</th>
                  <th className="px-4 py-3 text-right font-medium">Valor</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {filtrados.map((l) => (
                  <tr key={l.id} className="hover:bg-paper/60">
                    <td className="whitespace-nowrap px-4 py-3 text-ink-500 tnum">{formatData(l.data)}</td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-ink-900">{l.descricao}</div>
                      {l.categoria && <div className="text-xs text-ink-400">{l.categoria}</div>}
                      {l.tipo === "reembolso" && l.beneficiario && (
                        <div className="text-xs text-ink-400">para {l.beneficiario}</div>
                      )}
                    </td>
                    <td className="px-4 py-3"><TipoBadge tipo={l.tipo} /></td>
                    <td className="px-4 py-3 text-center">
                      {l.recibo_url ? (
                        <button
                          onClick={() => verRecibo(l)}
                          className="text-brand-700 hover:text-brand-800"
                          title="Ver recibo"
                        >
                          <FileText size={16} />
                        </button>
                      ) : l.tem_recibo ? (
                        <Check size={16} className="mx-auto text-status-ok" />
                      ) : (
                        <X size={16} className="mx-auto text-ink-400/60" />
                      )}
                    </td>
                    <td className="px-4 py-3 text-center"><StatusBadge status={l.status} /></td>
                    <td className="whitespace-nowrap px-4 py-3 text-right font-semibold text-ink-900 tnum">
                      {l.moeda === "USD" ? formatUSD(l.valor) : formatBRL(l.valor)}
                      {l.moeda === "USD" && <span className="ml-1 text-xs text-ink-400">US$</span>}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <button
                          onClick={() => editar(l)}
                          className="rounded p-1.5 text-ink-400 hover:bg-paper hover:text-ink-700"
                          title="Editar"
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          onClick={() => setExcluindo(l)}
                          className="rounded p-1.5 text-ink-400 hover:bg-status-alert/10 hover:text-status-alert"
                          title="Excluir"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal
        aberto={modalAberto}
        titulo={editando ? "Editar lançamento" : "Novo lançamento"}
        onFechar={() => setModalAberto(false)}
      >
        <LancamentoForm
          inicial={editando}
          onSalvo={() => setModalAberto(false)}
          onCancelar={() => setModalAberto(false)}
        />
      </Modal>

      <Modal
        aberto={!!excluindo}
        titulo="Excluir lançamento"
        onFechar={() => setExcluindo(null)}
        largura="max-w-md"
      >
        <p className="text-sm text-ink-700">
          Tem certeza que deseja excluir <b>{excluindo?.descricao}</b>? Essa ação não pode ser desfeita.
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <button className="btn-ghost" onClick={() => setExcluindo(null)}>
            Cancelar
          </button>
          <button
            className="btn-danger"
            onClick={async () => {
              if (excluindo) await excluirLancamento(excluindo.id);
              setExcluindo(null);
            }}
          >
            <Trash2 size={16} /> Excluir
          </button>
        </div>
      </Modal>
    </div>
  );
}
