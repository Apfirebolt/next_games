export function extractFranchiseKey(title = "") {
  return title
    .toLowerCase()
    // Remove subtitles after delimiters like ':', '-', '|'
    .split(/[:\-–—|]/)[0]
    // Strip edition
    .replace(/\b(19\d\d|20\d\d|\d+|[ivxlcdm]+)\b/gi, "")
    .replace(/\b(remastered|remake|edition|hd|goty|collection)\b/gi, "")
    // Remove non-alphanumerics and collapse spaces
    .replace(/[^a-z0-9\s]/g, "")
    .trim();
}