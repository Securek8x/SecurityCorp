# Contributing / editing content

This is a one-author publication, but the rules below exist so future-you
(or an editor, or a very helpful AI assistant) doesn't quietly turn it into
generic security-blog filler. Read the voice section before you write
anything.

## Voice

SecurityCorp sounds like an engineer explaining something to a peer, not a
vendor explaining something to a prospect. In practice:

- **Show the failure, not just the fix.** A guide that only shows the happy
  path hasn't proven anything. Every article should include what breaks and
  how you know.
- **No hacker aesthetic.** No "in this article, hackers won't want you to
  read," no skull emoji, no green-on-black terminal cosplay. The reader is
  smart; treat them like it.
- **No manufactured urgency.** Don't imply the reader is at risk to get them
  to keep reading. If a control matters, say why in one sentence and move
  on.
- **Precision over hype.** "Validated" and "operational" are status values,
  not adjectives — only use them when something was actually tested.
- **Contractions and short sentences are fine.** This isn't a whitepaper.
  Dry humor is fine. Padding is not.

If a sentence could appear on any generic cybersecurity listicle with the
nouns swapped out, cut it.

## Adding a guide

Guides live in the `articles` array in [`lib/content.ts`](./lib/content.ts).
Each entry needs:

```ts
{
  slug: "kebab-case-url-slug",
  title: "What the reader is actually going to learn",
  dek: "One sentence: the problem and the shape of the solution.",
  category: "e.g. Detection Engineering",
  level: "Foundational | Intermediate | Advanced",
  read: "X min",
  date: "Mon DD, YYYY",
  number: "04", // next sequential number
  intro: "2-3 sentences setting up the trust boundary or problem.",
  sections: [
    {
      heading: "...",
      paragraphs: ["...", "..."],
      code: "optional — only include runnable, generalized commands"
    }
  ]
}
```

Every guide should have a section that tests a failure path, not just the
working configuration. If you can't describe how you verified something,
don't claim it works.

Routes are generated automatically from this array via
`generateStaticParams()` — no other file needs to change to publish a new
guide.

## Publishing a knowledge-base article

Follow [`docs/knowledge-base.md`](./docs/knowledge-base.md) and the mandatory
gates in the [publication-safety policy](./docs/publication-safety-policy.md).
Ravi Teja Thota's standing authorization applies only after recorded passing
editorial, technical, security/privacy, visual, QA, and deployment evidence;
`drafting` metadata and pending reviews are stages to complete, not reasons to
abandon a requested article. Publish only through the focused Gitea branch →
GitHub PR → checked `main` → Cloudflare Production workflow, then verify the
live article and its catalog, route, sitemap, RSS, and metadata surfaces.

## Adding a project

Same file, `projects` array. `status` should be one of `Validated`,
`Operational`, or `Design` — matching reality, not aspiration. Don't mark
something `Validated` because it ran once.

## Before you open a PR

Never push article changes directly to `main`.

1. Read the diff against the privacy list in
   [`SECURITY.md`](./SECURITY.md). Grep for IPs, hostnames, and paths
   before you commit, not after.
2. Run `npm run check` locally (lint, typecheck, and the static build).
3. Check the built page in `out/`, not just `npm run dev` — static export
   can surface issues the dev server won't.
4. If a section title, stat, or "we tested this against N attempts" style
   claim isn't backed by something you actually did, cut it or rewrite it
   as a generalization.
5. Confirm the complete publication surface has `approved-public` status under
   the publication-safety policy, including diagrams, screenshots, metadata,
   feeds, and social previews.
