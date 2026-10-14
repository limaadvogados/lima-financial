import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatBRL, mesCurto, nomeMes } from "../../lib/format";

export default function TrendLine({
  dados,
}: {
  dados: { mes: string; total: number }[];
}) {
  const data = dados.map((d) => ({ ...d, rotulo: mesCurto(d.mes) }));
  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={data} margin={{ left: 4, right: 8, top: 8, bottom: 4 }}>
        <defs>
          <linearGradient id="g-total" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#8A4A4D" stopOpacity={0.18} />
            <stop offset="100%" stopColor="#8A4A4D" stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} stroke="#E7E2DB" />
        <XAxis
          dataKey="rotulo"
          axisLine={false}
          tickLine={false}
          tick={{ fill: "#9A938D", fontSize: 12 }}
        />
        <YAxis
          axisLine={false}
          tickLine={false}
          width={64}
          tick={{ fill: "#9A938D", fontSize: 11 }}
          tickFormatter={(v) => (v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v))}
        />
        <Tooltip
          formatter={(v: number) => [formatBRL(v), "Total no mês"]}
          labelFormatter={(_l, p) => (p && p[0] ? nomeMes(p[0].payload.mes) : "")}
          contentStyle={{
            border: "1px solid #E7E2DB",
            borderRadius: 8,
            fontSize: 13,
            boxShadow: "0 8px 30px rgba(42,36,34,0.12)",
          }}
        />
        <Area
          type="monotone"
          dataKey="total"
          stroke="#8A4A4D"
          strokeWidth={2}
          fill="url(#g-total)"
          dot={{ r: 3, fill: "#8A4A4D" }}
          activeDot={{ r: 5 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
