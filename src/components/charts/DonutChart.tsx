import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';
import { useChartTheme } from './useChartTheme';

interface DonutDataPoint {
  name: string;
  value: number;
  color: string;
}

interface DonutChartProps {
  data: DonutDataPoint[];
  height?: number;
  innerRadius?: number;
  outerRadius?: number;
}

export function DonutChart({ data, height = 260, innerRadius = 55, outerRadius = 90 }: DonutChartProps) {
  const total = data.reduce((sum, d) => sum + d.value, 0);
  const c = useChartTheme();

  return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie
          data={data}
          stroke={c.tooltipBg}
          cx="50%"
          cy="50%"
          innerRadius={innerRadius}
          outerRadius={outerRadius}
          paddingAngle={2}
          dataKey="value"
        >
          {data.map((entry, i) => (
            <Cell key={i} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            background: c.tooltipBg,
            color: c.muted,
            border: `1px solid ${c.tooltipBorder}`,
            borderRadius: '10px',
            fontSize: '12px',
          }}
          formatter={(value: number, name: string) => [
            `${value} (${total > 0 ? Math.round((value / total) * 100) : 0}%)`,
            name,
          ]}
        />
        <Legend
          wrapperStyle={{ fontSize: '12px' }}
          formatter={(value) => <span style={{ color: c.muted }}>{value}</span>}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
