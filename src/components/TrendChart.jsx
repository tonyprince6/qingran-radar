const WIDTH = 720
const HEIGHT = 226
const PAD_X = 38
const PAD_Y = 18

function pointsFor(values) {
  const max = Math.max(...values, 1)
  return values.map((value, index) => {
    const x = PAD_X + index * ((WIDTH - PAD_X * 2) / (values.length - 1))
    const y = HEIGHT - PAD_Y - (value / max) * (HEIGHT - PAD_Y * 2)
    return [x, y]
  })
}

export default function TrendChart({ topic }) {
  const points = pointsFor(topic.chart)
  const max = Math.max(...topic.chart, 1)
  const ticks = max <= 4
    ? Array.from({ length: max }, (_, index) => index + 1)
    : [0.25, 0.5, 0.75, 1].map(ratio => Math.round(max * ratio))
  const pointString = points.map(([x,y]) => `${x},${y}`).join(' ')
  const area = `${PAD_X},${HEIGHT - PAD_Y} ${pointString} ${WIDTH - PAD_X},${HEIGHT - PAD_Y}`
  return (
    <div className="chart-wrap" aria-label={`${topic.name}近24小时热度趋势`}>
      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} role="img">
        <defs>
          <linearGradient id="chartFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={topic.color} stopOpacity="0.14"/>
            <stop offset="1" stopColor={topic.color} stopOpacity="0"/>
          </linearGradient>
        </defs>
        {ticks.map(value => {
          const y = HEIGHT - PAD_Y - (value / max) * (HEIGHT - PAD_Y * 2)
          return <g key={value}><line x1={PAD_X} x2={WIDTH-PAD_X} y1={y} y2={y} className="grid-line"/><text x="2" y={y+4} className="axis-label">{value}</text></g>
        })}
        <polygon points={area} fill="url(#chartFill)" />
        <polyline points={pointString} fill="none" stroke={topic.color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        {points.map(([x,y], i) => <circle key={i} cx={x} cy={y} r={i === points.length-1 ? 5 : 3.2} fill={topic.color} stroke="#fff" strokeWidth="2" />)}
        <line x1={points.at(-1)[0]} x2={points.at(-1)[0]} y1={points.at(-1)[1]} y2={HEIGHT-PAD_Y} stroke={topic.color} strokeDasharray="4 4" opacity=".7" />
        {(topic.xLabels ?? ['23:00','03:00','07:00','11:00','15:00','19:00','23:00']).map((t,i,labels) => <text key={t+i} x={PAD_X + i*((WIDTH-PAD_X*2)/(labels.length-1))} y={HEIGHT-1} textAnchor={i===0?'start':i===labels.length-1?'end':'middle'} className="axis-label">{t}</text>)}
      </svg>
      <span className="chart-value" style={{background: topic.color}}>{max} 条</span>
    </div>
  )
}
