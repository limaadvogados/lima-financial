import { useState } from "react";
import { Plus, Pencil, Trash2, CheckCircle2, AlertCircle } from "lucide-react";
import { useData } from "../context/DataContext";
import { useMonth } from "../context/MonthContext";
import { formatBRL, formatUSD, nomeMes } from "../lib/format";
import { conferirAssinaturas } from "../lib/fechamento";
import type { Assinatura } from "../lib/types";
import Modal from "../components/Modal";
import AssinaturaForm from "../components/AssinaturaForm";

export default function Assinaturas() {
  const { assinaturas, lancamentos, loading, excluirAssinatura } = useData();
  const { mes } = useMonth();
  const [modalAberto, setModalAberto] = useState(false);
  const [editando, setEditando] = useState<Assinatura | null>(null);
  const [excluindo, setExcluindo] = useState<Assinatura | null>(null);

  const linhas = conferirAssinaturas(assinaturas, lancamentos, mes);
  const porId = new Map(linhas.map((l) => [l.assinatura.id, l]));

  const totalMensalBRL = assinaturas
    .filter((a) => a.ativo && a.ciclo === "mensal" && a.moeda === "BRL")
    .reduce((s, a) => s + a.valor_esperado, 0);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="display text-2xl text-ink-900">Assinaturas</h1>
          <p className="text-sm text-ink-500">
            {assinaturas.filter((a) => a.ativo).length} ativas · custo mensal esperado{" "}
            <span className="font-semibold text-ink-700">{formatBRL(totalMensalBRL)}</span>
          </p>
        </div>
        <button
          className="btn-primary"
          onClick={() => {
            setEditando(null);
            setModalAberto(true);
          }}
        >
          <Plus size={16} /> Nova assinatura
        </button>
      </div>

      <div className="card overflow-hidden">
        {loading ? (
          <p className="py-16 text-center text-ink-400">Carregando…</p>
        ) : assinaturas.length === 0 ? (
          <p className="py-16 text-center text-ink-400">Nenhuma assinatura cadastrada ainda.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-ink-400">
                  <th className="px-4 py-3 font-medium">Assinatura</th>
                  <th className="px-4 py-3 font-medium">Categoria</th>
                  <th className="px-4 py-3 font-medium">Ciclo</th>
                  <th className="px-4 py-3 text-right font-medium">Valor esperado</th>
                  <th className="px-4 py-3 text-center font-medium">Em {nomeMes(mes).split(" ")[0]}</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {assinaturas.map((a) => {
                  const linha = porId.get(a.id);
                  return (
                    <tr key={a.id} className="hover:bg-paper/60">
                      <td className="px-4 py-3">
                        <div className="font-medium text-ink-900">{a.nome}</div>
                        {!a.ativo && <span className="text-xs text-ink-400">inativa</span>}
                        {a.dia_vencimento && (
                          <span className="text-xs text-ink-400">vence dia {a.dia_vencimento}</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-ink-500">{a.categoria}</td>
                      <td className="px-4 py-3 capitalize text-ink-500">{a.ciclo}</td>
                      <td className="px-4 py-3 text-right font-semibold text-ink-900 tnum">
                        {a.moeda === "USD" ? formatUSD(a.valor_esperado) : formatBRL(a.valor_esperado)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {!a.ativo ? (
                          <span className="text-xs text-ink-400">—</span>
                        ) : linha?.caiu ? (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-status-ok">
                            <CheckCircle2 size={14} /> Caiu
                            {linha.divergente && (
                              <span className="text-[#8a5d00]" title="Valor diferente do esperado">
                                {" "}(valor divergente)
                              </span>
                            )}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-status-alert">
                            <AlertCircle size={14} /> Faltou
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-1">
                          <button
                            onClick={() => {
                              setEditando(a);
                              setModalAberto(true);
                            }}
                            className="rounded p-1.5 text-ink-400 hover:bg-paper hover:text-ink-700"
                            title="Editar"
                          >
                            <Pencil size={15} />
                          </button>
                          <button
                            onClick={() => setExcluindo(a)}
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
        titulo={editando ? "Editar assinatura" : "Nova assinatura"}
        onFechar={() => setModalAberto(false)}
      >
        <AssinaturaForm
          inicial={editando}
          onSalvo={() => setModalAberto(false)}
          onCancelar={() => setModalAberto(false)}
        />
      </Modal>

      <Modal
        aberto={!!excluindo}
        titulo="Excluir assinatura"
        onFechar={() => setExcluindo(null)}
        largura="max-w-md"
      >
        <p className="text-sm text-ink-700">
          Excluir <b>{excluindo?.nome}</b> do catálogo? Os lançamentos já feitos continuam, mas
          deixam de ser conferidos no fechamento.
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <button className="btn-ghost" onClick={() => setExcluindo(null)}>
            Cancelar
          </button>
          <button
            className="btn-danger"
            onClick={async () => {
              if (excluindo) await excluirAssinatura(excluindo.id);
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
