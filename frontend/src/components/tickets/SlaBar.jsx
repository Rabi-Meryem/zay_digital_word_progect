import { getSlaInfo } from '../../utils/sla'

const LEVEL_COLORS = {
  ok: 'bg-success',
  warning: 'bg-accent',
  breached: 'bg-danger',
}

function SlaBar({ createdAt, slaDeadline, warningPercentage = 80 }) {
  const { percentage, label, level } = getSlaInfo(createdAt, slaDeadline, warningPercentage)

  return (
    <div>
      <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${LEVEL_COLORS[level]}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <p className={`text-xs mt-1 ${level === 'breached' ? 'text-danger font-medium' : 'text-slate-500'}`}>
        SLA : {label}
      </p>
    </div>
  )
}

export default SlaBar