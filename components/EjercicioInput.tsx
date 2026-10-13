import React, { useMemo, useState } from 'react';
import { FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { colors } from '../theme';

interface EjercicioInputProps {
  value: string;
  onChange: (value: string) => void;
  sugerencias: string[];
}

// Input de texto libre con autocompletado sobre ejercicios ya usados (SELECT DISTINCT).
export default function EjercicioInput({ value, onChange, sugerencias }: EjercicioInputProps) {
  const [enfocado, setEnfocado] = useState(false);

  const coincidencias = useMemo(() => {
    if (!value.trim()) return sugerencias.slice(0, 5);
    const texto = value.toLowerCase();
    return sugerencias.filter((s) => s.toLowerCase().includes(texto)).slice(0, 5);
  }, [value, sugerencias]);

  return (
    <View>
      <TextInput
        style={styles.input}
        placeholder="Ejercicio"
        placeholderTextColor={colors.textMuted}
        value={value}
        onChangeText={onChange}
        onFocus={() => setEnfocado(true)}
        onBlur={() => setTimeout(() => setEnfocado(false), 150)}
      />
      {enfocado && coincidencias.length > 0 && (
        <View style={styles.lista}>
          <FlatList
            data={coincidencias}
            keyExtractor={(item) => item}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.item}
                onPress={() => {
                  onChange(item);
                  setEnfocado(false);
                }}
              >
                <Text style={styles.itemTexto}>{item}</Text>
              </TouchableOpacity>
            )}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: colors.text,
    backgroundColor: colors.surface,
  },
  lista: {
    borderWidth: 1,
    borderColor: colors.border,
    borderTopWidth: 0,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
    maxHeight: 160,
    backgroundColor: colors.surface,
  },
  item: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  itemTexto: { color: colors.text },
});
