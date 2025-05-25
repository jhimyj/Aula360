// navigation/AuthStack.tsx
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import StudentAuthScreen from '../screens/auth/StudentAuthScreen';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  StudentAuth: undefined;
};

const Stack = createNativeStackNavigator<AuthStackParamList>();

export default function AuthStack({ setIsAuthenticated }: { setIsAuthenticated: (val: boolean) => void }) {
  // Función para manejar la autenticación y registrar el método
  const handleAuthentication = async (value: boolean) => {
    if (value) {
      // Verificar el método de autenticación
      const authMethod = await AsyncStorage.getItem('authMethod');
      
      if (authMethod === 'token') {
        console.log('ACCESO CON TOKEN: Usuario autenticado con credenciales');
      } else if (authMethod === 'student') {
        console.log('ACCESO SIN TOKEN: Usuario accediendo como estudiante');
      } else if (authMethod === 'student_with_token') {
        console.log('ACCESO CON TOKEN DE ESTUDIANTE: Estudiante autenticado independientemente');
      } else if (authMethod === 'student_returning') {
        console.log('ACCESO SIN TOKEN: Estudiante que regresa');
      }
    }
    
    // Llamar a la función original
    setIsAuthenticated(value);
  };

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login">
        {(props) => <LoginScreen {...props} setIsAuthenticated={handleAuthentication} />}
      </Stack.Screen>
      <Stack.Screen name="Register">
        {(props) => <RegisterScreen {...props} setIsAuthenticated={handleAuthentication} />}
      </Stack.Screen>
      <Stack.Screen name="StudentAuth">
        {(props) => (
          <StudentAuthScreen 
            {...props} 
            setIsAuthenticated={handleAuthentication}
            onBack={() => props.navigation.goBack()}
          />
        )}
      </Stack.Screen>
    </Stack.Navigator>
  );
}