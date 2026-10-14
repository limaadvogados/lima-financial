import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  FileText,
  Check,
  HandCoins,
  AlertTriangle,
  CircleDollarSign,
  Upload,
  Loader2,
} from "lucide-react";
import { supabase } from "../lib/supabase";
import { formatBRL, formatUSD, formatData, mesAtual } from "../lib/format";
import Modal from "../components/Modal";
import StatTile from "../components/StatTile";

const COMPROVANTES_BUCKET = "comprovantes";

type Moeda = "BRL" | "USD";
type StatusReceb = "pendente" | "recebido";

interface Recebimento {
  id: string;
  cliente: string;
  valor: number;
  moeda: Moeda;
  data_prevista_cliente: string | null;
  data_vencimento: string;
  status: StatusReceb;
  data_recebimento: string | null;
  comprovante_url: string | null;
  observacao: string | null;
  created_at: string;
}
type RecebimentoInput = Omit<Recebimento, "id" | "created_at">;

const hojeIso = () => new Date().toISOString().slice(0, 10);

function vencido(r: Recebimento): boolean {
  return r.status === "pendente" && r.data_vencimento < hojeIso();
}

export default function Recebimentos() {
  const [itens, setItens] = useState<Recebimento[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [busca, setBusca] = useState("");
  const [filtro, setFiltro] = useState<"todos" | "pendente" | "vencido" | "recebido">("todos");

  const [modalAberto, setModalAberto] = useState(false);
  const [editando, setEditando] = useState<Recebimento | null>(null);
  const [excluindo, setExcluindo] = useState<Recebimento | null>(null);

  const carregar = useCallback(async () => {
    setLoading(true);
    setErro(null);
    const { data, error } = await supabase
      .from("recebimentos")
      .select("*")
      .order("data_vencimento", { ascending: true });
    if (error) setErro(error.message);
    else setItens((data ?? []) as Recebimento[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  const filtrados = useMemo(() => {
    const q = busca.trim().toLowerCase();
    return itens.filter((r) => {
      if (filtro === "pendente" && r.status !== "pendente") return false;
      if (filtro === "recebido" && r.status !== "recebido") return false;
      if (filtro === "vencido" && !vencido(r)) return false;
      if (q && !r.cliente.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [itens, busca, filtro]);

  const resumo = useMemo(() => {
    const pend = itens.filter((r) => r.status === "pendente" && r.moeda === "BRL");
    const venc = itens.filter((r) => vencido(r) && r.moeda === "BRL");
    const receb = itens.filter((r) => r.status === "recebido" && r.moeda === "BRL");
    return {
      aReceber: pend.reduce((s, r) => s + r.valor, 0),
      aReceberQtd: pend.length,
      vencido: venc.reduce((s, r) => s + r.valor, 0),
      vencidoQtd: venc.length,
      recebido: receb.reduce((s, r) => s + r.valor, 0),
    };
  }, [itens]);

  async function marcarRecebido(r: Recebimento, recebido: boolean) {
    const { error } = await supabase
      .from("recebimentos")
      .update({
        status: recebido ? "recebido" : "pendente",
        data_recebimento: recebido ? hojeIso() : null,
      })
      .eq("id", r.id);
    if (!error) carregar();
  }

  async function verComprovante(r: Recebimento) {
    if (!r.comprovante_url) return;
    const { data } = await supabase.storage
      .from(COMPROVANTES_BUCKET)
      .createSignedUrl(r.comprovante_url, 60);
    if (data) window.open(data.signedUrl, "_blank");
  }

  async function excluir() {
    if (!excluindo) return;
    await supabase.from("recebimentos").delete().eq("id", excluindo.id);
    setExcluindo(null);
    carregar();
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="display text-2xl text-ink-900">Recebimentos</h1>
          <p className="text-sm text-ink-500">Valores que os clientes devem ao escritório</p>
        </div>
        <button
          className="btn-primary"
          onClick={() => {
            setEditando(null);
            setModalAberto(true);
          }}
        >
          <Plus size={16} /> Novo recebimento
        </button>
      </div>

      {/* Resumo */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatTile
          rotulo="A receber"
          valor={formatBRL(resumo.aReceber)}
          detalhe={`${resumo.aReceberQtd} em aberto`}
          icone={<HandCoins size={18} />}
        />
        <StatTile
          rotulo="Vencidos"
          valor={formatBRL(resumo.vencido)}
          detalhe={`${resumo.vencidoQtd} cliente(s) em atraso`}
          tom={resumo.vencido > 0 ? "alerta" : "ok"}
          icone={<AlertTriangle size={18} />}
        />
        <StatTile
          rotulo="Já recebido"
          valor={formatBRL(resumo.recebido)}
          tom="ok"
          icone={<CircleDollarSign size={18} />}
        />
      </div>

      {/* Filtros */}
      <div className="card flex flex-wrap items-center gap-2 p-3">
        <div className="relative min-w-[180px] flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
          <input
            className="field pl-9"
            placeholder="Buscar cliente…"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />
        </div>
        <select className="field w-auto" value={filtro} onChange={(e) => setFiltro(e.target.value as any)}>
          <option value="todos">Todos</option>
          <option value="pendente">Em aberto</option>
          <option value="vencido">Vencidos</option>
          <option value="recebido">Recebidos</option>
        </select>
      </div>

      {/* Tabela */}
      <div className="card overflow-hidden">
        {loading ? (
          <p className="py-16 text-center text-ink-400">Carregando…</p>
        ) : erro ? (
          <p className="py-16 text-center text-sm text-status-alert">
            Não foi possível carregar: {erro}
          </p>
        ) : filtrados.length === 0 ? (
          <p className="py-16 text-center text-ink-400">Nenhum recebimento com esses filtros.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-ink-400">
                  <th className="px-4 py-3 font-medium">Cliente</th>
                  <th className="px-4 py-3 font-medium">Previsão do cliente</th>
                  <th className="px-4 py-3 font-medium">Vencimento</th>
                  <th className="px-4 py-3 text-center font-medium">Comprovante</th>
                  <th className="px-4 py-3 text-center font-medium">Status</th>
                  <th className="px-4 py-3 text-right font-medium">Valor</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {filtrados.map((r) => {
                  const atrasado = vencido(r);
                  return (
                    <tr key={r.id} className="hover:bg-paper/60">
                      <td className="px-4 py-3">
                        <div className="font-medium text-ink-900">{r.cliente}</div>
                        {r.observacao && <div className="text-xs text-ink-400">{r.observacao}</div>}
                      </td>
                      <td className="px-4 py-3 text-ink-500 tnum">{formatData(r.data_prevista_cliente)}</td>
                      <td className="px-4 py-3 tnum">
                        <span className={atrasado ? "font-semibold text-status-alert" : "text-ink-700"}>
                          {formatData(r.data_vencimento)}
                        </span>
                        {atrasado && (
                          <span className="ml-1 text-xs font-semibold text-status-alert">(vencido)</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {r.comprovante_url ? (
                          <button
                            onClick={() => verComprovante(r)}
                            className="text-brand-700 hover:text-brand-800"
                            title="Ver comprovante"
                          >
                            <FileText size={16} />
                          </button>
                        ) : (
                          <span className="text-ink-400/60">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {r.status === "recebido" ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-status-ok/10 px-2.5 py-0.5 text-xs font-semibold text-status-ok">
                            <Check size={12} /> Recebido
                          </span>
                        ) : (
                          <span
                            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                              atrasado ? "bg-status-alert/10 text-status-alert" : "bg-status-warn/15 text-[#8a5d00]"
                            }`}
                          >
                            {atrasado ? "Em atraso" : "Em aberto"}
                          </span>
                        )}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-right font-semibold text-ink-900 tnum">
                        {r.moeda === "USD" ? formatUSD(r.valor) : formatBRL(r.valor)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-1">
                          {r.status === "pendente" ? (
                            <button
                              onClick={() => marcarRecebido(r, true)}
                              className="rounded border border-brand-700/30 px-2 py-1 text-xs font-semibold text-brand-700 hover:bg-brand-100"
                              title="Marcar como recebido"
                            >
                              Receber
                            </button>
                          ) : (
                            <button
                              onClick={() => marcarRecebido(r, false)}
                              className="rounded px-2 py-1 text-xs text-ink-400 hover:bg-paper hover:text-ink-700"
                              title="Reabrir"
                            >
                              Reabrir
                            </button>
                          )}
                          <button
                            onClick={() => {
                              setEditando(r);
                              setModalAberto(true);
                            }}
                            className="rounded p-1.5 text-ink-400 hover:bg-paper hover:text-ink-700"
                            title="Editar"
                          >
                            <Pencil size={15} />
                          </button>
                          <button
                            onClick={() => setExcluindo(r)}
                            className="rounded p-1.5 text-ink-400 hover:bg-status-alert/10 hover:text-status-alert"
                            title="Excluir"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal
        aberto={modalAberto}
        titulo={editando ? "Editar recebimento" : "Novo recebimento"}
        onFechar={() => setModalAberto(false)}
      >
        <RecebimentoForm
          inicial={editando}
          onSalvo={() => {
            setModalAberto(false);
            carregar();
          }}
          onCancelar={() => setModalAberto(false)}
        />
      </Modal>

      <Modal
        aberto={!!excluindo}
        titulo="Excluir recebimento"
        onFechar={() => setExcluindo(null)}
        largura="max-w-md"
      >
        <p className="text-sm text-ink-700">
          Excluir o recebimento de <b>{excluindo?.cliente}</b>? Essa ação não pode ser desfeita.
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <button className="btn-ghost" onClick={() => setExcluindo(null)}>
            Cancelar
          </button>
          <button className="btn-danger" onClick={excluir}>
            <Trash2 size={16} /> Excluir
          </button>
        </div>
      </Modal>
    </div>
  );
}

function RecebimentoForm({
  inicial,
  onSalvo,
  onCancelar,
}: {
  inicial: Recebimento | null;
  onSalvo: () => void;
  onCancelar: () => void;
}) {
  const [f, setF] = useState<RecebimentoInput>(() => ({
    cliente: inicial?.cliente ?? "",
    valor: inicial?.valor ?? 0,
    moeda: inicial?.moeda ?? "BRL",
    data_prevista_cliente: inicial?.data_prevista_cliente ?? null,
    data_vencimento: inicial?.data_vencimento ?? `${mesAtual()}-01`,
    status: inicial?.status ?? "pendente",
    data_recebimento: inicial?.data_recebimento ?? null,
    comprovante_url: inicial?.comprovante_url ?? null,
    observacao: inicial?.observacao ?? null,
  }));
  const [enviando, setEnviando] = useState(false);
  const [subindo, setSubindo] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  function set<K extends keyof RecebimentoInput>(k: K, v: RecebimentoInput[K]) {
    setF((o) => ({ ...o, [k]: v }));
  }

  async function subirComprovante(file: File) {
    setSubindo(true);
    setErro(null);
    try {
      const ext = file.name.split(".").pop() || "bin";
      const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const { error } = await supabase.storage.from(COMPROVANTES_BUCKET).upload(path, file);
      if (error) throw error;
      setF((o) => ({ ...o, comprovante_url: path }));
    } catch (e) {
      setErro("Falha ao subir o comprovante: " + (e as Error).message);
    } finally {
      setSubindo(false);
    }
  }

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    setEnviando(true);
    try {
      const payload: RecebimentoInput = {
        ...f,
        cliente: f.cliente.trim(),
        data_prevista_cliente: f.data_prevista_cliente || null,
        data_recebimento: f.status === "recebido" ? f.data_recebimento || hojeIso() : null,
        observacao: f.observacao?.trim() || null,
      };
      const res = inicial
        ? await supabase.from("recebimentos").update(payload).eq("id", inicial.id)
        : await supabase.from("recebimentos").insert(payload);
      if (res.error) throw new Error(res.error.message);
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
        <label className="label">Cliente</label>
        <input
          required
          className="field"
          value={f.cliente}
          onChange={(e) => set("cliente", e.target.value)}
          placeholder="Nome do cliente"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
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
          <select className="field" value={f.moeda} onChange={(e) => set("moeda", e.target.value as Moeda)}>
            <option value="BRL">Real (R$)</option>
            <option value="USD">Dólar (US$)</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Previsão do cliente receber <span className="text-ink-400">(opcional)</span></label>
          <input
            type="date"
            className="field"
            value={f.data_prevista_cliente ?? ""}
            onChange={(e) => set("data_prevista_cliente", e.target.value || null)}
          />
        </div>
        <div>
          <label className="label">Vencimento (pagar ao escritório)</label>
          <input
            type="date"
            required
            className="field"
            value={f.data_vencimento}
            onChange={(e) => set("data_vencimento", e.target.value)}
          />
        </div>
      </div>

      <div className="rounded-md border border-line bg-paper/60 p-3">
        <label className="flex items-center gap-2 text-sm text-ink-700">
          <input
            type="checkbox"
            checked={f.status === "recebido"}
            onChange={(e) =>
              setF((o) => ({
                ...o,
                status: e.target.checked ? "recebido" : "pendente",
                data_recebimento: e.target.checked ? o.data_recebimento ?? hojeIso() : null,
              }))
            }
          />
          Já recebido
        </label>
        {f.status === "recebido" && (
          <div className="mt-3">
            <label className="label">Data do recebimento</label>
            <input
              type="date"
              className="field"
              value={f.data_recebimento ?? ""}
              onChange={(e) => set("data_recebimento", e.target.value || null)}
            />
          </div>
        )}
      </div>

      <div>
        <label className="label">Comprovante</label>
        <div className="flex items-center gap-3">
          <label className="btn-ghost cursor-pointer">
            {subindo ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
            {f.comprovante_url ? "Trocar arquivo" : "Anexar arquivo"}
            <input
              type="file"
              className="hidden"
              accept="image/*,application/pdf"
              onChange={(e) => e.target.files?.[0] && subirComprovante(e.target.files[0])}
            />
          </label>
          {f.comprovante_url && (
            <span className="flex items-center gap-1 text-sm text-status-ok">
              <Check size={16} /> Anexado
            </span>
          )}
        </div>
      </div>

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
          {enviando ? "Salvando…" : "Salvar"}
        </button>
      </div>
    </form>
  );
}
