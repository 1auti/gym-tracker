import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { initDatabase } from './db/database';
import EntrenarScreen from './screens/EntrenarScreen';
import PlantillasScreen from './screens/PlantillasScreen';
import HistorialScreen from './screens/HistorialScreen';

const Tab = createBottomTabNavigator();

export default function App() {
  const [listo, setListo] = useState(false);

  useEffect(() => {
    initDatabase().then(() => setListo(true));
  }, []);

  if (!listo) {
    return (
      <View style={styles.cargando}>
        <Text>Cargando…</Text>
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <Tab.Navigator initialRouteName="Entrenar" screenOptions={{ headerShown: false }}>
          <Tab.Screen name="Entrenar" component={EntrenarScreen} />
          <Tab.Screen name="Plantillas" component={PlantillasScreen} />
          <Tab.Screen name="Historial" component={HistorialScreen} />
        </Tab.Navigator>
      </NavigationContainer>
      <StatusBar style="auto" />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  cargando: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
