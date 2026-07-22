export const VIDEO_ID_PATTERN = /^[A-Za-z0-9_-]{11}$/;

export function extractVideoId(value: string): string | null {
  const candidate = value.trim();
  if (VIDEO_ID_PATTERN.test(candidate)) return candidate;

  try {
    const parsed = new URL(candidate.includes('://') ? candidate : `https://${candidate}`);
    const host = parsed.hostname.toLowerCase().replace(/^www\./, '').replace(/\.$/, '');
    let id: string | null = null;

    if (host === 'youtu.be') {
      id = parsed.pathname.split('/').filter(Boolean)[0] ?? null;
    } else if (host === 'youtube.com' || host.endsWith('.youtube.com')) {
      if (parsed.pathname === '/watch') {
        id = parsed.searchParams.get('v');
      } else {
        const parts = parsed.pathname.split('/').filter(Boolean);
        if (['embed', 'live', 'shorts', 'v'].includes(parts[0])) id = parts[1] ?? null;
      }
    }

    return id && VIDEO_ID_PATTERN.test(id) ? id : null;
  } catch {
    return null;
  }
}

export function safeFilename(videoId: string, extension: string): string {
  const safeId = videoId.replace(/[^A-Za-z0-9_-]/g, '');
  return `youtube-transcript-${safeId}.${extension}`;
}
