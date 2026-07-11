import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Serie } from '../db/types';

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
    borderBottomColor: '#eee',
  },
  ejercicio: { fontSize: 16, fontWeight: '600' },
  detalle: { fontSize: 14, color: '#555', marginTop: 2 },
});
