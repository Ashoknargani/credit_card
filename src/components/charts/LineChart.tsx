interface LineChartProps {
  data: { label: string; values: number[] }[];
  labels: string[];
  height?: number;
  colors?: string[];
}

export function LineChart({ data, labels, height = 200, colors = ['#1d82f5', '#10b981'] }: LineChartProps) {
  const width = 600;
  const padding = { top: 10, right: 16, bottom: 28, left: 36 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  const allValues = data.flatMap((d) => d.values);
  const max = Math.max(...allValues, 1);
  const min = 0;

  const xStep = chartW / Math.max(labels.length - 1, 1);
  const yScale = (v: number) => chartH - ((v - min) / (max - min)) * chartH;

  const buildPath = (values: number[]) => {
    return values
      .map((v, i) => `${i === 0 ? 'M' : 'L'} ${padding.left + i * xStep} ${padding.top + yScale(v)}`)
      .join(' ');
  };

  const buildArea = (values: number[]) => {
    const path = buildPath(values);
    return `${path} L ${padding.left + (values.length - 1) * xStep} ${padding.top + chartH} L ${padding.left} ${padding.top + chartH} Z`;
  };

  const gridLines = [0, 0.25, 0.5, 0.75, 1].map((f) => min + f * (max - min));

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full" style={{ height }}>
      <defs>
        {data.map((d, i) => (
          <linearGradient key={i} id={`grad-${i}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={colors[i % colors.length]} stopOpacity="0.2" />
            <stop offset="100%" stopColor={colors[i % colors.length]} stopOpacity="0" />
          </linearGradient>
        ))}
      </defs>

      {gridLines.map((v, i) => (
        <g key={i}>
          <line
            x1={padding.left}
            y1={padding.top + yScale(v)}
            x2={width - padding.right}
            y2={padding.top + yScale(v)}
            stroke="#eceef2"
            strokeWidth="1"
          />
          <text x={padding.left - 8} y={padding.top + yScale(v) + 4} textAnchor="end" className="fill-ink-300 text-[10px]">
            {Math.round(v)}
          </text>
        </g>
      ))}

      {labels.map((label, i) => (
        <text
          key={i}
          x={padding.left + i * xStep}
          y={height - 8}
          textAnchor="middle"
          className="fill-ink-400 text-[10px]"
        >
          {label}
        </text>
      ))}

      {data.map((d, i) => (
        <g key={i}>
          <path d={buildArea(d.values)} fill={`url(#grad-${i})`} />
          <path d={buildPath(d.values)} fill="none" stroke={colors[i % colors.length]} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
          {d.values.map((v, j) => (
            <circle
              key={j}
              cx={padding.left + j * xStep}
              cy={padding.top + yScale(v)}
              r="3.5"
              fill="white"
              stroke={colors[i % colors.length]}
              strokeWidth="2"
            />
          ))}
        </g>
      ))}
    </svg>
  );
}
