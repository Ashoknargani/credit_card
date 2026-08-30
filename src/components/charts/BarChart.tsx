interface BarChartProps {
  data: { label: string; value: number; color?: string }[];
  height?: number;
  maxBars?: number;
}

export function BarChart({ data, height = 180 }: BarChartProps) {
  const max = Math.max(...data.map((d) => d.value), 1);
  const barWidth = 100 / Math.max(data.length, 1);

  return (
    <div className="w-full">
      <div className="flex items-end gap-2" style={{ height }}>
        {data.map((d, i) => {
          const h = (d.value / max) * 100;
          return (
            <div key={i} className="flex flex-1 flex-col items-center gap-1.5" style={{ minWidth: `${barWidth}%` }}>
              <div className="flex w-full flex-1 items-end">
                <div
                  className="w-full rounded-t-md transition-all duration-500"
                  style={{
                    height: `${h}%`,
                    background: d.color ?? '#1d82f5',
                    minHeight: d.value > 0 ? '4px' : '0',
                  }}
                />
              </div>
              <span className="truncate text-[10px] text-ink-400">{d.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
