// screens/auth/LoginScreen.tsx
import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, Image,
  KeyboardAvoidingView, Platform, Keyboard, TouchableWithoutFeedback,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../../navigation/AuthStack';

type Navigation = NativeStackNavigationProp<AuthStackParamList, 'Login'>;

type Props = {
  navigation: Navigation;
  setIsAuthenticated: (val: boolean) => void;
};

export default function LoginScreen({ navigation, setIsAuthenticated }: Props) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    if (!username || !password) {
      setErrorMessage('Por favor ingrese usuario y contraseña');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const response = await axios.post(
        'https://9l68voxzvc.execute-api.us-east-1.amazonaws.com/dev/user/login',
        { username, password },
        { headers: { 'Content-Type': 'application/json' } }
      );

      const { token } = response.data;
      console.log('Token obtenido:', token);
      
      // Decodificar el token para obtener información del usuario
      let userRole = 'TEACHER'; // Rol por defecto
      let userId = null;
      let userInfo = null;
      
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        userRole = payload.role || 'TEACHER';
        userId = payload.id;
        userInfo = {
          id: payload.id,
          username: payload.username || username,
          role: userRole,
          loginMethod: 'credentials'
        };
        console.log('Información del usuario decodificada:', userInfo);
      } catch (decodeError) {
        console.warn('No se pudo decodificar el token, usando valores por defecto');
        userInfo = {
          username: username,
          role: 'TEACHER',
          loginMethod: 'credentials'
        };
      }
      
      // Guardar toda la información de autenticación
      await AsyncStorage.setItem('userToken', token);
      await AsyncStorage.setItem('authMethod', 'token');
      await AsyncStorage.setItem('userRole', userRole);
      await AsyncStorage.setItem('userInfo', JSON.stringify(userInfo));
      
      console.log('✅ Login exitoso como TEACHER con TOKEN');
      console.log('📋 Rol asignado:', userRole);
      console.log('👤 Usuario:', userInfo.username);
      
      setIsAuthenticated(true);
      
    } catch (error: any) {
      console.error('❌ Error al iniciar sesión:', error.response?.data || error.message);
      setErrorMessage('Usuario o contraseña incorrectos');
    } finally {
      setIsLoading(false);
    }
  };

  // Función para navegar a la autenticación de estudiantes
  const handleContinueAsStudent = () => {
    console.log('🎓 Navegando a autenticación de estudiante');
    navigation.navigate('StudentAuth');
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.keyboardView}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.container}>
          <View style={styles.circleLarge} />
          <View style={styles.circleSmallRed} />

          <View style={styles.formContainer}>
            <Image source={require('../../assets/images/logo_login.png')} style={styles.image} />
            <Text style={styles.title}>Iniciar Sesión</Text>

            <TextInput
              placeholder="Nombre de Usuario"
              placeholderTextColor="#999"          
              style={styles.input}
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
            />

            <View style={styles.passwordContainer}>
              <TextInput
                placeholder="Contraseña"
                placeholderTextColor="#999" 
                style={styles.inputPassword}
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={setPassword}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                <Ionicons name={showPassword ? 'eye-off' : 'eye'} size={24} color="#999" />
              </TouchableOpacity>
            </View>

            {errorMessage && <Text style={styles.errorText}>{errorMessage}</Text>}

            <TouchableOpacity 
              style={[styles.button, isLoading && styles.buttonDisabled]} 
              onPress={handleLogin}
              disabled={isLoading}
            >
              <Text style={styles.buttonText}>
                {isLoading ? 'Iniciando sesión...' : 'Iniciar Sesión como Profesor'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
              <Text style={styles.text}>
                ¿No tienes cuenta? <Text style={styles.textHighlight}>Regístrate como Profesor</Text>
              </Text>
            </TouchableOpacity>

            {/* Separador visual */}
            <View style={styles.separator}>
              <View style={styles.separatorLine} />
              <Text style={styles.separatorText}>O</Text>
              <View style={styles.separatorLine} />
            </View>

            {/* Botón de "Continuar como Alumno" */}
            <TouchableOpacity 
              style={[styles.studentButton]} 
              onPress={handleContinueAsStudent}
            >
              <Text style={styles.buttonText}>🎓 Continuar como Alumno</Text>
            </TouchableOpacity>
            <Text style={styles.studentNote}>
              *Acceso independiente para estudiantes
            </Text>
          </View>
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboardView: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  formContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  circleLarge: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: '#FF8C00',
    top: -80,
    right: -120,
  },
  circleSmallRed: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: '#FF8C00',
    bottom: -75,
    left: -100,
  },
  image: {
    width: 100,
    height: 120,
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 30,
    color: '#333',
  },
  input: {
    width: 300,
    padding: 12,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#FF8C00',
    borderRadius: 10,
    backgroundColor: '#F9F9F9',
    color: '#333',  // ← AGREGADO: Color del texto que escribes
  },
  passwordContainer: {
    width: 300,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FF8C00',
    borderRadius: 10,
    backgroundColor: '#F9F9F9',
    padding: 3,
    marginBottom: 5,
  },
  inputPassword: {
    color: '#333',  // ← YA ESTABA: Color del texto que escribes
    flex: 1,
    fontSize: 16,
    padding: 10,
  },
  errorText: {
    color: 'red',
    fontSize: 14,
    marginBottom: 10,
    width: 300,
    textAlign: 'left',
  },
  button: {
    backgroundColor: '#FF8C00',
    padding: 12,
    borderRadius: 10,
    width: 300,
    alignItems: 'center',
    marginTop: 10,
  },
  separator: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 300,
    marginVertical: 20,
  },
  separatorLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E0E0E0',
  },
  separatorText: {
    marginHorizontal: 15,
    color: '#999',
    fontSize: 14,
    fontWeight: '500',
  },
  studentButton: {
    backgroundColor: '#4CAF50',
    padding: 12,
    borderRadius: 10,
    width: 300,
    alignItems: 'center',
    marginTop: 5,
  },
  buttonDisabled: {
    backgroundColor: '#FFB366',
  },
  buttonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  text: {
    marginTop: 15,
    color: '#555',
    fontSize: 14,
  },
  textHighlight: {
    color: '#FF8C00',
    fontWeight: 'bold',
  },
  studentNote: {
    marginTop: 5,
    color: '#4CAF50',
    fontSize: 12,
    fontStyle: 'italic',
  },
});