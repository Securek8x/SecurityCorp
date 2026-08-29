// Body shape for the universal knowledge-article shell
// (components/knowledge-article-shell.tsx). Separate from
// KnowledgeArticleMeta (lib/knowledge-schema.ts) — this is prose content,
// not validated metadata.
//
// Universal sections are all optional: a section with no content simply
// doesn't render (see the shell component). relatedSlugs/nextSlug are
// slugs resolved against the catalog at render time, not embedded titles,
// so a retitled or retired article can't leave stale text behind.
export type UniversalSections = Partial<{
  executiveSummary: string[];
  whatYouWillLearn: string[];
  intendedAudience: string[];
  prerequisites: string[];
  problem: string[];
  threatModel: string[];
  mainContent: string[];
  validationEvidence: string[];
  limitations: string[];
  defensiveRecommendations: string[];
  keyTakeaways: string[];
  references: string[];
  relatedSlugs: string[];
  nextSlug: string;
}>;

// Content-type-specific modules. One reusable shell component switches on
// `kind` rather than nine separate page layouts existing side by side.
export type GuideModule = { kind: "guide"; requirements?: string[]; procedure?: string[]; validation?: string[]; rollback?: string[] };
export type LabModule = {
  kind: "lab";
  authorizationStatement?: string;
  safetyBoundaries?: string[];
  setup?: string[];
  exercise?: string[];
  expectedResults?: string[];
  cleanup?: string[];
};
export type DetectionModule = {
  kind: "detection";
  hypothesis?: string;
  requiredDataSources?: string[];
  detectionLogic?: string[];
  testCases?: string[];
  falsePositiveAnalysis?: string[];
  tuningGuidance?: string[];
  mitreMapping?: string[];
};
export type PlaybookModule = {
  kind: "playbook";
  trigger?: string;
  severity?: string;
  triage?: string[];
  decisionPoints?: string[];
  escalation?: string[];
  containment?: string[];
  recovery?: string[];
};
export type FieldNoteModule = { kind: "field-note"; observation?: string; evidence?: string; lesson?: string; application?: string };
export type DeepDiveModule = { kind: "deep-dive"; architecture?: string[]; trustBoundaries?: string[]; alternatives?: string[]; tradeoffs?: string[] };
export type ChecklistItem = { control: string; verificationMethod: string; requiredEvidence: string; result: string };
export type ChecklistModule = { kind: "checklist"; items?: ChecklistItem[] };
export type CaseStudyModule = {
  kind: "case-study";
  sanitizedContext?: string;
  timeline?: string[];
  findings?: string[];
  response?: string[];
  lessonsLearned?: string[];
};
export type ToolReviewModule = {
  kind: "tool-review";
  useCase?: string;
  evaluationCriteria?: string[];
  results?: string[];
  limitations?: string[];
  securityConsiderations?: string[];
};

export type ContentModule =
  | GuideModule
  | LabModule
  | DetectionModule
  | PlaybookModule
  | FieldNoteModule
  | DeepDiveModule
  | ChecklistModule
  | CaseStudyModule
  | ToolReviewModule;
