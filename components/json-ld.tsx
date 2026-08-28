// Serializes JSON-LD safely: escaping "<" prevents a "</script>" sequence
// inside any string field (e.g. an article title) from closing the script
// tag early and breaking out into the surrounding HTML.
export function JsonLd({ data }: { data: object }) {
  const json = JSON.stringify(data).replace(/</g, "\\u003c");
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />;
}
