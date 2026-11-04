import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

import { buttonTheme, checkboxTheme, FOCUS_RING, textInputTheme } from './themes';

// Components (.tsx); the shared themes are checked through their exports below.
const SRC = join(__dirname, '..');

const sourceFiles = (dir: string): string[] =>
  readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return sourceFiles(path);
    return /\.tsx$/.test(name) && !/\.test\.tsx$/.test(name) ? [path] : [];
  });

// A ring on plain `:focus` also shows on a mouse click (Chromium/WebKit/Gecko only match
// `:focus-visible` on buttons and checkboxes for keyboard focus). `focus:ring-0` is fine: it
// cancels flowbite's `focus:ring-4`.
const CLICK_RING = /(?:^|\s)(?:dark:)?focus:ring-(?!0(?![\w-]))[^\s'"`]+/g;

// Text fields match `:focus-visible` on a click as well, so their ring is plain `:focus`.
const FIELD_FILES = ['components/InputOTP.tsx'];

describe('auth UI focus ring', () => {
  it('is keyboard-only: a 2px primary ring on :focus-visible', () => {
    expect(FOCUS_RING).toContain('focus-visible:ring-2');
    expect(FOCUS_RING).toContain('focus-visible:ring-[var(--primary-color)]');
    expect(FOCUS_RING.match(CLICK_RING)).toBeNull();
  });

  it('never rings a button or checkbox on a mouse click', () => {
    // The colours the auth screens render (the other flowbite colours are spread, unused).
    const themed = [
      buttonTheme.color.default,
      buttonTheme.color.light,
      checkboxTheme.color.default,
    ].join(' ');
    expect(themed.match(CLICK_RING)).toBeNull();

    const offenders = sourceFiles(SRC)
      .filter((file) => !FIELD_FILES.some((field) => file.endsWith(field)))
      .flatMap((file) =>
        [...readFileSync(file, 'utf8').matchAll(CLICK_RING)].map(
          (m) => `${file.slice(SRC.length + 1)}: ${m[0].trim()}`,
        ),
      );
    expect(offenders).toEqual([]);
  });

  it('keeps primary-colour buttons on the primary hover (no leftover flowbite red)', () => {
    const offenders = sourceFiles(SRC).flatMap((file) =>
      [...readFileSync(file, 'utf8').matchAll(/className="([^"]*)"/g)]
        .map((m) => m[1])
        .filter((cls) => /\bbg-\[(?:var\()?--primary-color\)?\]/.test(cls) && /\bred-\d/.test(cls))
        .map((cls) => `${file.slice(SRC.length + 1)}: ${cls.match(/\S*red-\d\S*/g)?.join(' ')}`),
    );
    expect(offenders).toEqual([]);
  });
});

describe('auth UI control height (QA2210-01: ~40px)', () => {
  it('text inputs are 40px tall at the default size', () => {
    expect(textInputTheme.field.input.sizes.md.split(/\s+/)).toContain('h-10');
  });

  it('buttons are 40px tall at the default size', () => {
    expect(buttonTheme.size.md.split(/\s+/)).toContain('h-10');
  });
});
