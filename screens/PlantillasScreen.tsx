import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import React, { useCallback, useState } from 'react';
import {
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  actualizarPlantilla,
  crearPlantilla,
  eliminarPlantilla,
  getPlantilla,
  listPlantillas,
} from '../db/plantillas';
import { NuevoPlantillaItem, Plantilla, PlantillaItem } from '../db/types';
import { colors } from '../theme';

type ItemEnEdicion = NuevoPlantillaItem & { key: string };

export default function PlantillasScreen() {
  const navigation = useNavigation<any>();
  const [plantillas, setPlantillas] = useState<Plantilla[]>([]);
  const [editando, setEditando] = useState<{ id: number | null; nombre: string; items: ItemEnEdicion[] } | null>(
    null
  );

  const cargar = useCallback(async () => {
    setPlantillas(await listPlantillas());
  }, []);

  useFocusEffect(
    useCallback(() => {
      cargar();
    }, [cargar])
  );

  const nuevaPlantilla = () => {
    setEditando({ id: null, nombre: '', items: [nuevoItem()] });
  };

  const editarPlantilla = async (id: number) => {
    const plantilla = await getPlantilla(id);
    if (!plantilla) return;
    setEditando({
      id: plantilla.id,
      nombre: plantilla.nombre,
      items: plantilla.items.map((it: PlantillaItem) => ({
        key: String(it.id),
        ejercicio: it.ejercicio,
        peso: it.peso,
        repeticiones: it.repeticiones,
        rpe: it.rpe,
        rir: it.rir,
      })),
    });
  };

  const borrarPlantilla = (id: number) => {
    Alert.alert('Borrar plantilla', '¿Seguro que querés borrarla?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Borrar',
        style: 'destructive',
        onPress: async () => {
          await eliminarPlantilla(id);
          cargar();
        },
      },
    ]);
  };

  const guardar = async () => {
    if (!editando || !editando.nombre.trim()) return;
    const items = editando.items
      .filter((it) => it.ejercicio.trim())
      .map((it) => ({
        ejercicio: it.ejercicio.trim(),
        peso: it.peso ?? null,
        repeticiones: it.repeticiones ?? null,
        rpe: it.rpe ?? null,
        rir: it.rir ?? null,
      }));

    if (editando.id == null) {
      await crearPlantilla(editando.nombre.trim(), items);
    } else {
      await actualizarPlantilla(editando.id, editando.nombre.trim(), items);
    }
    setEditando(null);
    cargar();
  };

  const iniciarDesdeplantilla = (id: number) => {
    navigation.navigate('Entrenar', { plantillaId: id });
  };

  if (editando) {
    return (
      <EditorPlantilla
        editando={editando}
        onChange={setEditando}
        onCancelar={() => setEditando(null)}
        onGuardar={guardar}
      />
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={plantillas}
        keyExtractor={(item) => String(item.id)}
        ListEmptyComponent={<Text style={styles.vacio}>Todavía no creaste plantillas.</Text>}
        renderItem={({ item }) => (
          <View style={styles.fila}>
            <TouchableOpacity style={styles.filaInfo} onPress={() => iniciarDesdeplantilla(item.id)}>
              <Text style={styles.nombre}>{item.nombre}</Text>
              <Text style={styles.hint}>Tocar para iniciar sesión</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => editarPlantilla(item.id)} style={styles.accionBoton}>
              <Ionicons name="pencil" size={20} color={colors.primary} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => borrarPlantilla(item.id)} style={styles.accionBoton}>
              <Ionicons name="trash" size={20} color={colors.danger} />
            </TouchableOpacity>
          </View>
        )}
      />
      <TouchableOpacity style={styles.botonNueva} onPress={nuevaPlantilla}>
        <Text style={styles.botonNuevaTexto}>+ Nueva plantilla</Text>
      </TouchableOpacity>
    </View>
  );
}

function nuevoItem(): ItemEnEdicion {
  return { key: String(Date.now() + Math.random()), ejercicio: '', peso: null, repeticiones: null };
}

interface EditorPlantillaProps {
  editando: { id: number | null; nombre: string; items: ItemEnEdicion[] };
  onChange: (v: { id: number | null; nombre: string; items: ItemEnEdicion[] }) => void;
  onCancelar: () => void;
  onGuardar: () => void;
}

function EditorPlantilla({ editando, onChange, onCancelar, onGuardar }: EditorPlantillaProps) {
  const actualizarItem = (key: string, cambios: Partial<ItemEnEdicion>) => {
    onChange({
      ...editando,
      items: editando.items.map((it) => (it.key === key ? { ...it, ...cambios } : it)),
    });
  };

  const agregarItem = () => {
    onChange({ ...editando, items: [...editando.items, nuevoItem()] });
  };

  const quitarItem = (key: string) => {
    onChange({ ...editando, items: editando.items.filter((it) => it.key !== key) });
  };

  return (
    <View style={styles.container}>
      <FlatList
        ListHeaderComponent={
          <TextInput
            style={styles.inputNombre}
            placeholder="Nombre de la plantilla"
            placeholderTextColor={colors.textMuted}
            value={editando.nombre}
            onChangeText={(nombre) => onChange({ ...editando, nombre })}
          />
        }
        data={editando.items}
        keyExtractor={(item) => item.key}
        renderItem={({ item }) => (
          <View style={styles.itemFila}>
            <TextInput
              style={[styles.input, styles.inputEjercicio]}
              placeholder="Ejercicio"
              placeholderTextColor={colors.textMuted}
              value={item.ejercicio}
              onChangeText={(v) => actualizarItem(item.key, { ejercicio: v })}
            />
            <TextInput
              style={[styles.input, styles.inputChico]}
              placeholder="kg"
              placeholderTextColor={colors.textMuted}
              keyboardType="numeric"
              value={item.peso != null ? String(item.peso) : ''}
              onChangeText={(v) => actualizarItem(item.key, { peso: v ? Number(v) : null })}
            />
            <TextInput
              style={[styles.input, styles.inputChico]}
              placeholder="reps"
              placeholderTextColor={colors.textMuted}
              keyboardType="numeric"
              value={item.repeticiones != null ? String(item.repeticiones) : ''}
              onChangeText={(v) => actualizarItem(item.key, { repeticiones: v ? Number(v) : null })}
            />
            <TouchableOpacity onPress={() => quitarItem(item.key)} style={styles.accionBoton}>
              <Ionicons name="close" size={20} color={colors.textMuted} />
            </TouchableOpacity>
          </View>
        )}
        ListFooterComponent={
          <TouchableOpacity onPress={agregarItem} style={styles.agregarItem}>
            <Text style={styles.agregarItemTexto}>+ Agregar ejercicio</Text>
          </TouchableOpacity>
        }
      />
      <View style={styles.acciones}>
        <TouchableOpacity style={styles.botonSecundario} onPress={onCancelar}>
          <Text style={styles.botonSecundarioTexto}>Cancelar</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.botonPrimario, !editando.nombre.trim() && styles.botonDeshabilitado]}
          onPress={onGuardar}
          disabled={!editando.nombre.trim()}
        >
          <Text style={styles.botonPrimarioTexto}>Guardar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  vacio: { textAlign: 'center', color: colors.textMuted, marginTop: 24 },
  fila: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  filaInfo: { flex: 1 },
  nombre: { fontSize: 16, fontWeight: '600', color: colors.text },
  hint: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  accionBoton: { padding: 8 },
  botonNueva: {
    margin: 16,
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  botonNuevaTexto: { color: colors.onPrimary, fontWeight: '700', fontSize: 16 },
  inputNombre: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 18,
    fontWeight: '600',
    margin: 16,
    marginBottom: 8,
    color: colors.text,
    backgroundColor: colors.surface,
  },
  itemFila: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, gap: 8, marginBottom: 8 },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    color: colors.text,
    backgroundColor: colors.surface,
  },
  inputEjercicio: { flex: 2 },
  inputChico: { flex: 1 },
  agregarItem: { paddingHorizontal: 16, paddingVertical: 10 },
  agregarItemTexto: { color: colors.primary, fontSize: 14 },
  acciones: { flexDirection: 'row', gap: 10, padding: 16, borderTopWidth: 1, borderTopColor: colors.border },
  botonPrimario: {
    flex: 1,
    backgroundColor: colors.success,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  botonDeshabilitado: { opacity: 0.5 },
  botonPrimarioTexto: { color: colors.onPrimary, fontWeight: '700', fontSize: 16 },
  botonSecundario: {
    flex: 1,
    backgroundColor: colors.chip,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  botonSecundarioTexto: { color: colors.text, fontWeight: '600', fontSize: 16 },
});
