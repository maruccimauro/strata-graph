/**
 * SDLC document canon — the first Strata template. Mirrors the "Stage
 * deliverables" tables of the sdlc-starter-kit playbook and the traceability
 * chain (Conversation -> Decision -> Requirement -> Task -> Test).
 *
 * Domain-neutral: it describes lifecycle STRUCTURE, never a business domain.
 * `files` are candidate paths relative to a project's docs/ dir (scanner wiring
 * lives in the server); `*` denotes a glob.
 */
import type { Section } from "../../core/types";

export const SECTIONS: Section[] = [
  { id: "00-client", label: "Client", hue: 265, order: 0 },
  { id: "01-discovery", label: "Discovery", hue: 188, order: 1 },
  { id: "02-requirements", label: "Requirements", hue: 205, order: 2 },
  { id: "03-planning", label: "Planning", hue: 158, order: 3 },
  { id: "04-design", label: "Design", hue: 285, order: 4 },
  { id: "05-development", label: "Development", hue: 95, order: 5 },
  { id: "06-testing", label: "Testing / QA", hue: 45, order: 6 },
  { id: "07-deployment", label: "Deployment", hue: 22, order: 7 },
  { id: "08-operations", label: "Operations", hue: 2, order: 8 },
  { id: "09-project-closure", label: "Closure", hue: 232, order: 9 },
];

export interface CanonDoc {
  id: string;
  section: string;
  label: string;
  files: string[];
}

export const DOCUMENTS: CanonDoc[] = [
  { id: "decision-log", section: "00-client", label: "Decision Log", files: ["00-client/decision-log.md"] },
  { id: "action-items", section: "00-client", label: "Action Items", files: ["00-client/action-items.md"] },

  { id: "problem-statement", section: "01-discovery", label: "Problem Statement", files: ["01-discovery/problem-statement.md", "01-discovery/discovery.md"] },
  { id: "business-case", section: "01-discovery", label: "Business Case", files: ["01-discovery/business-case.md"] },
  { id: "stakeholder-map", section: "01-discovery", label: "Stakeholder Map", files: ["01-discovery/stakeholder-map.md"] },
  { id: "preliminary-scope", section: "01-discovery", label: "Preliminary Scope", files: ["01-discovery/preliminary-scope.md"] },

  { id: "srs", section: "02-requirements", label: "SRS", files: ["02-requirements/srs.md"] },
  { id: "user-stories", section: "02-requirements", label: "User Stories", files: ["02-requirements/user-stories.md"] },
  { id: "use-cases", section: "02-requirements", label: "Use Cases", files: ["02-requirements/use-cases.md"] },
  { id: "business-rules", section: "02-requirements", label: "Business Rules", files: ["02-requirements/business-rules.md"] },
  { id: "processes-bpmn", section: "02-requirements", label: "BPMN", files: ["02-requirements/processes-bpmn.md"] },
  { id: "req-glossary", section: "02-requirements", label: "Glossary", files: ["02-requirements/glossary.md"] },
  { id: "traceability-matrix", section: "02-requirements", label: "Traceability Matrix", files: ["02-requirements/traceability-matrix.md"] },
  { id: "nfr-slo", section: "02-requirements", label: "NFR / SLO Targets", files: ["nfr-slo-targets.md", "02-requirements/nfr-slo-targets.md"] },

  { id: "project-charter", section: "03-planning", label: "Project Charter", files: ["03-planning/project-charter.md"] },
  { id: "project-plan", section: "03-planning", label: "Project Plan", files: ["03-planning/project-plan.md"] },
  { id: "wbs", section: "03-planning", label: "WBS", files: ["03-planning/wbs.md"] },
  { id: "schedule", section: "03-planning", label: "Schedule", files: ["03-planning/schedule.md"] },
  { id: "estimates", section: "03-planning", label: "Estimates", files: ["03-planning/estimates.md"] },
  { id: "budget", section: "03-planning", label: "Budget", files: ["03-planning/budget.md"] },
  { id: "risk-register", section: "03-planning", label: "Risk Register", files: ["03-planning/risk-register.md"] },
  { id: "raci", section: "03-planning", label: "RACI Matrix", files: ["03-planning/raci.md"] },
  { id: "backlog", section: "03-planning", label: "Backlog", files: ["03-planning/backlog.md"] },

  { id: "architecture", section: "04-design", label: "Architecture", files: ["04-design/architecture.md"] },
  { id: "database-erd", section: "04-design", label: "ERD", files: ["04-design/database-erd.md"] },
  { id: "api-contracts", section: "04-design", label: "API Contracts", files: ["04-design/api-contracts.md"] },
  { id: "adr", section: "04-design", label: "ADRs", files: ["04-design/adr/ADR-*.md"] },
  { id: "deployment-dgm", section: "04-design", label: "Deployment Diagram", files: ["04-design/deployment.md"] },
  { id: "wireframes", section: "04-design", label: "Wireframes", files: ["04-design/wireframes/*", "04-design/wireframes.md"] },

  { id: "tech-docs", section: "05-development", label: "Technical Docs", files: ["05-development/technical-docs.md"] },

  { id: "test-plan", section: "06-testing", label: "Test Plan", files: ["06-testing/test-plan.md"] },
  { id: "test-cases", section: "06-testing", label: "Test Cases", files: ["06-testing/test-cases.md"] },
  { id: "test-execution-report", section: "06-testing", label: "Exec. Report", files: ["06-testing/test-execution-report.md"] },
  { id: "regression-report", section: "06-testing", label: "Regression", files: ["06-testing/regression-report.md"] },
  { id: "qa-signoff", section: "06-testing", label: "QA Sign-off", files: ["06-testing/qa-signoff.md"] },
  { id: "uat-signoff", section: "06-testing", label: "UAT Sign-off", files: ["06-testing/uat-signoff.md"] },

  { id: "release-notes", section: "07-deployment", label: "Release Notes", files: ["07-deployment/release-notes.md"] },
  { id: "deployment-report", section: "07-deployment", label: "Deployment Report", files: ["07-deployment/deployment-report.md"] },
  { id: "runbook", section: "07-deployment", label: "Runbook", files: ["07-deployment/runbook.md"] },
  { id: "user-manual", section: "07-deployment", label: "User Manual", files: ["07-deployment/user-manual.md"] },
  { id: "uat-approval", section: "07-deployment", label: "UAT Approval", files: ["07-deployment/uat-approval.md"] },
  { id: "acceptance", section: "07-deployment", label: "Acceptance", files: ["07-deployment/acceptance.md"] },
  { id: "support-plan", section: "07-deployment", label: "Support Plan", files: ["07-deployment/support-plan.md"] },

  { id: "maintenance-log", section: "08-operations", label: "Maintenance Log", files: ["08-operations/maintenance-log.md"] },
  { id: "incidents", section: "08-operations", label: "Incidents", files: ["08-operations/incidents/*.md"] },
  { id: "sla-reports", section: "08-operations", label: "SLA Reports", files: ["08-operations/sla-reports/*", "08-operations/sla-reports.md"] },
  { id: "change-requests", section: "08-operations", label: "Change Requests", files: ["08-operations/change-requests/*.md"] },

  { id: "project-closure-report", section: "09-project-closure", label: "Closure Report", files: ["09-project-closure/project-closure-report.md"] },
  { id: "project-metrics", section: "09-project-closure", label: "Project Metrics", files: ["09-project-closure/project-metrics.md"] },
  { id: "retrospective", section: "09-project-closure", label: "Retrospective", files: ["09-project-closure/retrospective.md"] },
  { id: "known-issues", section: "09-project-closure", label: "Known Issues", files: ["09-project-closure/known-issues.md"] },
  { id: "closure-acceptance", section: "09-project-closure", label: "Closure Record", files: ["09-project-closure/closure-acceptance.md"] },
];

/** [prerequisite, dependent] — "dependent depends on prerequisite". */
export const EDGES: [string, string][] = [
  ["problem-statement", "business-case"],
  ["problem-statement", "preliminary-scope"],
  ["stakeholder-map", "business-case"],
  ["problem-statement", "srs"],
  ["preliminary-scope", "srs"],
  ["decision-log", "srs"],
  ["srs", "user-stories"],
  ["srs", "use-cases"],
  ["srs", "business-rules"],
  ["user-stories", "use-cases"],
  ["srs", "traceability-matrix"],
  ["user-stories", "traceability-matrix"],
  ["srs", "nfr-slo"],
  ["business-case", "project-charter"],
  ["srs", "project-charter"],
  ["user-stories", "backlog"],
  ["backlog", "estimates"],
  ["backlog", "wbs"],
  ["wbs", "schedule"],
  ["estimates", "budget"],
  ["project-charter", "project-plan"],
  ["schedule", "project-plan"],
  ["project-charter", "risk-register"],
  ["project-charter", "raci"],
  ["srs", "architecture"],
  ["nfr-slo", "architecture"],
  ["business-rules", "database-erd"],
  ["srs", "database-erd"],
  ["srs", "api-contracts"],
  ["architecture", "api-contracts"],
  ["architecture", "adr"],
  ["architecture", "deployment-dgm"],
  ["user-stories", "wireframes"],
  ["api-contracts", "tech-docs"],
  ["database-erd", "tech-docs"],
  ["architecture", "tech-docs"],
  ["srs", "test-plan"],
  ["test-plan", "test-cases"],
  ["use-cases", "test-cases"],
  ["test-cases", "test-execution-report"],
  ["test-cases", "regression-report"],
  ["test-execution-report", "qa-signoff"],
  ["qa-signoff", "uat-signoff"],
  ["tech-docs", "release-notes"],
  ["release-notes", "deployment-report"],
  ["architecture", "runbook"],
  ["deployment-report", "runbook"],
  ["tech-docs", "user-manual"],
  ["uat-signoff", "uat-approval"],
  ["uat-approval", "acceptance"],
  ["runbook", "support-plan"],
  ["deployment-report", "maintenance-log"],
  ["runbook", "incidents"],
  ["nfr-slo", "sla-reports"],
  ["acceptance", "change-requests"],
  ["acceptance", "project-closure-report"],
  ["project-metrics", "project-closure-report"],
  ["project-plan", "project-metrics"],
  ["schedule", "project-metrics"],
  ["project-closure-report", "retrospective"],
  ["test-execution-report", "known-issues"],
  ["incidents", "known-issues"],
  ["project-closure-report", "closure-acceptance"],
];
