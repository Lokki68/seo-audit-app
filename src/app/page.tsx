"use client";

import { useEffect, useState } from "react";
import { AuditForm } from "@/components/AuditForm";
import { AuditCard } from "@/components/AuditCard";
import { AuditRecord } from "@/types";
import { BarChart3, Globe, AlertTriangle } from "lucide-react";

export default function Dashboard() {
    const [audits, setAudits] = useState<AuditRecord[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchAudits();
    }, []);

    // Polling pour les audits en cours
    useEffect(() => {
        const hasRunning = audits.some((a) => a.status === "running");
        if (!hasRunning) return;

        const interval = setInterval(fetchAudits, 5000);
        return () => clearInterval(interval);
    }, [audits]);

    async function fetchAudits() {
        try {
            const res = await fetch("/api/audits");
            const data = await res.json();
            setAudits(data);
        } finally {
            setLoading(false);
        }
    }

    function handleAuditCreated(audit: AuditRecord) {
        setAudits((prev) => [audit, ...prev]);
    }

    function handleDelete(id: string) {
        setAudits((prev) => prev.filter((a) => a.id !== id));
    }

    const doneAudits = audits.filter((a) => a.status === "done");
    const avgScore = doneAudits.length
        ? Math.round(doneAudits.reduce((acc, a) => acc + a.globalScore, 0) / doneAudits.length)
        : 0;
    const totalErrors = doneAudits.reduce((acc, a) => acc + a.criticalIssues, 0);

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Header */}
            <header className="bg-slate-900 text-white">
                <div className="max-w-6xl mx-auto px-6 py-8">
                    <h1 className="text-3xl font-bold mb-1">🔍 SEO Audit</h1>
                    <p className="text-slate-400">Analysez et suivez vos audits SEO</p>

                    {/* Stats */}
                    {doneAudits.length > 0 && (
                        <div className="flex gap-8 mt-6">
                            <div className="flex items-center gap-2">
                                <Globe size={18} className="text-slate-400" />
                                <span className="text-slate-300">
                  <strong className="text-white">{doneAudits.length}</strong> audit(s)
                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                <BarChart3 size={18} className="text-slate-400" />
                                <span className="text-slate-300">
                  Score moyen : <strong className={
                                    avgScore >= 80 ? "text-green-400" :
                                        avgScore >= 50 ? "text-amber-400" : "text-red-400"
                                }>{avgScore}/100</strong>
                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                <AlertTriangle size={18} className="text-slate-400" />
                                <span className="text-slate-300">
                  <strong className="text-red-400">{totalErrors}</strong> erreur(s) totale(s)
                </span>
                            </div>
                        </div>
                    )}
                </div>
            </header>

            <main className="max-w-6xl mx-auto px-6 py-10">
                {/* Form */}
                <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-8 shadow-sm">
                    <h2 className="font-semibold text-slate-700 mb-4">
                        Nouvel audit
                    </h2>
                    <AuditForm onAuditCreated={handleAuditCreated} />
                </div>

                {/* Liste */}
                <div>
                    <h2 className="font-semibold text-slate-700 mb-4">
                        Historique ({audits.length})
                    </h2>

                    {loading ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {[...Array(3)].map((_, i) => (
                                <div key={i} className="bg-white rounded-xl h-48 animate-pulse border border-slate-100" />
                            ))}
                        </div>
                    ) : audits.length === 0 ? (
                        <div className="text-center py-20 text-slate-400">
                            <p className="text-5xl mb-4">🔍</p>
                            <p className="font-medium">Aucun audit pour le moment</p>
                            <p className="text-sm mt-1">Lancez votre premier audit ci-dessus</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {audits.map((audit) => (
                                <AuditCard
                                    key={audit.id}
                                    audit={audit}
                                    onDelete={handleDelete}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
