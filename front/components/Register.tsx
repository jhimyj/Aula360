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

interface RegisterProps {
  onNavigate: () => void;
}

const Register: React.FC<RegisterProps> = ({ onNavigate }) => {
  const [name, setName] = useState<string>('');
  const [lastName, setLastName] = useState<string>('');
  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);

  const handleRegister = async (): Promise<void> => {
    if (!name || !lastName || !username || !password) {
      Alert.alert('Error', 'Por favor, complete todos los campos');
      return;
    }

    const requestBody = {
      name,
      last_name: lastName,
      username,
      password,
    };

    try {
      const response = await axios.post(
        'https://9l68voxzvc.execute-api.us-east-1.amazonaws.com/dev/user/register',
        requestBody,
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.status === 200) {
        Alert.alert('Registro Exitoso', response.data.message);
      } else {
        Alert.alert('Error', 'No se pudo registrar el usuario. Inténtalo de nuevo.');
      }
    } catch (error) {
      console.error('Error al registrar usuario:', error);
      Alert.alert('Error', 'No se pudo registrar el usuario. Inténtalo de nuevo.');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.circleLarge} />
      <Image source={require('../assets/images/register_imagen.png')} style={styles.image} />
      <Text style={styles.title}>Registrarse</Text>

      <TextInput
        placeholder="Nombre"
        style={styles.input}
        value={name}
        onChangeText={setName}
        placeholderTextColor="#999"
      />
      <TextInput
        placeholder="Apellido"
        style={styles.input}
        value={lastName}
        onChangeText={setLastName}
        placeholderTextColor="#999"
      />
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
          <Ionicons name={showPassword ? 'eye-off' : 'eye'} size={24} color="#999" />
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.button} onPress={handleRegister}>
        <Text style={styles.buttonText}>Crear Cuenta</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={onNavigate}>
        <Text style={styles.text}>
          ¿Ya tienes cuenta? <Text style={styles.textHighlight}>Inicia Sesión</Text>
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
    backgroundColor: '#FFF',
  },
  circleLarge: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: '#FF8C00',
    top: -100,
    right: -100,
  },
  image: {
    width: 90,
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

export default Register;
