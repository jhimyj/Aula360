import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  TouchableWithoutFeedback,
  ScrollView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../../navigation/AuthStack';

type Props = {
  setIsAuthenticated: (val: boolean) => void;
};

type Navigation = NativeStackNavigationProp<AuthStackParamList, 'Register'>;

export default function RegisterScreen({ setIsAuthenticated }: Props) {
  const navigation = useNavigation<Navigation>();

  const [name, setName] = useState('');
  const [lastName, setLastName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [keyboardVisible, setKeyboardVisible] = useState(false);

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      'keyboardDidShow',
      () => {
        setKeyboardVisible(true);
      }
    );
    const keyboardDidHideListener = Keyboard.addListener(
      'keyboardDidHide',
      () => {
        setKeyboardVisible(false);
      }
    );

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  const handleRegister = async () => {
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
    console.log(requestBody)

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
      console.log(' Respuesta de la API:', response.data);
      if (response.status === 200) {
        Alert.alert(
            'Registro exitoso',
            response.data.message || 'Usuario creado correctamente',
            [
              {
                text: 'Iniciar sesión',
                onPress: () => navigation.navigate('Login'),
              },
            ]
          );
      } else {
        Alert.alert('Error', 'No se pudo registrar el usuario. Inténtalo de nuevo.');
      }
    } catch (error) {
      console.error('Error al registrar usuario:', error);
      Alert.alert('Error', 'No se pudo registrar el usuario. Inténtalo de nuevo.');
    }
  };

  const dismissKeyboard = () => {
    Keyboard.dismiss();
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.keyboardView}
    >
      <TouchableWithoutFeedback onPress={dismissKeyboard}>
        <ScrollView 
          contentContainerStyle={styles.scrollContainer}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.container}>
            <View style={styles.circleLarge} />
            
            <View style={[
              styles.formContainer, 
              keyboardVisible && Platform.OS === 'android' ? { marginTop: -250 } : {}
            ]}>
              <Image source={require('../../assets/images/register_imagen.png')} style={styles.image} />
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

              <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                <Text style={styles.text}>
                  ¿Ya tienes cuenta? <Text style={styles.textHighlight}>Inicia Sesión</Text>
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboardView: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
  },
  container: {
    flex: 1,
    backgroundColor: '#FFF',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  formContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    paddingVertical: 20,
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
    marginBottom: 15,
  },
  inputPassword: {
    flex: 1,
    fontSize: 16,
    padding: 10,
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