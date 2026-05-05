import { describe, it, expect } from 'vitest';

/**
 * Soma is anti-streak by design (S3 mandate). This test asserts that no
 * user-facing copy in the source tree mentions "streak". Comments are
 * allowed to reference the rule, but UI strings, tokens, and copy keys
 * must not.
 *
 * Implementation: we use Vite's `import.meta.glob('../**\/*.{ts,tsx}',
 * { as: 'raw' })` to read every source file as text — no Node-only APIs.
 */

const sources = import.meta.glob('../**/*.{ts,tsx}', {
  eager: true,
  query: '?raw',
  import: 'default',
}) as Record<string, string>;

function offendingLines(file: string, text: string): string[] {
  const offenders: string[] = [];
  const lines = text.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!/streak/i.test(line)) continue;
    const trimmed = line.trim();
    // Allow comment markers — they document the no-streak rule.
    if (
      trimmed.startsWith('//') ||
      trimmed.startsWith('*') ||
      trimmed.startsWith('/**') ||
      trimmed.startsWith('/*')
    )
      continue;
    offenders.push(`${file}:${i + 1}:${trimmed}`);
  }
  return offenders;
}

describe('no-streak invariant', () => {
  it('no source file ships a user-facing "streak" string', () => {
    const offenders: string[] = [];
    for (const [file, text] of Object.entries(sources)) {
      // Skip this test file itself (it intentionally mentions the word).
      if (file.includes('no-streak.test')) continue;
      offenders.push(...offendingLines(file, text));
    }
    expect(offenders).toEqual([]);
  });
});
