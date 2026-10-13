import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useState } from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { listEjerciciosConocidos, listSeriesBySesion, listSeriesPorEjercicio, SerieHistorial } from '../db/series';
import { listSesiones } from '../db/sesiones';
import { Serie, SesionResumen } from '../db/types';
import { colors } from '../theme';

type Vista =
  | { tipo: 'sesiones' }
  | { tipo: 'ejercicios' }
  | { tipo: 'detalleSesion'; sesion: SesionResumen }
  | { tipo: 'detalleEjercicio'; ejercicio: string };

export default function HistorialScreen() {
  const [tab, setTab] = useState<'sesiones' | 'ejercicios'>('sesiones');
  const [vista, setVista] = useState<Vista>({ tipo: 'sesiones' });
  const [sesiones, setSesiones] = useState<SesionResumen[]>([]);
  const [ejercicios, setEjercicios] = useState<string[]>([]);
  const [seriesDetalle, setSeriesDetalle] = useState<Serie[]>([]);
  const [historialEjercicio, setHistorialEjercicio] = useState<SerieHistorial[]>([]);

  useFocusEffect(
    useCallback(() => {
      setVista({ tipo: 'sesiones' });
      setTab('sesiones');
      listSesiones().then(setSesiones);
      listEjerciciosConocidos().then(setEjercicios);
    }, [])
  );

  const abrirSesion = async (sesion: SesionResumen) => {
    setSeriesDetalle(await listSeriesBySesion(sesion.id));
    setVista({ tipo: 'detalleSesion', sesion });
  };

  const abrirEjercicio = async (ejercicio: string) => {
    setHistorialEjercicio(await listSeriesPorEjercicio(ejercicio));
    setVista({ tipo: 'detalleEjercicio', ejercicio });
  };

  if (vista.tipo === 'detalleSesion') {
    return (
      <View style={styles.container}>
        <TouchableOpacity onPress={() => setVista({ tipo: 'sesiones' })} style={styles.volver}>
          <Text style={styles.volverTexto}>‹ Sesiones</Text>
        </TouchableOpacity>
        <Text style={styles.titulo}>{vista.sesion.fecha}</Text>
        <FlatList
          data={seriesDetalle}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => (
            <View style={styles.fila}>
              <Text style={styles.filaTitulo}>{item.ejercicio}</Text>
              <Text style={styles.filaDetalle}>
                {item.peso} kg × {item.repeticiones}
                {item.rpe != null ? `  ·  RPE ${item.rpe}` : ''}
                {item.rir != null ? `  ·  RIR ${item.rir}` : ''}
              </Text>
            </View>
          )}
        />
      </View>
    );
  }

  if (vista.tipo === 'detalleEjercicio') {
    return (
      <View style={styles.container}>
        <TouchableOpacity onPress={() => setVista({ tipo: 'ejercicios' })} style={styles.volver}>
          <Text style={styles.volverTexto}>‹ Ejercicios</Text>
        </TouchableOpacity>
        <Text style={styles.titulo}>{vista.ejercicio}</Text>
        <FlatList
          data={historialEjercicio}
          keyExtractor={(item) => String(item.id)}
          ListEmptyComponent={<Text style={styles.vacio}>Sin registros todavía.</Text>}
          renderItem={({ item }) => (
            <View style={styles.fila}>
              <Text style={styles.filaTitulo}>{item.fecha}</Text>
              <Text style={styles.filaDetalle}>
                {item.peso} kg × {item.repeticiones}
                {item.rpe != null ? `  ·  RPE ${item.rpe}` : ''}
                {item.rir != null ? `  ·  RIR ${item.rir}` : ''}
              </Text>
            </View>
          )}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, tab === 'sesiones' && styles.tabActivo]}
          onPress={() => setTab('sesiones')}
        >
          <Text style={[styles.tabTexto, tab === 'sesiones' && styles.tabTextoActivo]}>Sesiones</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, tab === 'ejercicios' && styles.tabActivo]}
          onPress={() => setTab('ejercicios')}
        >
          <Text style={[styles.tabTexto, tab === 'ejercicios' && styles.tabTextoActivo]}>Ejercicios</Text>
        </TouchableOpacity>
      </View>

      {tab === 'sesiones' ? (
        <FlatList
          data={sesiones}
          keyExtractor={(item) => String(item.id)}
          ListEmptyComponent={<Text style={styles.vacio}>Sin sesiones todavía.</Text>}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.fila} onPress={() => abrirSesion(item)}>
              <Text style={styles.filaTitulo}>{item.fecha}</Text>
              <Text style={styles.filaDetalle}>
                {item.totalEjercicios} ejercicios · {item.totalSeries} series
              </Text>
            </TouchableOpacity>
          )}
        />
      ) : (
        <FlatList
          data={ejercicios}
          keyExtractor={(item) => item}
          ListEmptyComponent={<Text style={styles.vacio}>Sin ejercicios registrados todavía.</Text>}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.fila} onPress={() => abrirEjercicio(item)}>
              <Text style={styles.filaTitulo}>{item}</Text>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  tabs: { flexDirection: 'row', padding: 12, gap: 8 },
  tab: { flex: 1, paddingVertical: 10, borderRadius: 8, backgroundColor: colors.surface, alignItems: 'center' },
  tabActivo: { backgroundColor: colors.primary },
  tabTexto: { color: colors.textMuted, fontWeight: '600' },
  tabTextoActivo: { color: colors.onPrimary },
  vacio: { textAlign: 'center', color: colors.textMuted, marginTop: 24 },
  fila: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  filaTitulo: { fontSize: 16, fontWeight: '600', color: colors.text },
  filaDetalle: { fontSize: 14, color: colors.textMuted, marginTop: 2 },
  volver: { padding: 16 },
  volverTexto: { color: colors.primary, fontSize: 16 },
  titulo: { fontSize: 20, fontWeight: '700', paddingHorizontal: 16, marginBottom: 8, color: colors.text },
});
