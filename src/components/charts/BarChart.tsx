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
import { useChartTheme } from './useChartTheme';

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
  const c = useChartTheme();
  return (
    <ResponsiveContainer width="100%" height={height}>
      <RechartsBarChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 5 }} barSize={12}>
        <CartesianGrid strokeDasharray="3 3" stroke={c.grid} vertical={false} />
        <XAxis
          dataKey={xAxisKey}
          tick={{ fontSize: 11, fill: c.axis }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis tick={{ fontSize: 11, fill: c.axis }} axisLine={false} tickLine={false} />
        <Tooltip
          contentStyle={{
            background: c.tooltipBg,
            color: c.muted,
            border: `1px solid ${c.tooltipBorder}`,
            borderRadius: '10px',
            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.07)',
            fontSize: '12px',
          }}
          cursor={{ fill: c.cursorFill }}
        />
        <Legend
          wrapperStyle={{ fontSize: '12px', paddingTop: '16px' }}
          formatter={(value) => <span style={{ color: c.muted }}>{value}</span>}
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
