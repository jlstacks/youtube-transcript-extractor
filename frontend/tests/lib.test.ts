import { describe, expect, it } from 'vitest';
import { extractVideoId, safeFilename } from '../src/lib';

describe('extractVideoId', () => {
  it.each([
    ['dQw4w9WgXcQ', 'dQw4w9WgXcQ'],
    ['https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=3', 'dQw4w9WgXcQ'],
    ['https://youtu.be/dQw4w9WgXcQ?si=abc', 'dQw4w9WgXcQ'],
    ['youtube.com/shorts/dQw4w9WgXcQ', 'dQw4w9WgXcQ'],
    ['https://example.com/watch?v=dQw4w9WgXcQ', null],
    ['not-a-video!', null],
  ])('parses %s', (value, expected) => {
    expect(extractVideoId(value)).toBe(expected);
  });
});

it('sanitizes export filenames', () => {
  expect(safeFilename('../video', 'txt')).toBe('youtube-transcript-video.txt');
});
