// Source-agnostic recipe video embed. v1 renders YouTube; TikTok/Instagram
// plug in by adding a branch here — nothing else in the app changes because
// callers only pass { source, platformId }.

export type VideoSource = "YOUTUBE" | "TIKTOK" | "INSTAGRAM";

export interface EmbedVideo {
  source: VideoSource;
  platformId: string;
  title?: string | null;
}

function embedSrc(video: EmbedVideo): string | null {
  switch (video.source) {
    case "YOUTUBE":
      return `https://www.youtube-nocookie.com/embed/${video.platformId}`;
    case "TIKTOK":
      return `https://www.tiktok.com/embed/v2/${video.platformId}`;
    case "INSTAGRAM":
      return `https://www.instagram.com/p/${video.platformId}/embed`;
    default:
      return null;
  }
}

export function VideoEmbed({ video }: { video: EmbedVideo }) {
  const src = embedSrc(video);
  if (!src) return null;

  return (
    <div className="aspect-video w-full overflow-hidden rounded-[var(--radius)] bg-black">
      <iframe
        src={src}
        title={video.title ?? "Recipe video"}
        className="h-full w-full"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    </div>
  );
}

/** Parse a YouTube watch/share URL into its platform id. */
export function youtubeIdFromUrl(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=)([\w-]{11})/,
    /(?:youtu\.be\/)([\w-]{11})/,
    /(?:youtube\.com\/embed\/)([\w-]{11})/,
    /(?:youtube\.com\/shorts\/)([\w-]{11})/,
  ];
  for (const re of patterns) {
    const m = url.match(re);
    if (m?.[1]) return m[1];
  }
  return null;
}
