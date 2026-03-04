"use client"

interface Props {
    score: number;
    size?: "sm" | "md" | "lg";
    label?: string
}

const sizes = {
    sm: {circle: 64, stroke: 6, font: 'text-lg'},
    md: {circle: 96, stroke: 8, font: 'text-2xl'},
    lg: {circle: 140, stroke: 10, font: 'text-4xl'},
}

function getColor(score: number) {
    if (score >= 80) return { stroke: "#22c55e", text: 'text-green-500'}
    if (score >= 50) return { stroke: "#F59E0B", text: 'text-amber-500'}
    return { stroke: "#ef4444", text: 'text-red-500'}
}

export function ScoreGauge({score, size = 'md', label}: Props) {
    const {circle, stroke, font} = sizes[size]
    const {stroke: strokeColor, text} = getColor(score)
    const radius = (circle - stroke)  / 2
    const circumference = 2 * Math.PI * radius
    const offset = circumference - (score / 100) * circumference

    return (
        <div className='flex flex-col items-center gap-1' >
            <svg width={circle} height={circle} className='-rotate-90'>
                <circle
                    cx={circle /2} cy={circle /2} r={radius}
                    fill="none" stroke="#E2E8FO" strokeWidth={stroke}
                />
                <circle
                    cx={circle / 2} cy={circle / 2} r={radius}
                    fill="none" stroke={strokeColor} strokeWidth={stroke}
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    strokeLinecap="round"
                    style={{ transition: "stroke-dashoffset 1s ease" }}
                />
            </svg>
            <div
                className={`-mt-${circle /2} absolute font-bold ${font} ${text}`}
                style={{marginTop: -(circle /2 + 12)}}
            >
                {score}
            </div>
            {label && <span className='text-xs text-slate-500 mt-1' >{label}</span>}
        </div>
    )
}