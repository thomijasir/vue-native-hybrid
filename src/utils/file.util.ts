/**
 * Formats a file size in bytes into a human-readable label.
 *
 * @returns A string in `B`, `KB`, or `MB`.
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Validates whether a file extension is included in an allowed list.
 *
 * @remarks
 * Comparison is case-insensitive.
 */
export function validateFileExtension(file: File, allowed: string[]): boolean {
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  return allowed.map((e) => e.toLowerCase()).includes(ext);
}
