import { useMemo, useState } from "react";
import { useData } from "../context/DataContext";
import { useMonth } from "../context/MonthContext";
import { formatBRL, formatUSD, nomeMes } from "../lib/format";
import { lancamentosDoMes } from "../lib/fechamento";
import type { Assinatura, Lancamento } from "../lib/types";
import { TipoBadge } from "../components/Badge";

const SEMANA = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

interface DiaInfo {
  dia: number;
  lancs: Lancamento[];
  previstas: Assinatura[]; // assinaturas com vencimento neste dia, ainda não lançadas
}

export default function Calendario() {
  const { assinaturas, lancamentos, loading } = useData();
  const { mes } = useMonth();
  const [ano, mesNum] = mes.split("-").map(Number);

  const hojeIso = new Date().toISOString().slice(0, 10);

  // Monta os dias do mês com seus eventos
  const { celulas, diasComAlgo } = useMemo(() => {
    const primeiroDiaSemana = new Date(ano, mesNum - 1, 1).getDay();
    const totalDias = new Date(ano, mesNum, 0).getDate();
    const doMes = lancamentosDoMes(lancamentos, mes);

    const mapaLanc = new Map<number, Lancamento[]>();
    for (const l of doMes) {
      const d = Number(l.data.slice(8, 10));
      if (!mapaLanc.has(d)) mapaLanc.set(d, []);
      mapaLanc.get(d)!.push(l);
    }

    const ativasMensais = assinaturas.filter(
      (a) => a.ativo && a.ciclo === "mensal" && a.dia_vencimento
    );

    const cel: (DiaInfo | null)[] = [];
    for (let i = 0; i < primeiroDiaSemana; i++) cel.push(null);
    let comAlgo = 0;
    for (let dia = 1; dia <= totalDias; dia++) {
      const lancs = mapaLanc.get(dia) ?? [];
      // assinatura prevista nesse dia que ainda não tem lançamento vinculado no mês
      const previstas = ativasMensais.filter((a) => {
        if (a.dia_vencimento !== dia) return false;
        const jaCaiu = doMes.some((l) => l.assinatura_id === a.id);
        return !jaCaiu;
      });
      if (lancs.length || previstas.length) comAlgo++;
      cel.push({ dia, lancs, previstas });
    }
    return { celulas: cel, diasComAlgo: comAlgo };
  }, [ano, mesNum, mes, lancamentos, assinaturas]);

  const [diaSel, setDiaSel] = useState<number | null>(null);
  const info = celulas.find((c) => c && c.dia === diaSel) as DiaInfo | undefined;

  if (loading) return <p className="py-20 text-center text-ink-400">Carregando…</p>;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="display text-2xl text-ink-900">Calendário</h1>
        <p className="text-sm text-ink-500 capitalize">
          {nomeMes(mes)} · {diasComAlgo} dia(s) com movimentação
        </p>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
        {/* Calendário */}
        <div className="card p-4">
          <div className="mb-2 grid grid-cols-7 gap-1 text-center text-xs font-medium text-ink-400">
            {SEMANA.map((s) => (
              <div key={s} className="py-1">{s}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {celulas.map((c, i) => {
              if (!c) return <div key={`v${i}`} />;
              const iso = `${mes}-${String(c.dia).padStart(2, "0")}`;
              const hoje = iso === hojeIso;
              const temLanc = c.lancs.length > 0;
              const temPrev = c.previstas.length > 0;
              const ativo = temLanc || temPrev;
              const sel = diaSel === c.dia;
              return (
                <button
                  key={c.dia}
                  onClick={() => setDiaSel(sel ? null : c.dia)}
                  className={`relative flex min-h-[64px] flex-col rounded-md border p-1.5 text-left transition
                    ${sel ? "border-brand-600 bg-brand-100/60" : "border-line hover:bg-paper"}
                    ${!ativo ? "opacity-70" : ""}`}
                >
                  <span
                    className={`text-xs font-semibold tnum ${
                      hoje
                        ? "grid h-5 w-5 place-items-center rounded-full bg-brand-700 text-white"
                        : "text-ink-700"
                    }`}
                  >
                    {c.dia}
                  </span>
                  <div className="mt-auto flex flex-wrap gap-1">
                    {temLanc && (
                      <span
                        className="h-1.5 w-1.5 rounded-full bg-brand-700"
                        title={`${c.lancs.length} lançamento(s)`}
                      />
                    )}
                    {temPrev && (
                      <span
                        className="h-1.5 w-1.5 rounded-full border border-gold bg-transparent"
                        title="Cobrança prevista"
                      />
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Legenda */}
          <div className="mt-4 flex flex-wrap gap-4 text-xs text-ink-500">
            <span className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-brand-700" /> Lançamento registrado
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full border border-gold" /> Cobrança prevista (assinatura)
            </span>
          </div>
        </div>

        {/* Detalhe do dia */}
        <div className="card p-4">
          {!info ? (
            <p className="py-8 text-center text-sm text-ink-400">
              Clique num dia para ver o que acontece nele.
            </p>
          ) : (
            <>
              <h2 className="mb-3 font-semibold text-ink-900">
                Dia {info.dia} de {nomeMes(mes).split(" ")[0]}
              </h2>
              {info.previstas.length > 0 && (
                <div className="mb-3">
                  <p className="mb-1 text-xs font-medium uppercase tracking-wide text-ink-400">
                    Cobranças previstas
                  </p>
                  <ul className="space-y-1.5">
                    {info.previstas.map((a) => (
                      <li key={a.id} className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-2 text-ink-700">
                          <span className="h-1.5 w-1.5 rounded-full border border-gold" />
                          {a.nome}
                        </span>
                        <span className="font-medium text-ink-900 tnum">
                          {a.moeda === "USD" ? formatUSD(a.valor_esperado) : formatBRL(a.valor_esperado)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {info.lancs.length > 0 ? (
                <div>
                  <p className="mb-1 text-xs font-medium uppercase tracking-wide text-ink-400">
                    Lançamentos
                  </p>
                  <ul className="space-y-2">
                    {info.lancs.map((l) => (
                      <li key={l.id} className="flex items-start justify-between gap-2 text-sm">
                        <span className="min-w-0">
                          <span className="block truncate text-ink-900">{l.descricao}</span>
                          <TipoBadge tipo={l.tipo} />
                        </span>
                        <span className="shrink-0 font-semibold text-ink-900 tnum">
                          {l.moeda === "USD" ? formatUSD(l.valor) : formatBRL(l.valor)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                info.previstas.length === 0 && (
                  <p className="text-sm text-ink-400">Nada registrado neste dia.</p>
                )
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
