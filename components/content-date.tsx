import { formatDisplayDate, type IsoDate } from "@/lib/content-dates";

/** A canonical content date, machine-readable (`dateTime`) and displayed in
 * the site's deterministic UTC format. See docs/content-metadata-display.md. */
export function ContentDate({ value }: { value: IsoDate }) {
  return <time dateTime={value}>{formatDisplayDate(value)}</time>;
}
