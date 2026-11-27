// Owner-supplied original photography (redesign, Beads securitycorp-source-wo8.2/.3).
// Every file here was re-encoded with all EXIF/XMP/ICC metadata dropped before
// it was committed (publication-safety policy: no identifying metadata).

export type SitePhoto = { src: string; srcSet?: string; alt: string; width: number; height: number };

/** About page portrait: the owner's original canyon photo, supplied 2026-11-21. */
export const aboutPhoto: SitePhoto = {
  src: "/images/about/canyon-portrait-1200.webp",
  srcSet: "/images/about/canyon-portrait-720.webp 720w, /images/about/canyon-portrait-1200.webp 1200w",
  alt: "Ravi Teja Thota sitting on a sandstone ledge above a deep river canyon, with the river bending around a rock formation behind him.",
  width: 1200,
  height: 1600,
};

/**
 * Homepage introduction photo. The brief calls for the owner's original
 * waterfall photo; it has not been supplied yet (Bead securitycorp-source-wo8.7),
 * so the slot is empty and the introduction renders text-only. Set this to a
 * SitePhoto once the file is added under public/images/home/.
 */
export const homeIntroPhoto: SitePhoto | null = null;
