import { useFocusEffect, useRoute } from '@react-navigation/native';
import React, { useCallback, useState } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import EjercicioInput from '../components/EjercicioInput';
import SerieItem from '../components/SerieItem';
import Stepper from '../components/Stepper';
import { addSerie, getUltimaSerie, listEjerciciosConocidos, listSeriesBySesion } from '../db/series';
import { getOrCrearSesionHoy } from '../db/sesiones';
import { getPlantilla } from '../db/plantillas';
import { PlantillaItem, Serie } from '../db/types';
import { colors } from '../theme';

export default function EntrenarScreen() {
  const route = useRoute<any>();
  const [sesionId, setSesionId] = useState<number | null>(null);
  const [series, setSeries] = useState<Serie[]>([]);
  const [ejerciciosConocidos, setEjerciciosConocidos] = useState<string[]>([]);
  const [sugeridos, setSugeridos] = useState<PlantillaItem[]>([]);

  const [ejercicio, setEjercicio] = useState('');
  const [peso, setPeso] = useState(20);
  const [reps, setReps] = useState(10);
  const [mostrarRpeRir, setMostrarRpeRir] = useState(false);
  const [rpe, setRpe] = useState<number | null>(null);
  const [rir, setRir] = useState<number | null>(null);

  const cargar = useCallback(async () => {
    const sesion = await getOrCrearSesionHoy();
    setSesionId(sesion.id);
    const [seriesSesion, ejercicios] = await Promise.all([
      listSeriesBySesion(sesion.id),
      listEjerciciosConocidos(),
    ]);
    setSeries(seriesSesion);
    setEjerciciosConocidos(ejercicios);

    const plantillaId = route.params?.plantillaId;
    if (plantillaId) {
      const plantilla = await getPlantilla(plantillaId);
      setSugeridos(plantilla?.items ?? []);
    }
  }, [route.params?.plantillaId]);

  useFocusEffect(
    useCallback(() => {
      cargar();
    }, [cargar])
  );

  const limpiarForm = () => {
    setEjercicio('');
    setPeso(20);
    setReps(10);
    setRpe(null);
    setRir(null);
    setMostrarRpeRir(false);
  };

  const guardarSerie = async () => {
    if (!sesionId || !ejercicio.trim()) return;
    const nueva = await addSerie(sesionId, {
      ejercicio: ejercicio.trim(),
      peso,
      repeticiones: reps,
      rpe,
      rir,
    });
    setSeries((prev) => [...prev, nueva]);
    limpiarForm();
  };

  const repetirUltima = async () => {
    if (!sesionId) return;
    const ultima = await getUltimaSerie(sesionId);
    if (!ultima) return;
    const nueva = await addSerie(sesionId, {
      ejercicio: ultima.ejercicio,
      peso: ultima.peso,
      repeticiones: ultima.repeticiones,
      rpe: ultima.rpe,
      rir: ultima.rir,
    });
    setSeries((prev) => [...prev, nueva]);
  };

  const usarSugerido = (item: PlantillaItem) => {
    setEjercicio(item.ejercicio);
    if (item.peso != null) setPeso(item.peso);
    if (item.repeticiones != null) setReps(item.repeticiones);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <FlatList
        style={styles.lista}
        data={series}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => <SerieItem serie={item} />}
        ListEmptyComponent={<Text style={styles.vacio}>Todavía no cargaste series hoy.</Text>}
      />

      {sugeridos.length > 0 && (
        <View style={styles.sugeridos}>
          {sugeridos.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.chip}
              onPress={() => usarSugerido(item)}
            >
              <Text style={styles.chipTexto}>{item.ejercicio}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      <View style={styles.form}>
        <EjercicioInput value={ejercicio} onChange={setEjercicio} sugerencias={ejerciciosConocidos} />

        <View style={styles.steppers}>
          <Stepper label="Peso (kg)" value={peso} step={2.5} min={0} onChange={setPeso} />
          <Stepper label="Reps" value={reps} step={1} min={0} onChange={setReps} />
        </View>

        <TouchableOpacity onPress={() => setMostrarRpeRir((v) => !v)}>
          <Text style={styles.toggleRpe}>
            {mostrarRpeRir ? 'Ocultar RPE/RIR' : 'Agregar RPE/RIR (opcional)'}
          </Text>
        </TouchableOpacity>

        {mostrarRpeRir && (
          <View style={styles.steppers}>
            <Stepper label="RPE" value={rpe ?? 0} step={0.5} min={0} onChange={setRpe} />
            <Stepper label="RIR" value={rir ?? 0} step={1} min={0} onChange={setRir} />
          </View>
        )}

        <View style={styles.acciones}>
          <TouchableOpacity style={styles.botonSecundario} onPress={repetirUltima}>
            <Text style={styles.botonSecundarioTexto}>Repetir última</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.botonPrimario, !ejercicio.trim() && styles.botonDeshabilitado]}
            onPress={guardarSerie}
            disabled={!ejercicio.trim()}
          >
            <Text style={styles.botonPrimarioTexto}>Agregar serie</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  lista: { flex: 1 },
  vacio: { textAlign: 'center', color: colors.textMuted, marginTop: 24 },
  sugeridos: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 12, gap: 8 },
  chip: {
    backgroundColor: colors.chip,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginBottom: 8,
  },
  chipTexto: { fontSize: 13, color: colors.text },
  form: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    padding: 16,
    gap: 12,
  },
  steppers: { flexDirection: 'row', justifyContent: 'space-around' },
  toggleRpe: { color: colors.primary, textAlign: 'center', fontSize: 14 },
  acciones: { flexDirection: 'row', gap: 10 },
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
