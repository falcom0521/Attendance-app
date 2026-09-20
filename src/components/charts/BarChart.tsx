import {
  ResponsiveContainer,
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';

interface BarDataPoint {
  [key: string]: string | number;
}

interface BarConfig {
  dataKey: string;
  color: string;
  name?: string;
  stackId?: string;
}

interface BarChartProps {
  data: BarDataPoint[];
  bars: BarConfig[];
  xAxisKey: string;
  height?: number;
  stacked?: boolean;
}

export function BarChart({ data, bars, xAxisKey, height = 280 }: BarChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <RechartsBarChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 5 }} barSize={12}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
        <XAxis
          dataKey={xAxisKey}
          tick={{ fontSize: 11, fill: '#94a3b8' }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
        <Tooltip
          contentStyle={{
            background: '#fff',
            border: '1px solid #e2e8f0',
            borderRadius: '10px',
            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.07)',
            fontSize: '12px',
          }}
          cursor={{ fill: '#f8fafc' }}
        />
        <Legend
          wrapperStyle={{ fontSize: '12px', paddingTop: '16px' }}
          formatter={(value) => <span style={{ color: '#64748b' }}>{value}</span>}
        />
        {bars.map((bar) => (
          <Bar
            key={bar.dataKey}
            dataKey={bar.dataKey}
            fill={bar.color}
            name={bar.name ?? bar.dataKey}
            radius={[4, 4, 0, 0]}
            stackId={bar.stackId}
          />
        ))}
      </RechartsBarChart>
    </ResponsiveContainer>
  );
}
