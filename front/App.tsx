// App.tsx
import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AuthStack from './navigation/AuthStack';
import DrawerNavigator from './navigation/DrawerNavigator';
import { View, ActivityIndicator, StyleSheet } from 'react-native';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Verificar si el usuario ya está autenticado al iniciar la app
    const checkToken = async () => {
      try {
        const token = await AsyncStorage.getItem('userToken');
        console.log('Token encontrado:', !!token);
        setIsAuthenticated(!!token);
      } catch (error) {
        console.error('Error al verificar token:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkToken();
  }, []);

  // Función para debug
  const handleSetIsAuthenticated = (value: boolean) => {
    console.log('setIsAuthenticated llamado con:', value);
    setIsAuthenticated(value);
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF8C00" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {isAuthenticated ? (
        <DrawerNavigator setIsAuthenticated={handleSetIsAuthenticated} />
      ) : (
        <AuthStack setIsAuthenticated={handleSetIsAuthenticated} />
      )}
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
});