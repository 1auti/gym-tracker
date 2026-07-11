import React from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

interface StepperProps {
  label: string;
  value: number;
  step: number;
  min?: number;
  onChange: (value: number) => void;
}

// Stepper +/- para minimizar el uso de teclado al cargar peso/reps.
export default function Stepper({ label, value, step, min = 0, onChange }: StepperProps) {
  const decrementar = () => onChange(Math.max(min, round(value - step)));
  const incrementar = () => onChange(round(value + step));

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.row}>
        <TouchableOpacity style={styles.boton} onPress={decrementar}>
          <Text style={styles.botonTexto}>−</Text>
        </TouchableOpacity>
        <TextInput
          style={styles.valor}
          value={String(value)}
          keyboardType="numeric"
          onChangeText={(texto) => {
            const n = Number(texto.replace(',', '.'));
            if (!Number.isNaN(n)) onChange(n);
          }}
        />
        <TouchableOpacity style={styles.boton} onPress={incrementar}>
          <Text style={styles.botonTexto}>+</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function round(n: number): number {
  return Math.round(n * 100) / 100;
}

const styles = StyleSheet.create({
  container: { alignItems: 'center' },
  label: { fontSize: 13, color: '#666', marginBottom: 4 },
  row: { flexDirection: 'row', alignItems: 'center' },
  boton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#2563eb',
    alignItems: 'center',
    justifyContent: 'center',
  },
  botonTexto: { color: '#fff', fontSize: 22, fontWeight: '600' },
  valor: {
    minWidth: 60,
    textAlign: 'center',
    fontSize: 20,
    fontWeight: '600',
    marginHorizontal: 12,
  },
});
