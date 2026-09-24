interface DepartmentRow {
  dept: string;
  present: number;
  total: number;
}

interface DepartmentAttendanceChartProps {
  data: DepartmentRow[];
}

/** One accent hue, shaded by attendance rate — a ranked list reads calmer in a single colour family than a rainbow per row. */
function barColor(pct: number): string {
  const alpha = 0.45 + (Math.max(0, Math.min(100, pct)) / 100) * 0.55;
  return `rgb(var(--c-brand-600) / ${alpha.toFixed(2)})`;
}

export function DepartmentAttendanceChart({ data }: DepartmentAttendanceChartProps) {
  if (!data.length) {
    return (
      <p className="text-sm text-surface-400 text-center py-8">No department data available</p>
    );
  }

  // Sort by attendance rate descending
  const sorted = [...data].sort((a, b) => {
    const ra = a.total > 0 ? a.present / a.total : 0;
    const rb = b.total > 0 ? b.present / b.total : 0;
    return rb - ra;
  });

  return (
    <div className="space-y-3.5">
      {sorted.map((row) => {
        const pct = row.total > 0 ? Math.round((row.present / row.total) * 100) : 0;
        const color = barColor(pct);

        return (
          <div key={row.dept}>
            {/* Label row */}
            <div className="flex items-center justify-between mb-1.5">
              <div className="min-w-0">
                <span className="text-sm font-medium text-surface-800 truncate">{row.dept}</span>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0 ml-3">
                <span className="text-xs text-surface-400">
                  <span className="font-semibold text-surface-600">{row.present}</span>
                  <span className="mx-1 text-surface-300">/</span>
                  {row.total}
                </span>
                <span className="text-xs font-bold tabular-nums w-9 text-right text-surface-700">
                  {pct}%
                </span>
              </div>
            </div>

            {/* Progress bar */}
            <div className="h-2 bg-surface-100 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${pct}%`, backgroundColor: color }}
              />
            </div>

            {/* Absent indicator */}
            {/* {absent > 0 && (
              <p className="text-2xs text-danger-500 mt-1 font-medium">
                {absent} absent
              </p>
            )} */}
          </div>
        );
      })}
    </div>
  );
}
