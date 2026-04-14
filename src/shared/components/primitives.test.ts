import { describe, expect, it } from 'vitest';

import {
  resolveBadgeColors,
  resolveButtonColors,
  resolveInputBorderState,
} from '@/shared/components/primitives';

const themeColors = {
  accent: '#10f',
  accentBg: '#102030',
  accentBorder: '#203040',
  bg: '#000',
  borderDefault: '#111',
  borderEmphasis: '#222',
  danger: '#f00',
  elevated: '#333',
  input: '#444',
  textMuted: '#555',
  textPrimary: '#eee',
  textSecondary: '#999',
  warning: '#ff0',
};

describe('primitives', () => {
  it('resolves primary and ghost button tokens without component rendering', () => {
    expect(resolveButtonColors('primary', themeColors)).toEqual({
      backgroundColor: '#10f',
      borderColor: '#10f',
      textColor: '#000',
    });

    expect(resolveButtonColors('ghost', themeColors)).toEqual({
      backgroundColor: 'transparent',
      borderColor: '#10f',
      textColor: '#10f',
    });
  });

  it('resolves badge tokens for active and warning states', () => {
    expect(resolveBadgeColors('active', themeColors)).toEqual({
      backgroundColor: '#102030',
      borderColor: '#203040',
      textColor: '#10f',
    });

    expect(resolveBadgeColors('warning', themeColors)).toEqual({
      backgroundColor: '#333',
      borderColor: '#ff0',
      textColor: '#ff0',
    });
  });

  it('promotes focus and error states into deterministic input borders', () => {
    expect(resolveInputBorderState(undefined, false, themeColors)).toEqual({
      borderColor: '#222',
      borderWidth: 0.5,
    });

    expect(resolveInputBorderState(undefined, true, themeColors)).toEqual({
      borderColor: '#10f',
      borderWidth: 1,
    });

    expect(resolveInputBorderState('Required', false, themeColors)).toEqual({
      borderColor: '#f00',
      borderWidth: 1,
    });
  });
});
