/** Splits a free-text field ("1576, 3023 4054") into distinct trimmed tokens. */
export function parseTokenList(raw: string | undefined | null): string[] {
  const tokens = (raw ?? '')
    .split(/[\s,;]+/)
    .map((token) => token.trim())
    .filter(Boolean);
  return Array.from(new Set(tokens));
}
