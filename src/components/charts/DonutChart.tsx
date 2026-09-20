import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';

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

  return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie
          data={data}
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
            background: '#fff',
            border: '1px solid #e2e8f0',
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
          formatter={(value) => <span style={{ color: '#64748b' }}>{value}</span>}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
