import {
  Bar,
  BarChart,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatBRL } from "../../lib/format";

const CORES: Record<string, string> = {
  Assinaturas: "#8A4A4D", // marsala
  Reembolsos: "#B08A3C", // dourado
  Compras: "#7D756C", // cinza
};

export default function BarsByType({
  dados,
}: {
  dados: { nome: string; valor: number }[];
}) {
  const vazio = dados.every((d) => d.valor === 0);
  if (vazio)
    return <p className="py-10 text-center text-sm text-ink-400">Sem lançamentos neste mês.</p>;

  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={dados} layout="vertical" margin={{ left: 8, right: 56, top: 4, bottom: 4 }}>
        <XAxis type="number" hide />
        <YAxis
          type="category"
          dataKey="nome"
          axisLine={false}
          tickLine={false}
          width={92}
          tick={{ fill: "#6E6763", fontSize: 13 }}
        />
        <Tooltip
          cursor={{ fill: "rgba(19,33,27,0.04)" }}
          formatter={(v: number) => [formatBRL(v), "Total"]}
          contentStyle={{
            border: "1px solid #E7E2DB",
            borderRadius: 8,
            fontSize: 13,
            boxShadow: "0 8px 30px rgba(42,36,34,0.12)",
          }}
        />
        <Bar dataKey="valor" radius={[0, 4, 4, 0]} barSize={22} label={renderLabel}>
          {dados.map((d) => (
            <Cell key={d.nome} fill={CORES[d.nome] ?? "#8A4A4D"} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

function renderLabel(props: any) {
  const { x, y, width, height, value } = props;
  if (!value) return <g />;
  return (
    <text
      x={x + width + 8}
      y={y + height / 2}
      dominantBaseline="central"
      fontSize={12}
      fill="#6E6763"
      className="tnum"
    >
      {formatBRL(value)}
    </text>
  );
}
