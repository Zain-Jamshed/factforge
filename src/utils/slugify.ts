// slugify.ts
// Converts a topic string to a folder-safe slug.
// lowercase, replace spaces with hyphens, remove all special characters, max 50 characters.

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")           // replace spaces with hyphens
    .replace(/[^\w-]+/g, "")        // remove all special characters except word chars and hyphens
    .replace(/--+/g, "-")           // replace multiple hyphens with single hyphen
    .substring(0, 50)               // max 50 characters
    .replace(/-$/, "")              // remove trailing hyphen if any
}
