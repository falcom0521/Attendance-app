import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  type TooltipProps,
} from 'recharts';

interface TrendDataPoint {
  date: string;
  present: number;
  absent: number;
  late: number;
}

interface AttendanceTrendChartProps {
  data: TrendDataPoint[];
  height?: number;
}

function CustomTooltip({ active, payload, label }: TooltipProps<number, string>) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-surface-100 rounded-xl shadow-soft-lg px-4 py-3 min-w-[140px]">
      <p className="text-xs font-semibold text-surface-500 mb-2">{label}</p>
      {payload.map((entry) => (
        <div key={entry.name} className="flex items-center justify-between gap-6 mb-1 last:mb-0">
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full flex-shrink-0" style={{ backgroundColor: entry.color }} />
            <span className="text-xs text-surface-600">{entry.name}</span>
          </div>
          <span className="text-xs font-bold text-surface-900">{entry.value}</span>
        </div>
      ))}
    </div>
  );
}

export function AttendanceTrendChart({ data, height = 280 }: AttendanceTrendChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
        <defs>
          <linearGradient id="gradPresent" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor="#22c55e" stopOpacity={0.18} />
            <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="gradAbsent" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor="#ef4444" stopOpacity={0.12} />
            <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="gradLate" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor="#f59e0b" stopOpacity={0.12} />
            <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 11, fill: '#94a3b8', fontWeight: 500 }}
          axisLine={false}
          tickLine={false}
          dy={6}
        />
        <YAxis
          tick={{ fontSize: 11, fill: '#94a3b8' }}
          axisLine={false}
          tickLine={false}
          width={28}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#e2e8f0', strokeWidth: 1 }} />
        <Legend
          iconType="circle"
          iconSize={8}
          wrapperStyle={{ fontSize: '12px', paddingTop: '18px', color: '#64748b' }}
          formatter={(value) => (
            <span style={{ color: '#64748b', fontWeight: 500 }}>{value}</span>
          )}
        />
        <Area
          type="monotone"
          dataKey="present"
          stroke="#22c55e"
          strokeWidth={2.5}
          fill="url(#gradPresent)"
          dot={false}
          activeDot={{ r: 4, strokeWidth: 2, fill: '#fff', stroke: '#22c55e' }}
          name="Present"
        />
        <Area
          type="monotone"
          dataKey="absent"
          stroke="#ef4444"
          strokeWidth={2.5}
          fill="url(#gradAbsent)"
          dot={false}
          activeDot={{ r: 4, strokeWidth: 2, fill: '#fff', stroke: '#ef4444' }}
          name="Absent"
        />
        <Area
          type="monotone"
          dataKey="late"
          stroke="#f59e0b"
          strokeWidth={2.5}
          fill="url(#gradLate)"
          dot={false}
          activeDot={{ r: 4, strokeWidth: 2, fill: '#fff', stroke: '#f59e0b' }}
          name="Late"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
