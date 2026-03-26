/**
 * Utility for merging Tailwind CSS class names conditionally.
 * Lightweight alternative to clsx + tailwind-merge for this project.
 */
export function cn(...classes: (string | boolean | null | undefined)[]): string {
  return classes.filter(Boolean).join(' ')
}
