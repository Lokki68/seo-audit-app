export type IssueType = "error" | "warning" | "info";
export type ImpactLevel = "high" | "medium" | "low";
export type AuditStatus = "pending" | "running" | "done";

export interface Issue {
    type: IssueType;
    category: string;
    title: string;
    description: string;
    recommendation: string;
    impact: ImpactLevel;
    element?: string;
}

export interface SectionScore {
    score: number;
    status: "good" | "warning" | "error";
    label: string;
}

export interface AuditSection {
    name: string;
    score: SectionScore;
    issues: Issue[];
    data: Record<string, unknown>;
}

export interface ReportData {
    url: string;
    date: string;
    globalScore: number;
    sections: {
        technical: AuditSection;
        content: AuditSection;
        performance: AuditSection;
    };
    summary: {
        totalIssues: number;
        criticalIssues: number;
        warnings: number;
    };
}

export interface AuditRecord {
    id: string;
    url: string;
    domain: string;
    globalScore: number;
    status: AuditStatus;
    technicalScore: number;
    contentScore: number;
    performanceScore: number;
    totalIssues: number;
    criticalIssues: number;
    warnings: number;
    reportData: ReportData | null;
    createdAt: string;
}