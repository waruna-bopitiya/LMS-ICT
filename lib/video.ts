export function extractYoutubeId(url: string) {
  const regex =
    /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/|live\/|v\/)|youtu\.be\/)([^&\n?#/]+)/
  const match = url.match(regex)
  return match ? match[1] : null
}
