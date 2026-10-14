import {
  CheckCircle2,
  AlertTriangle,
  Circle,
  HandCoins,
  FileText,
  Check,
} from "lucide-react";
import { useData } from "../context/DataContext";
import { useMonth } from "../context/MonthContext";
import { formatBRL, formatUSD, formatData, nomeMes } from "../lib/format";
import {
  conferirAssinaturas,
  agruparReembolsos,
  conferirRecibos,
  resumoMes,
} from "../lib/fechamento";
import { supabase, RECIBOS_BUCKET } from "../lib/supabase";
import type { Lancamento } from "../lib/types";

export default function Fechamento() {
  const { assinaturas, lancamentos, loading, marcarReembolsado } = useData();
  const { mes } = useMonth();

  if (loading) return <p className="py-20 text-center text-ink-400">Carregando…</p>;

  const resumo = resumoMes(assinaturas, lancamentos, mes);
  const linhas = conferirAssinaturas(assinaturas, lancamentos, mes);
  const grupos = agruparReembolsos(lancamentos, mes);
  const recibos = conferirRecibos(lancamentos, mes);
  const emDia = resumo.pendencias === 0;

  const totalEsperado = linhas
    .filter((l) => l.assinatura.moeda === "BRL")
    .reduce((s, l) => s + l.assinatura.valor_esperado, 0);
  const totalCobrado = linhas
    .filter((l) => l.assinatura.moeda === "BRL" && l.caiu)
    .reduce((s, l) => s + (l.valorCobrado ?? 0), 0);

  async function verRecibo(l: Lancamento) {
    if (!l.recibo_url) return;
    const { data } = await supabase.storage.from(RECIBOS_BUCKET).createSignedUrl(l.recibo_url, 60);
    if (data) window.open(data.signedUrl, "_blank");
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="display text-2xl text-ink-900">Fechamento mensal</h1>
        <p className="text-sm text-ink-500 capitalize">{nomeMes(mes)}</p>
      </div>

      {/* Status geral */}
      <div
        className={`flex items-center gap-3 rounded-card border p-5 ${
          emDia ? "border-status-ok/30 bg-status-ok/5" : "border-status-alert/25 bg-status-alert/5"
        }`}
      >
        {emDia ? (
          <CheckCircle2 className="text-status-ok" size={28} />
        ) : (
          <AlertTriangle className="text-status-alert" size={28} />
        )}
        <div>
          <p className="display text-lg text-ink-900">
            {emDia ? "Mês fechado — tudo conferido" : `${resumo.pendencias} pendência(s) para fechar`}
          </p>
          <p className="text-sm text-ink-500">
            {resumo.assinaturasFaltando} assinatura(s) a cair · {resumo.reembolsosPendentesQtd}{" "}
            reembolso(s) a pagar · {resumo.semReciboQtd} sem recibo
          </p>
        </div>
      </div>

      {/* Bloco A — Assinaturas esperadas × cobradas */}
      <section className="card">
        <div className="flex items-center justify-between border-b border-line px-5 py-3">
          <h2 className="font-semibold text-ink-900">Assinaturas: esperado × cobrado</h2>
          <span className="text-sm text-ink-500 tnum">
            {formatBRL(totalCobrado)} <span className="text-ink-400">/ {formatBRL(totalEsperado)}</span>
          </span>
        </div>
        <ul className="divide-y divide-line">
          {linhas.map((l) => (
            <li key={l.assinatura.id} className="flex items-center gap-3 px-5 py-3">
              {l.caiu ? (
                <CheckCircle2 size={18} className="shrink-0 text-status-ok" />
              ) : (
                <Circle size={18} className="shrink-0 text-status-alert" />
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-ink-900">{l.assinatura.nome}</p>
                <p className="text-xs text-ink-400">
                  {l.assinatura.categoria} · {l.assinatura.ciclo}
                </p>
              </div>
              <div className="text-right">
                {l.caiu ? (
                  <>
                    <p className="text-sm font-semibold text-ink-900 tnum">
                      {l.assinatura.moeda === "USD"
                        ? formatUSD(l.valorCobrado ?? 0)
                        : formatBRL(l.valorCobrado ?? 0)}
                    </p>
                    {l.divergente ? (
                      <p className="text-xs text-[#8a5d00]">
                        esperado{" "}
                        {l.assinatura.moeda === "USD"
                          ? formatUSD(l.assinatura.valor_esperado)
                          : formatBRL(l.assinatura.valor_esperado)}
                      </p>
                    ) : (
                      <p className="text-xs text-status-ok">conferido</p>
                    )}
                  </>
                ) : (
                  <p className="text-sm font-semibold text-status-alert">Faltou</p>
                )}
              </div>
            </li>
          ))}
          {linhas.length === 0 && (
            <li className="px-5 py-8 text-center text-sm text-ink-400">
              Nenhuma assinatura ativa cadastrada.
            </li>
          )}
        </ul>
      </section>

      {/* Bloco B — Reembolsos devido × pago */}
      <section className="card">
        <div className="flex items-center justify-between border-b border-line px-5 py-3">
          <h2 className="flex items-center gap-2 font-semibold text-ink-900">
            <HandCoins size={18} className="text-data-reembolso" /> Reembolsos: devido × pago
          </h2>
          {resumo.reembolsosPendentesValor > 0 && (
            <span className="text-sm font-semibold text-status-alert tnum">
              {formatBRL(resumo.reembolsosPendentesValor)} pendente
            </span>
          )}
        </div>
        {grupos.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-ink-400">
            Nenhum reembolso em {nomeMes(mes)}.
          </p>
        ) : (
          <div className="divide-y divide-line">
            {grupos.map((g) => (
              <div key={g.beneficiario} className="px-5 py-3">
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-sm font-semibold text-ink-900">{g.beneficiario}</p>
                  <p className="text-xs text-ink-500 tnum">
                    {formatBRL(g.totalPago)} pago
                    {g.totalPendente > 0.001 && (
                      <span className="text-status-alert"> · {formatBRL(g.totalPendente)} a pagar</span>
                    )}
                  </p>
                </div>
                <ul className="space-y-1.5">
                  {g.itens.map((i) => (
                    <li key={i.id} className="flex items-center gap-3 text-sm">
                      <span className="w-16 shrink-0 text-xs text-ink-400 tnum">{formatData(i.data)}</span>
                      <span className="min-w-0 flex-1 truncate text-ink-700">{i.descricao}</span>
                      <span className="shrink-0 font-medium text-ink-900 tnum">{formatBRL(i.valor)}</span>
                      {i.reembolsado ? (
                        <span className="flex w-28 shrink-0 items-center justify-end gap-1 text-xs text-status-ok">
                          <Check size={14} /> reembolsado
                        </span>
                      ) : (
                        <button
                          onClick={() => marcarReembolsado(i.id, true)}
                          className="w-28 shrink-0 rounded border border-brand-700/30 px-2 py-1 text-xs font-semibold text-brand-700 hover:bg-brand-100"
                        >
                          Marcar pago
                        </button>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Bloco C — Conferência de recibos */}
      <section className="card">
        <div className="flex items-center justify-between border-b border-line px-5 py-3">
          <h2 className="flex items-center gap-2 font-semibold text-ink-900">
            <FileText size={18} className="text-ink-500" /> Conferência de recibos
          </h2>
          <span className="text-sm font-semibold text-ink-700 tnum">{recibos.pct}% com recibo</span>
        </div>
        <div className="px-5 py-4">
          <div className="mb-4 h-2 w-full overflow-hidden rounded-full bg-line">
            <div
              className="h-full rounded-full bg-status-ok transition-all"
              style={{ width: `${recibos.pct}%` }}
            />
          </div>
          {recibos.semRecibo.length === 0 ? (
            <p className="py-4 text-center text-sm text-status-ok">
              Todos os {recibos.total} lançamentos do mês têm recibo.
            </p>
          ) : (
            <>
              <p className="mb-2 text-sm text-ink-500">
                {recibos.semRecibo.length} lançamento(s) sem recibo:
              </p>
              <ul className="divide-y divide-line">
                {recibos.semRecibo.map((l) => (
                  <li key={l.id} className="flex items-center gap-3 py-2 text-sm">
                    <span className="w-16 shrink-0 text-xs text-ink-400 tnum">{formatData(l.data)}</span>
                    <span className="min-w-0 flex-1 truncate text-ink-700">{l.descricao}</span>
                    <span className="shrink-0 font-medium text-ink-900 tnum">
                      {l.moeda === "USD" ? formatUSD(l.valor) : formatBRL(l.valor)}
                    </span>
                    {l.recibo_url && (
                      <button onClick={() => verRecibo(l)} className="text-brand-700" title="Ver arquivo">
                        <FileText size={15} />
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      </section>
    </div>
  );
}
