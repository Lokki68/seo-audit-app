"use client";

import { AuditRecord } from "@/types";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { Trash2, ExternalLink, Clock, AlertCircle } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

interface Props {
    audit: AuditRecord;
    onDelete: (id: string) => void;
}

function ScoreBadge({ score }: { score: number }) {
    const color =
        score >= 80 ? "bg-green-100 text-green-700" :
            score >= 50 ? "bg-amber-100 text-amber-700" :
                "bg-red-100 text-red-700";
    return (
        <span className={`text-2xl font-bold px-3 py-1 rounded-lg ${color}`}>
      {score}
    </span>
    );
}

export function AuditCard({ audit, onDelete }: Props) {
    const [deleting, setDeleting] = useState(false);

    const handleDelete = async (e: React.MouseEvent) => {
        e.preventDefault();
        if (!confirm("Supprimer cet audit ?")) return;
        setDeleting(true);
        await fetch(`/api/audits/${audit.id}`, { method: "DELETE" });
        onDelete(audit.id);
    };

    const isRunning = audit.status === "running";
    const [isError, setIsError] = useState(false);

    return (
        <div className={`
      bg-white rounded-xl border border-slate-200 p-5
      hover:shadow-md transition-all duration-200
      ${deleting ? "opacity-50 pointer-events-none" : ""}
    `}>
            {/* Header */}
            <div className="flex justify-between items-start mb-4">
                <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-800 truncate">{audit.domain}</p>
                    <p className="text-xs text-slate-400 truncate mt-0.5">{audit.url}</p>
                </div>
                <div className="flex items-center gap-2 ml-3">
                    {!isRunning && !isError && (
                        <ScoreBadge score={audit.globalScore} />
                    )}
                    {isRunning && (
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full animate-pulse">
              En cours...
            </span>
                    )}
                    {isError && (
                        <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full flex items-center gap-1">
              <AlertCircle size={12} /> Erreur
            </span>
                    )}
                </div>
            </div>

            {/* Scores section */}
            {audit.status === "done" && (
                <div className="grid grid-cols-3 gap-2 mb-4">
                    {[
                        { label: "Technique", score: audit.technicalScore },
                        { label: "Contenu", score: audit.contentScore },
                        { label: "Perf.", score: audit.performanceScore },
                    ].map(({ label, score }) => (
                        <div key={label} className="text-center bg-slate-50 rounded-lg p-2">
                            <div className={`text-lg font-bold ${
                                score >= 80 ? "text-green-600" :
                                    score >= 50 ? "text-amber-600" : "text-red-600"
                            }`}>{score}</div>
                            <div className="text-xs text-slate-500">{label}</div>
                        </div>
                    ))}
                </div>
            )}

            {/* Issues summary */}
            {audit.status === "done" && (
                <div className="flex gap-3 mb-4 text-xs">
          <span className="text-red-600 font-medium">
            ❌ {audit.criticalIssues} erreurs
          </span>
                    <span className="text-amber-600 font-medium">
            ⚠️ {audit.warnings} warnings
          </span>
                </div>
            )}

            {/* Footer */}
            <div className="flex justify-between items-center pt-3 border-t border-slate-100">
        <span className="text-xs text-slate-400 flex items-center gap-1">
          <Clock size={12} />
            {formatDistanceToNow(new Date(audit.createdAt), {
                addSuffix: true,
                locale: fr,
            })}
        </span>
                <div className="flex gap-2">
                    <button
                        onClick={handleDelete}
                        className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    >
                        <Trash2 size={15} />
                    </button>
                    {audit.status === "done" && (
                        <Link
                            href={`/audits/${audit.id}`}
                            className="flex items-center gap-1 text-xs bg-slate-900 text-white px-3 py-1.5 rounded-lg hover:bg-slate-700 transition-colors"
                        >
                            Voir <ExternalLink size={12} />
                        </Link>
                    )}
                </div>
            </div>
        </div>
    );
}
