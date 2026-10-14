import { Link } from "react-router-dom";
import {
  Receipt,
  AlertTriangle,
  HandCoins,
  FileWarning,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";
import { useData } from "../context/DataContext";
import { useMonth } from "../context/MonthContext";
import { formatBRL, formatUSD, formatData, nomeMes } from "../lib/format";
import {
  resumoMes,
  gastoPorTipo,
  serieMensal,
  lancamentosDoMes,
} from "../lib/fechamento";
import StatTile from "../components/StatTile";
import BarsByType from "../components/charts/BarsByType";
import TrendLine from "../components/charts/TrendLine";
import { TipoBadge } from "../components/Badge";

export default function Dashboard() {
  const { assinaturas, lancamentos, loading, erro } = useData();
  const { mes } = useMonth();

  if (loading) return <Carregando />;
  if (erro) return <ErroBox msg={erro} />;

  const resumo = resumoMes(assinaturas, lancamentos, mes);
  const porTipo = gastoPorTipo(lancamentos, mes);
  const serie = serieMensal(lancamentos, mes, 6);
  const recentes = lancamentosDoMes(lancamentos, mes).slice(0, 6);

  const barras = [
    { nome: "Assinaturas", valor: porTipo.assinatura },
    { nome: "Reembolsos", valor: porTipo.reembolso },
    { nome: "Compras", valor: porTipo.compra },
  ];

  const emDia = resumo.pendencias === 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="display text-2xl text-ink-900">Painel</h1>
        <p className="text-sm text-ink-500 capitalize">{nomeMes(mes)}</p>
      </div>

      {/* Faixa de status do fechamento (hero) */}
      <Link
        to="/fechamento"
        className={`block rounded-card border p-5 transition hover:shadow-card ${
          emDia
            ? "border-status-ok/30 bg-status-ok/5"
            : "border-status-alert/25 bg-status-alert/5"
        }`}
      >
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {emDia ? (
              <CheckCircle2 className="text-status-ok" size={28} />
            ) : (
              <AlertTriangle className="text-status-alert" size={28} />
            )}
            <div>
              <p className="display text-lg text-ink-900">
                {emDia
                  ? "Mês conferido, sem pendências"
                  : `${resumo.pendencias} ${resumo.pendencias === 1 ? "pendência" : "pendências"} no fechamento`}
              </p>
              <p className="text-sm text-ink-500">
                {resumo.assinaturasFaltando} assinatura(s) a cair · {resumo.reembolsosPendentesQtd}{" "}
                reembolso(s) a pagar · {resumo.semReciboQtd} sem recibo
              </p>
            </div>
          </div>
          <span className="flex items-center gap-1 text-sm font-semibold text-brand-700">
            Abrir fechamento <ArrowRight size={16} />
          </span>
        </div>
      </Link>

      {/* Stat tiles */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatTile
          rotulo="Total no mês"
          valor={formatBRL(resumo.totalBRL)}
          detalhe={resumo.totalUSD > 0 ? `+ ${formatUSD(resumo.totalUSD)} (câmbio à parte)` : undefined}
          icone={<Receipt size={18} />}
        />
        <StatTile
          rotulo="Assinaturas a cair"
          valor={resumo.assinaturasFaltando}
          tom={resumo.assinaturasFaltando > 0 ? "alerta" : "ok"}
          icone={<AlertTriangle size={18} />}
        />
        <StatTile
          rotulo="Reembolsos pendentes"
          valor={formatBRL(resumo.reembolsosPendentesValor)}
          detalhe={`${resumo.reembolsosPendentesQtd} a pagar`}
          tom={resumo.reembolsosPendentesValor > 0 ? "alerta" : "ok"}
          icone={<HandCoins size={18} />}
        />
        <StatTile
          rotulo="Sem recibo"
          valor={resumo.semReciboQtd}
          detalhe={`${resumo.qtdLancamentos} lançamentos no mês`}
          tom={resumo.semReciboQtd > 0 ? "alerta" : "ok"}
          icone={<FileWarning size={18} />}
        />
      </div>

      {/* Gráficos */}
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="card p-5">
          <h2 className="mb-1 text-sm font-semibold text-ink-700">Gasto por tipo</h2>
          <p className="mb-3 text-xs text-ink-400">Valores em reais · {nomeMes(mes)}</p>
          <BarsByType dados={barras} />
        </div>
        <div className="card p-5">
          <h2 className="mb-1 text-sm font-semibold text-ink-700">Evolução mensal</h2>
          <p className="mb-3 text-xs text-ink-400">Total em reais nos últimos 6 meses</p>
          <TrendLine dados={serie} />
        </div>
      </div>

      {/* Recentes */}
      <div className="card">
        <div className="flex items-center justify-between border-b border-line px-5 py-3">
          <h2 className="text-sm font-semibold text-ink-700">Lançamentos do mês</h2>
          <Link to="/lancamentos" className="text-sm text-brand-700 hover:underline">
            Ver todos
          </Link>
        </div>
        {recentes.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-ink-400">
            Nenhum lançamento em {nomeMes(mes)}.
          </p>
        ) : (
          <ul className="divide-y divide-line">
            {recentes.map((l) => (
              <li key={l.id} className="flex items-center gap-3 px-5 py-3">
                <span className="w-20 shrink-0 text-xs text-ink-400 tnum">{formatData(l.data)}</span>
                <span className="min-w-0 flex-1 truncate text-sm text-ink-900">{l.descricao}</span>
                <TipoBadge tipo={l.tipo} />
                <span className="w-28 shrink-0 text-right text-sm font-semibold text-ink-900 tnum">
                  {l.moeda === "USD" ? formatUSD(l.valor) : formatBRL(l.valor)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function Carregando() {
  return <p className="py-20 text-center text-ink-400">Carregando dados…</p>;
}
function ErroBox({ msg }: { msg: string }) {
  return (
    <div className="card border-status-alert/30 bg-status-alert/5 p-5 text-sm text-status-alert">
      Não foi possível carregar os dados: {msg}
    </div>
  );
}
