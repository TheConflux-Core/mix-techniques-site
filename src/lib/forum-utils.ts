/**
 * Forum utility functions
 */

/**
 * Generate a URL-safe slug from text, truncated to maxLen characters
 */
export function generateForumSlug(text: string, maxLen = 200): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, maxLen)
    .replace(/-$/, "");
}

/**
 * Format a date string as relative time ("2 hours ago", "3 days ago", etc.)
 */
export function formatTimeAgo(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return "just now";
  if (seconds < 3600) {
    const m = Math.floor(seconds / 60);
    return `${m} min${m === 1 ? "" : "s"} ago`;
  }
  if (seconds < 86400) {
    const h = Math.floor(seconds / 3600);
    return `${h} hour${h === 1 ? "" : "s"} ago`;
  }
  if (seconds < 604800) {
    const d = Math.floor(seconds / 86400);
    return `${d} day${d === 1 ? "" : "s"} ago`;
  }
  if (seconds < 2592000) {
    const w = Math.floor(seconds / 604800);
    return `${w} week${w === 1 ? "" : "s"} ago`;
  }
  if (seconds < 31536000) {
    const months = Math.floor(seconds / 2592000);
    return `${months} month${months === 1 ? "" : "s"} ago`;
  }
  const years = Math.floor(seconds / 31536000);
  return `${years} year${years === 1 ? "" : "s"} ago`;
}

/** Alias for generateForumSlug — used by forum API routes */
export const generateSlug = generateForumSlug;
