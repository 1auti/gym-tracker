import { Ionicons } from '@expo/vector-icons';
import { DarkTheme, NavigationContainer, Theme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { initDatabase } from './db/database';
import EntrenarScreen from './screens/EntrenarScreen';
import PlantillasScreen from './screens/PlantillasScreen';
import HistorialScreen from './screens/HistorialScreen';
import { colors } from './theme';

const Tab = createBottomTabNavigator();

const ICONOS_TAB: Record<string, keyof typeof Ionicons.glyphMap> = {
  Entrenar: 'barbell',
  Plantillas: 'copy',
  Historial: 'time',
};

// Fuerza modo oscuro siempre, no sigue el tema del sistema.
const temaApp: Theme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: colors.background,
    card: colors.surface,
    border: colors.border,
    text: colors.text,
    primary: colors.primary,
  },
};

export default function App() {
  const [listo, setListo] = useState(false);

  useEffect(() => {
    initDatabase().then(() => setListo(true));
  }, []);

  if (!listo) {
    return (
      <View style={styles.cargando}>
        <Text style={styles.cargandoTexto}>Cargando…</Text>
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <NavigationContainer theme={temaApp}>
        <Tab.Navigator
          initialRouteName="Entrenar"
          screenOptions={({ route }) => ({
            headerShown: false,
            tabBarIcon: ({ color, size }) => (
              <Ionicons name={ICONOS_TAB[route.name]} size={size} color={color} />
            ),
            tabBarActiveTintColor: colors.primary,
            tabBarInactiveTintColor: colors.textMuted,
            tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.border },
          })}
        >
          <Tab.Screen name="Entrenar" component={EntrenarScreen} />
          <Tab.Screen name="Plantillas" component={PlantillasScreen} />
          <Tab.Screen name="Historial" component={HistorialScreen} />
        </Tab.Navigator>
      </NavigationContainer>
      <StatusBar style="light" />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  cargando: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
  cargandoTexto: { color: colors.text },
});
