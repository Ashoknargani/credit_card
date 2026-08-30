import { useMemo } from 'react';

interface DonutChartProps {
  segments: { label: string; value: number; color: string }[];
  centerLabel?: string;
  centerValue?: string;
  size?: number;
}

export function DonutChart({ segments, centerLabel, centerValue, size = 160 }: DonutChartProps) {
  const total = segments.reduce((sum, s) => sum + s.value, 0);
  const radius = size / 2 - 12;
  const innerRadius = radius * 0.62;
  const circumference = 2 * Math.PI * radius;

  const arcs = useMemo(() => {
    let offset = 0;
    return segments.map((seg) => {
      const fraction = total > 0 ? seg.value / total : 0;
      const dash = fraction * circumference;
      const arc = { ...seg, dash, offset, fraction };
      offset += dash;
      return arc;
    });
  }, [segments, circumference, total]);

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#eceef2" strokeWidth={size - innerRadius * 2 - 12} />
          {arcs.map((arc, i) => (
            <circle
              key={i}
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke={arc.color}
              strokeWidth={size - innerRadius * 2 - 12}
              strokeDasharray={`${arc.dash} ${circumference - arc.dash}`}
              strokeDashoffset={-arc.offset}
              strokeLinecap="butt"
              className="transition-all duration-500"
            />
          ))}
        </svg>
        {(centerValue || centerLabel) && (
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            {centerValue && <span className="font-display text-2xl font-bold text-ink-900">{centerValue}</span>}
            {centerLabel && <span className="text-xs text-ink-400">{centerLabel}</span>}
          </div>
        )}
      </div>
      <div className="flex flex-wrap justify-center gap-x-4 gap-y-1.5">
        {segments.map((seg, i) => (
          <div key={i} className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: seg.color }} />
            <span className="text-xs text-ink-600">{seg.label}</span>
            <span className="text-xs font-medium text-ink-900">{seg.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
