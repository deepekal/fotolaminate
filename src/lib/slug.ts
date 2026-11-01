export function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function slugifyCategory(input: string) {
  return slugify(input.replace(/&/g, " and ")).slice(0, 80);
}
