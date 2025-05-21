// screens/auth/LoginScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, Image, Alert,
  KeyboardAvoidingView, Platform, Keyboard, TouchableWithoutFeedback,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { DrawerNavigationProp } from '@react-navigation/drawer';
import { DrawerNavigatorParamList } from '../../navigation/DrawerNavigator';

type Navigation = DrawerNavigationProp<DrawerNavigatorParamList, 'Inicio'>;

type Props = {
  setIsAuthenticated: (val: boolean) => void;
};

export default function LoginScreen({ setIsAuthenticated }: Props) {
  const navigation = useNavigation<Navigation>();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleLogin = async () => {
    try {
      const response = await axios.post(
        'https://9l68voxzvc.execute-api.us-east-1.amazonaws.com/dev/user/login',
        { username, password },
        { headers: { 'Content-Type': 'application/json' } }
      );

      const { token } = response.data;
      await AsyncStorage.setItem('userToken', token);
      setIsAuthenticated(true);
      navigation.navigate('Inicio'); // Navega al Dashboard principal
    } catch (error: any) {
      console.error('Error al iniciar sesión:', error.response?.data || error.message);
      setErrorMessage('Usuario o contraseña incorrectos');
    }
  };

  // Nueva función para continuar como alumno
  const handleContinueAsStudent = () => {
    navigation.navigate('StudentDashboard'); // Navega a la pantalla del estudiante
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
              style={styles.input}
              value={username}
              onChangeText={setUsername}
            />

            <View style={styles.passwordContainer}>
              <TextInput
                placeholder="Contraseña"
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

            <TouchableOpacity style={styles.button} onPress={handleLogin}>
              <Text style={styles.buttonText}>Iniciar Sesión</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
              <Text style={styles.text}>
                ¿No tienes cuenta? <Text style={styles.textHighlight}>Regístrate</Text>
              </Text>
            </TouchableOpacity>

            {/* Botón de "Continuar como Alumno" */}
            <TouchableOpacity style={styles.button} onPress={handleContinueAsStudent}>
              <Text style={styles.buttonText}>Continuar como Alumno</Text>
            </TouchableOpacity>
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
});
