import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Serie } from '../db/types';
import { colors } from '../theme';

interface SerieItemProps {
  serie: Serie;
}

export default function SerieItem({ serie }: SerieItemProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.ejercicio}>{serie.ejercicio}</Text>
      <Text style={styles.detalle}>
        {serie.peso} kg × {serie.repeticiones}
        {serie.rpe != null ? `  ·  RPE ${serie.rpe}` : ''}
        {serie.rir != null ? `  ·  RIR ${serie.rir}` : ''}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  ejercicio: { fontSize: 16, fontWeight: '600', color: colors.text },
  detalle: { fontSize: 14, color: colors.textMuted, marginTop: 2 },
});
