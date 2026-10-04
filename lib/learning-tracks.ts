// Learning-track data model and validation (Bead securitycorp-source-4zl.73).
//
// A learning track is a curated, static sequence of published knowledge
// articles grouped into ordered stages, with an explicit completion outcome.
// No accounts, cookies, or stored progress: a track is plain data, and
// "where am I in this track" is derived from the current article's slug.
//
// Learning prerequisites (what to read FIRST) are deliberately separate from
// related-content recommendations (what else is nearby): prerequisites and
// next-in-sequence links form directed graphs that must be acyclic, while
// relatedSlugs is an undirected suggestion set with no ordering. See
// lib/route-integrity.ts checkKnowledgeSequenceGraph for the article-level
// half of that graph.
//
// The registry is intentionally empty. A track's title, summary, stage
// checkpoints, and outcomes are public prose, so a track only reaches the
// site through the editorial workflow, and only `status: "published"`
// tracks are ever public (same rule as knowledge articles). Relative
// imports only — this module runs under plain node in scripts/tests.
import { DIFFICULTIES, AUDIENCES, EDITORIAL_STATUSES, PUBLIC_STATUS, type Audience, type Difficulty, type EditorialStatus } from "./knowledge-schema.ts";

export type LearningTrackStage = {
  title: string;
  /** Ordered: a reader works through these in sequence. */
  articleSlugs: string[];
  /** What a reader should be able to do or explain before moving on. */
  checkpoint: string;
};

export type LearningTrack = {
  id: string;
  title: string;
  summary: string;
  audience: Audience[];
  difficulty: Difficulty;
  /** Tracks a reader should complete before this one. Must be acyclic. */
  prerequisiteTrackIds: string[];
  stages: LearningTrackStage[];
  /** Concrete capabilities, never a credential, certification, or job outcome. */
  learningOutcomes: string[];
  status: EditorialStatus;
};

export const learningTracks: LearningTrack[] = [];

export const publishedLearningTracks: LearningTrack[] = learningTracks.filter((t) => t.status === PUBLIC_STATUS);

const ID_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
// The learning-paths page promises "never a promise of a credential or
// outcome" — enforce that wording boundary on the fields that make promises.
// "certified/certification", not "certificate" (a TLS term this site uses);
// "credential" is likewise left out because it is core security vocabulary.
const CREDENTIAL_CLAIM = /\b(certified|certifications?|certify|guarantee[sd]?|job[- ]ready|accredit\w*)\b/i;

/** Returns one cycle in a directed graph as an ordered node list whose
 * first and last entries are the same node, or undefined when acyclic.
 * Edges to nodes absent from the graph are ignored (dangling references
 * are reported separately by the reference checks). */
export function findCycle(graph: Map<string, string[]>): string[] | undefined {
  const state = new Map<string, "visiting" | "done">();
  const stack: string[] = [];
  const visit = (node: string): string[] | undefined => {
    state.set(node, "visiting");
    stack.push(node);
    for (const next of graph.get(node) ?? []) {
      if (!graph.has(next)) continue;
      const s = state.get(next);
      if (s === "visiting") return [...stack.slice(stack.indexOf(next)), next];
      if (s === undefined) {
        const found = visit(next);
        if (found) return found;
      }
    }
    stack.pop();
    state.set(node, "done");
    return undefined;
  };
  for (const node of graph.keys()) {
    if (state.get(node) === undefined) {
      const found = visit(node);
      if (found) return found;
    }
  }
  return undefined;
}

/** Validates the track registry. `knownArticleSlugs` is every registered
 * knowledge article (any status); `publishedArticleSlugs` the public ones.
 * A drafting track may reference drafting articles; a published track may
 * reference only published articles and published prerequisite tracks. */
export function validateLearningTracks(
  tracks: LearningTrack[],
  knownArticleSlugs: Set<string>,
  publishedArticleSlugs: Set<string>,
): string[] {
  const errors: string[] = [];
  const byId = new Map<string, LearningTrack>();
  for (const t of tracks) {
    if (byId.has(t.id)) errors.push(`duplicate learning-track id "${t.id}"`);
    byId.set(t.id, t);
  }

  for (const t of tracks) {
    const where = `learning track "${t.id}"`;
    const published = t.status === PUBLIC_STATUS;
    if (!ID_PATTERN.test(t.id)) errors.push(`${where}: id must be lowercase kebab-case`);
    if (!t.title.trim()) errors.push(`${where}: title is required`);
    if (!t.summary.trim()) errors.push(`${where}: summary is required`);
    if (!EDITORIAL_STATUSES.includes(t.status)) errors.push(`${where}: unknown status "${t.status}"`);
    if (!DIFFICULTIES.includes(t.difficulty)) errors.push(`${where}: unknown difficulty "${t.difficulty}"`);
    if (t.audience.length === 0) errors.push(`${where}: at least one audience is required`);
    for (const a of t.audience) if (!AUDIENCES.includes(a)) errors.push(`${where}: unknown audience "${a}"`);
    if (t.stages.length === 0) errors.push(`${where}: at least one stage is required`);
    if (t.learningOutcomes.length === 0) errors.push(`${where}: at least one learning outcome is required`);

    for (const text of [t.summary, ...t.learningOutcomes]) {
      if (CREDENTIAL_CLAIM.test(text)) errors.push(`${where}: promises a credential or guaranteed outcome ("${text}")`);
    }

    const seen = new Set<string>();
    t.stages.forEach((stage, i) => {
      const stageWhere = `${where} stage ${i + 1}`;
      if (!stage.title.trim()) errors.push(`${stageWhere}: title is required`);
      if (!stage.checkpoint.trim()) errors.push(`${stageWhere}: checkpoint is required`);
      if (stage.articleSlugs.length === 0) errors.push(`${stageWhere}: at least one article is required`);
      for (const slug of stage.articleSlugs) {
        if (seen.has(slug)) errors.push(`${stageWhere}: article "${slug}" appears more than once in the track`);
        seen.add(slug);
        if (!knownArticleSlugs.has(slug)) errors.push(`${stageWhere}: unknown article "${slug}"`);
        else if (published && !publishedArticleSlugs.has(slug)) errors.push(`${stageWhere}: published track references unpublished article "${slug}"`);
      }
    });

    for (const pre of t.prerequisiteTrackIds) {
      const target = byId.get(pre);
      if (pre === t.id) errors.push(`${where}: lists itself as a prerequisite`);
      else if (!target) errors.push(`${where}: unknown prerequisite track "${pre}"`);
      else if (published && target.status !== PUBLIC_STATUS) errors.push(`${where}: published track has unpublished prerequisite track "${pre}"`);
    }
  }

  const cycle = findCycle(new Map(tracks.map((t) => [t.id, t.prerequisiteTrackIds.filter((p) => p !== t.id)])));
  if (cycle) errors.push(`learning-track prerequisites form a cycle: ${cycle.join(" -> ")}`);
  return errors;
}

export type TrackPosition = {
  trackId: string;
  trackTitle: string;
  stageIndex: number;
  stageTitle: string;
  /** 1-based position of the article across the whole track. */
  position: number;
  total: number;
};

/** Every place an article sits across the given tracks — the data a reader-
 * facing "you are here" indicator needs, derived without stored progress. */
export function trackPositionsForArticle(slug: string, tracks: LearningTrack[]): TrackPosition[] {
  const positions: TrackPosition[] = [];
  for (const t of tracks) {
    const ordered = t.stages.flatMap((s, stageIndex) => s.articleSlugs.map((a) => ({ a, stageIndex, stageTitle: s.title })));
    const i = ordered.findIndex((o) => o.a === slug);
    if (i >= 0) {
      positions.push({
        trackId: t.id,
        trackTitle: t.title,
        stageIndex: ordered[i].stageIndex,
        stageTitle: ordered[i].stageTitle,
        position: i + 1,
        total: ordered.length,
      });
    }
  }
  return positions;
}
