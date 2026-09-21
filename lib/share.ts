export function buildLineShareUrl(title: string, message: string, url: string): string {
  return `https://line.me/R/share?text=${encodeURIComponent([title, message, url].filter(Boolean).join('\n'))}`
}
