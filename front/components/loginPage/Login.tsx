import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage'; // Importar AsyncStorage para guardar el token

interface LoginProps {
  onNavigate: () => void;
  onLogin: () => void; // Se agrega para notificar inicio de sesión exitoso
}

const Login: React.FC<LoginProps> = ({ onNavigate, onLogin }) => {
  const [username, setUsername] = useState(''); // Nombre de usuario
  const [password, setPassword] = useState(''); // Contraseña
  const [showPassword, setShowPassword] = useState(false); // Estado para mostrar/ocultar contraseña
  const [errorMessage, setErrorMessage] = useState<string | null>(null); // Estado para el mensaje de error

  const handleLogin = async () => {
    try {
      const requestBody = {
        username, // Aquí se pasa el username
        password, // Aquí se pasa la contraseña
      };

      const response = await axios.post(
        'https://9l68voxzvc.execute-api.us-east-1.amazonaws.com/dev/user/login', // Endpoint del login
        requestBody,
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      console.log('Respuesta del servidor:', response.data);

      if (response.status === 200) {
        const { token } = response.data;

        // Guardar el token en AsyncStorage
        await AsyncStorage.setItem('userToken', token);
        console.log('JWT guardado en AsyncStorage:', token);

        setErrorMessage(null); // Limpiar mensaje de error
        onLogin(); // Notificar al componente principal que el login fue exitoso
        onNavigate(); // Llamar a la función de navegación para redirigir al usuario

      } else {
        handleErrorMessage('Usuario o contraseña incorrectos');
      }
    } catch (error: any) {
      console.error('Error al iniciar sesión:', error.response?.data || error.message);
      handleErrorMessage('Usuario o contraseña incorrectos');
    }
  };

  const handleErrorMessage = (message: string) => {
    setErrorMessage(message);
    setTimeout(() => {
      setErrorMessage(null);
    }, 5000);
  };

  return (
    <View style={styles.container}>
      {/* Círculos decorativos */}
      <View style={styles.circleLarge} />
      <View style={styles.circleSmallRed} />  {/* Círculo en la esquina inferior izquierda */}
      
      <Image
        source={require('../../assets/images/logo_login.png')} // Reemplaza con tu imagen
        style={styles.image}
      />
      <Text style={styles.title}>Iniciar Sesión</Text>

      <TextInput
        placeholder="Nombre de Usuario"
        style={styles.input}
        value={username}
        onChangeText={setUsername}
        placeholderTextColor="#999"
      />

      <View style={styles.passwordContainer}>
        <TextInput
          placeholder="Contraseña"
          style={styles.inputPassword}
          secureTextEntry={!showPassword}
          value={password}
          onChangeText={setPassword}
          placeholderTextColor="#999"
        />
        <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
          <Ionicons
            name={showPassword ? 'eye-off' : 'eye'}
            size={24}
            color="#999"
          />
        </TouchableOpacity>
      </View>

      {errorMessage && (
        <Text style={styles.errorText}>{errorMessage}</Text>
      )}

      <TouchableOpacity style={styles.button} onPress={handleLogin}>
        <Text style={styles.buttonText}>Iniciar Sesión</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={onNavigate}>
        <Text style={styles.text}>
          ¿No tienes cuenta? <Text style={styles.textHighlight}>Regístrate</Text>
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#FFF', // Color de fondo suave
  },
  // Círculo en la parte superior derecha
  circleLarge: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: '#FF8C00', // Naranja suave
    top: -80,
    right: -120,
  },
  // Círculo rojo en la esquina inferior izquierda
  circleSmallRed: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: '#FF8C00', // Rojo brillante
    bottom: -75, // Coloca el círculo en la esquina inferior izquierda
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
    color: '#333', // Título en negro
  },
  input: {
    width: 300,
    padding: 12,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#FF8C00', // Naranja suave
    borderRadius: 10,
    backgroundColor: '#F9F9F9',
  },
  passwordContainer: {
    width: 300,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FF8C00', // Naranja suave
    borderRadius: 10,
    backgroundColor: '#F9F9F9',
    padding: 3,
    marginBottom: 5,
  },
  inputPassword: {
    flex: 1,
    fontSize: 16,
  },
  errorText: {
    color: 'red',
    fontSize: 14,
    marginBottom: 10,
    textAlign: 'left',
    width: 300,
  },
  button: {
    backgroundColor: '#FF8C00', // Naranja suave
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
    color: '#FF8C00', // Naranja suave
    fontWeight: 'bold',
  },
});

export default Login;
