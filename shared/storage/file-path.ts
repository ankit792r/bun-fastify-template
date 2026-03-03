// Check for only URL-safe characters: alphanumeric, dash, underscore, dot, forward slash
// Backslashes are NOT allowed.
const urlSafePattern = /^[a-zA-Z0-9\-_./]+$/;

export function validateFilePath(filePath: string): void {
  if (filePath.length === 0 || filePath.length > 1024) {
    throw new Error(
      `Invalid file path: length must be between 1 and 1024 characters: ${filePath}`,
    );
  }

  if (
    filePath.startsWith('/') ||
    filePath.endsWith('/') ||
    filePath.includes('//')
  ) {
    throw new Error(
      `Invalid file path: cannot start or end with '/' or contain '//' sequences: ${filePath}`,
    );
  }

  if (filePath.includes('..')) {
    throw new Error(`Invalid file path: contains path traversal: ${filePath}`);
  }

  if (!urlSafePattern.test(filePath)) {
    throw new Error(
      `Invalid file path: contains non-URL-safe characters: ${filePath}`,
    );
  }
}
