import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { resolveBadgeColors } from '@/shared/components/primitives';
import { useTheme } from '@/shared/hooks/useTheme';

interface BadgeProps {
  label: string;
  tone?: 'active' | 'warning' | 'danger' | 'muted';
}

export function Badge({ label, tone = 'muted' }: BadgeProps): React.JSX.Element {
  const { theme } = useTheme();

  const badgeColors = useMemo(() => {
    return resolveBadgeColors(tone, theme.colors);
  }, [theme.colors, tone]);

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: badgeColors.backgroundColor,
          borderColor: badgeColors.borderColor,
          borderRadius: theme.radius.pill,
        },
      ]}
    >
      <Text
        style={[
          styles.label,
          {
            color: badgeColors.textColor,
            fontFamily: theme.fontFamily.medium,
            fontSize: theme.typography.label.fontSize,
            fontWeight: theme.typography.label.fontWeight,
            letterSpacing: theme.typography.label.letterSpacing,
            lineHeight: theme.typography.label.lineHeight,
          },
        ]}
      >
        {label.toUpperCase()}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignSelf: 'flex-start',
    borderWidth: 0.5,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  label: {
    textAlignVertical: 'center',
  },
});
