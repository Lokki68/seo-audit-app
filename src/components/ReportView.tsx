import { ReportData, Issue } from "@/types";
import { ScoreGauge } from "./ScoreGauge";

function ImpactBadge({ impact }: { impact: string }) {
    const styles: Record<string, string> = {
        high: "bg-red-100 text-red-700",
        medium: "bg-amber-100 text-amber-700",
        low: "bg-blue-100 text-blue-700",
    };
    const labels: Record<string, string> = {
        high: "🔴 Fort",
        medium: "🟡 Moyen",
        low: "🔵 Faible",
    };
    return (
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${styles[impact]}`}>
      {labels[impact]}
    </span>
    );
}

function IssueCard({ issue }: { issue: Issue }) {
    const borderColor = issue.type === "error"
        ? "border-red-400" : issue.type === "warning"
            ? "border-amber-400" : "border-blue-400";

    const icon = issue.type === "error" ? "❌" : issue.type === "warning" ? "⚠️" : "ℹ️";

    return (
        <div className={`border-l-4 ${borderColor} bg-white rounded-r-xl p-4 shadow-sm`}>
            <div className="flex justify-between items-start gap-4 mb-2">
                <div>
                    <p className="font-semibold text-slate-800">
                        {icon} {issue.title}
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">{issue.category}</p>
                </div>
                <ImpactBadge impact={issue.impact} />
            </div>
            <p className="text-sm text-slate-600 mb-3">{issue.description}</p>
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <p className="text-xs font-semibold text-green-800 mb-1">💡 Recommandation</p>
                <p className="text-sm text-green-700">{issue.recommendation}</p>
            </div>
            {issue.element && (
                <pre className="mt-3 bg-slate-900 text-slate-300 text-xs rounded-lg p-3 overflow-x-auto">
          {issue.element}
        </pre>
            )}
        </div>
    );
}

function SectionDetail({
                           section,
                       }: {
    section: ReportData["sections"]["technical"];
}) {
    const sorted = [...section.issues].sort((a, b) => {
        const order = { error: 0, warning: 1, info: 2 };
        return order[a.type] - order[b.type];
    });

    return (
        <div className="space-y-3">
            {sorted.length === 0 ? (
                <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-green-700 text-sm">
                    ✅ Aucun problème détecté dans cette section.
                </div>
            ) : (
                sorted.map((issue, i) => <IssueCard key={i} issue={issue} />)
            )}
        </div>
    );
}

export function ReportView({ report }: { report: ReportData }) {
    const sections = [
        { key: "technical", label: "🔧 Technique", emoji: "🔧" },
        { key: "content", label: "📝 Contenu", emoji: "📝" },
        { key: "performance", label: "⚡ Performance", emoji: "⚡" },
    ] as const;

    const cwv = report.sections.performance?.data?.coreWebVitals as Record<string, number> | undefined;

    return (
        <div className="space-y-8">
            {/* Scores overview */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100 flex flex-col items-center">
                    <p className="text-sm text-slate-500 mb-3">Score Global</p>
                    <ScoreGauge score={report.globalScore} size="lg" />
                </div>
                {sections.map(({ key, label }) => (
                    <div key={key} className="bg-white rounded-xl p-6 shadow-sm border border-slate-100 flex flex-col items-center">
                        <p className="text-sm text-slate-500 mb-3">{label}</p>
                        <ScoreGauge score={report.sections[key].score.score} size="md" />
                        <p className="text-xs text-slate-400 mt-2">
                            {report.sections[key].issues.length} point(s)
                        </p>
                    </div>
                ))}
            </div>

            {/* Core Web Vitals */}
            {cwv && (
                <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100">
                    <h3 className="font-bold text-slate-800 mb-4">⚡ Core Web Vitals</h3>
                    <div className="grid grid-cols-3 gap-4">
                        {[
                            { label: "LCP", value: `${(cwv.lcp / 1000).toFixed(2)}s`, good: cwv.lcp < 2500, bad: cwv.lcp > 4000 },
                            { label: "CLS", value: cwv.cls.toString(), good: cwv.cls < 0.1, bad: cwv.cls > 0.25 },
                            { label: "FCP", value: `${(cwv.fcp / 1000).toFixed(2)}s`, good: cwv.fcp < 1800, bad: cwv.fcp > 3000 },
                        ].map(({ label, value, good, bad }) => (
                            <div key={label} className="text-center p-4 bg-slate-50 rounded-xl">
                                <p className={`text-2xl font-bold ${good ? "text-green-600" : bad ? "text-red-600" : "text-amber-600"}`}>
                                    {value}
                                </p>
                                <p className="text-sm text-slate-500 mt-1">{label}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Détail par section */}
            {sections.map(({ key, label }) => (
                <div key={key} className="bg-slate-50 rounded-xl p-6">
                    <h3 className="font-bold text-slate-800 mb-4 text-lg">{label}</h3>
                    <SectionDetail section={report.sections[key]} />
                </div>
            ))}
        </div>
    );
}
