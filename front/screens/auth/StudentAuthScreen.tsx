// screens/auth/StudentAuthScreen.tsx
import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, 
  Image, Alert, KeyboardAvoidingView, Platform, Animated, Modal
} from 'react-native';
import { Camera, CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

type Props = {
  setIsAuthenticated: (val: boolean) => void;
  onBack: () => void;
};

export default function StudentAuthScreen({ setIsAuthenticated, onBack }: Props) {
  const [step, setStep] = useState<'choice' | 'form'>('choice');
  const [isFirstTime, setIsFirstTime] = useState<boolean | null>(null);
  const [username, setUsername] = useState('');
  const [roomId, setRoomId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();

  React.useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
  }, []);

  const handleChoice = (firstTime: boolean) => {
    setIsFirstTime(firstTime);
    setStep('form');
  };

  const handleQRScan = async () => {
    if (!permission) {
      // Permisos aún no cargados
      return;
    }

    if (!permission.granted) {
      // Solicitar permisos
      const { granted } = await requestPermission();
      if (!granted) {
        Alert.alert(
          'Permisos de Cámara',
          'Necesitamos acceso a la cámara para escanear códigos QR'
        );
        return;
      }
    }

    setShowQRScanner(true);
  };

  const handleBarcodeScanned = ({ data }: { data: string }) => {
    console.log('QR escaneado:', data);
    
    // Extraer Room ID del QR (asumiendo que el QR contiene directamente el Room ID)
    // Si el QR tiene un formato específico, ajusta esta lógica
    let extractedRoomId = data;
    
    // Si el QR es una URL, extraer el Room ID
    if (data.includes('room_id=')) {
      const urlParams = new URLSearchParams(data.split('?')[1]);
      extractedRoomId = urlParams.get('room_id') || data;
    } else if (data.includes('/room/')) {
      // Si es formato /room/ROOM_ID
      extractedRoomId = data.split('/room/')[1] || data;
    }
    
    setRoomId(extractedRoomId);
    setShowQRScanner(false);
    
    Alert.alert(
      '¡QR Escaneado!',
      `Room ID detectado: ${extractedRoomId}`,
      [{ text: 'OK' }]
    );
  };

  const createStudent = async (roomId: string, username: string) => {
    try {
      console.log('CREANDO ESTUDIANTE - Primera vez');
      const response = await axios.post(
        'https://iza2ya8d9j.execute-api.us-east-1.amazonaws.com/dev/students/create',
        {
          room_id: roomId,
          username: username,
          data: {}
        },
        {
          headers: { 'Content-Type': 'application/json' }
        }
      );
      console.log('Estudiante creado exitosamente:', response.data);
      
      // Extraer el token del endpoint de creación
      const token = response.data?.data?.token;
      if (token) {
        console.log('Token obtenido del create:', token);
        
        // Guardar token y datos del estudiante
        await AsyncStorage.setItem('studentToken', token);
        await AsyncStorage.setItem('studentData', JSON.stringify({
          username,
          room_id: roomId,
          created_at: new Date().toISOString(),
          isFirstTime: true,
          studentId: response.data?.data?.id
        }));
        await AsyncStorage.setItem('authMethod', 'student_with_token');
        
        return { success: true, token, message: response.data?.message };
      }
      
      return { success: true, token: null, message: response.data?.message };
    } catch (error: any) {
      console.error('Error al crear estudiante:', error.response?.data || error.message);
      
      // Usar el mensaje exacto del endpoint
      const apiMessage = error.response?.data?.message || error.response?.data?.error;
      throw new Error(apiMessage || 'Error desconocido al crear estudiante');
    }
  };

  const loginStudent = async (roomId: string, username: string) => {
    try {
      console.log('OBTENIENDO TOKEN - Login de estudiante');
      const response = await axios.post(
        'https://iza2ya8d9j.execute-api.us-east-1.amazonaws.com/dev/students/login',
        {
          room_id: roomId,
          username: username
        },
        {
          headers: { 'Content-Type': 'application/json' }
        }
      );
      
      console.log('Respuesta completa del login:', response.data);
      
      // Verificar diferentes posibles ubicaciones del token
      const token = response.data?.token || response.data?.data?.token;
      
      if (!token) {
        console.error('Token no encontrado en la respuesta:', response.data);
        const apiMessage = response.data?.message || 'Token no encontrado en la respuesta';
        throw new Error(apiMessage);
      }
      
      console.log('Token obtenido exitosamente:', token);
      
      // Guardar token y datos del estudiante
      await AsyncStorage.setItem('studentToken', token);
      await AsyncStorage.setItem('studentData', JSON.stringify({
        username,
        room_id: roomId,
        created_at: new Date().toISOString(),
        isFirstTime: false
      }));
      await AsyncStorage.setItem('authMethod', 'student_with_token');
      
      return { token, message: response.data?.message };
    } catch (error: any) {
      console.error('Error al hacer login:', error.response?.data || error.message);
      
      // Usar el mensaje exacto del endpoint
      const apiMessage = error.response?.data?.message || error.response?.data?.error;
      throw new Error(apiMessage || 'Error desconocido al hacer login');
    }
  };

  const handleSubmit = async () => {
    if (!username.trim() || !roomId.trim()) {
      Alert.alert('Error', 'Por favor completa todos los campos');
      return;
    }

    setIsLoading(true);
    try {
      if (isFirstTime) {
        // Primera vez: Crear estudiante (ya incluye el token)
        const createResult = await createStudent(roomId, username);
        
        if (createResult.token) {
          console.log('FLUJO PRIMERA VEZ COMPLETADO - Estudiante creado con token');
          Alert.alert('¡Éxito!', createResult.message || 'Cuenta creada exitosamente');
        } else {
          // Si no hay token en create, intentar login
          await loginStudent(roomId, username);
          console.log('FLUJO PRIMERA VEZ COMPLETADO - Estudiante creado y token obtenido via login');
        }
      } else {
        // No es primera vez: Solo Login
        const loginResult = await loginStudent(roomId, username);
        console.log('FLUJO ESTUDIANTE EXISTENTE COMPLETADO - Token obtenido');
        Alert.alert('¡Bienvenido!', loginResult.message || 'Sesión iniciada exitosamente');
      }
      
      setIsAuthenticated(true);
      
    } catch (error: any) {
      // Mostrar el mensaje exacto del API
      Alert.alert('Error', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (step === 'choice') {
    return (
      <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
        {/* Imagen arriba */}
        <View style={styles.imageSection}>
          <Image 
            source={require('../../assets/images/Student-Inicio.png')}
            style={styles.teacherImage}
            resizeMode="contain"
            />
        </View>

        {/* Modal de elección abajo */}
        <View style={styles.modalSection}>
          <View style={styles.choiceModal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>¡Bienvenido Estudiante! 🎓</Text>
              <Text style={styles.modalSubtitle}>
                Para comenzar, necesitamos saber si es tu primera vez aquí
              </Text>
            </View>

            <View style={styles.choiceButtons}>
              <TouchableOpacity 
                style={styles.firstTimeButton} 
                onPress={() => handleChoice(true)}
              >
                <View style={styles.buttonContent}>
                  <Text style={styles.buttonEmoji}>🆕</Text>
                  <Text style={styles.buttonTitle}>Sí, es mi primera vez</Text>
                  <Text style={styles.buttonSubtext}>Crear nueva cuenta</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.returningButton} 
                onPress={() => handleChoice(false)}
              >
                <View style={styles.buttonContent}>
                  <Text style={styles.buttonEmoji}>👋</Text>
                  <Text style={styles.buttonTitle}>No, ya tengo cuenta</Text>
                  <Text style={styles.buttonSubtext}>Iniciar sesión</Text>
                </View>
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.backLink} onPress={onBack}>
              <Text style={styles.backText}>← Volver al inicio</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Animated.View>
    );
  }

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined} 
      style={styles.container}
    >
      {/* Imagen arriba */}
      <View style={styles.imageSection}>
        <Image 
          source={require('../../assets/images/Student-Inicio.png')}
          style={styles.teacherImage}
          resizeMode="contain"
        />
      </View>

      {/* Modal de formulario abajo */}
      <View style={styles.modalSection}>
        <View style={styles.formModal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {isFirstTime ? '¡Crear tu cuenta! 🎯' : '¡Bienvenido de vuelta! 👋'}
            </Text>
            <Text style={styles.modalSubtitle}>
              {isFirstTime 
                ? 'Ingresa tus datos para crear tu cuenta de estudiante'
                : 'Ingresa tus datos para acceder a tu cuenta'
              }
            </Text>
          </View>

          <View style={styles.formContent}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>👤 Nombre de Usuario</Text>
              <TextInput
                style={styles.input}
                placeholder="Ej: juan_perez"
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
                placeholderTextColor="#A0A0A0"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>🏠 Room ID</Text>
              <View style={styles.roomInputContainer}>
                <TextInput
                  style={styles.roomInput}
                  placeholder="Código proporcionado por tu profesor"
                  value={roomId}
                  onChangeText={setRoomId}
                  autoCapitalize="none"
                  placeholderTextColor="#A0A0A0"
                />
                <TouchableOpacity 
                  style={styles.qrButton}
                  onPress={handleQRScan}
                >
                  <Ionicons name="qr-code" size={24} color="#059669" />
                </TouchableOpacity>
              </View>
              <Text style={styles.qrHint}>💡 Toca el ícono QR para escanear el código</Text>
            </View>

            <TouchableOpacity 
              style={[styles.submitButton, isLoading && styles.submitButtonDisabled]} 
              onPress={handleSubmit}
              disabled={isLoading}
            >
              <Text style={styles.submitButtonText}>
                {isLoading 
                  ? (isFirstTime ? 'Creando cuenta...' : 'Iniciando sesión...') 
                  : (isFirstTime ? '🚀 Crear Cuenta' : '🔑 Iniciar Sesión')
                }
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.changeChoiceButton} 
              onPress={() => setStep('choice')}
            >
              <Text style={styles.changeChoiceText}>
                {isFirstTime ? '¿Ya tienes cuenta?' : '¿Primera vez aquí?'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Modal del Escáner QR */}
      <Modal
        visible={showQRScanner}
        animationType="slide"
        presentationStyle="fullScreen"
      >
        <View style={styles.qrScannerContainer}>
          <View style={styles.qrHeader}>
            <TouchableOpacity 
              style={styles.closeButton}
              onPress={() => setShowQRScanner(false)}
            >
              <Ionicons name="close" size={30} color="#FFF" />
            </TouchableOpacity>
            <Text style={styles.qrTitle}>Escanear Código QR</Text>
            <View style={styles.placeholder} />
          </View>

          <CameraView
            style={styles.camera}
            facing="back"
            onBarcodeScanned={handleBarcodeScanned}
            barcodeScannerSettings={{
              barcodeTypes: ['qr'],
            }}
          >
            <View style={styles.scannerOverlay}>
              <View style={styles.scannerFrame}>
                <View style={[styles.corner, styles.topLeft]} />
                <View style={[styles.corner, styles.topRight]} />
                <View style={[styles.corner, styles.bottomLeft]} />
                <View style={[styles.corner, styles.bottomRight]} />
              </View>
              <Text style={styles.scannerText}>
                Apunta la cámara hacia el código QR
              </Text>
            </View>
          </CameraView>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  imageSection: {
    flex: 0.4,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 60,
  },
  teacherImage: {
    width: 200,
    height: 200,
  },
  modalSection: {
    flex: 0.6,
    justifyContent: 'flex-end',
    paddingHorizontal: 20,
    paddingBottom: 82,
  },
  choiceModal: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
    borderTopWidth: 4,
    borderTopColor: '#4F46E5',
  },
  formModal: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
    borderTopWidth: 4,
    borderTopColor: '#059669',
  },
  modalHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 22,
  },
  choiceButtons: {
    gap: 16,
    marginBottom: 24,
  },
  firstTimeButton: {
    backgroundColor: '#EEF2FF',
    borderRadius: 16,
    padding: 20,
    borderWidth: 2,
    borderColor: '#C7D2FE',
  },
  returningButton: {
    backgroundColor: '#F0FDF4',
    borderRadius: 16,
    padding: 20,
    borderWidth: 2,
    borderColor: '#BBF7D0',
  },
  buttonContent: {
    alignItems: 'center',
  },
  buttonEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  buttonTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  buttonSubtext: {
    fontSize: 14,
    color: '#6B7280',
  },
  formContent: {
    gap: 20,
  },
  inputGroup: {
    gap: 8,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  input: {
    backgroundColor: '#F9FAFB',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#1F2937',
  },
  roomInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  roomInput: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#1F2937',
  },
  qrButton: {
    backgroundColor: '#F0FDF4',
    borderWidth: 2,
    borderColor: '#059669',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qrHint: {
    fontSize: 12,
    color: '#059669',
    fontStyle: 'italic',
  },
  submitButton: {
    backgroundColor: '#059669',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  submitButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  changeChoiceButton: {
    alignItems: 'center',
    padding: 8,
  },
  changeChoiceText: {
    color: '#6366F1',
    fontSize: 16,
    fontWeight: '500',
  },
  backLink: {
    alignItems: 'center',
    padding: 8,
  },
  backText: {
    color: '#6B7280',
    fontSize: 14,
  },
  // Estilos del Escáner QR
  qrScannerContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  qrHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: 'rgba(0,0,0,0.8)',
  },
  closeButton: {
    padding: 8,
  },
  qrTitle: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '600',
  },
  placeholder: {
    width: 46,
  },
  camera: {
    flex: 1,
  },
  scannerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scannerFrame: {
    width: 250,
    height: 250,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderColor: '#059669',
    borderWidth: 4,
  },
  topLeft: {
    top: 0,
    left: 0,
    borderRightWidth: 0,
    borderBottomWidth: 0,
  },
  topRight: {
    top: 0,
    right: 0,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderRightWidth: 0,
    borderTopWidth: 0,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderLeftWidth: 0,
    borderTopWidth: 0,
  },
  scannerText: {
    color: '#FFF',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 30,
    paddingHorizontal: 40,
  },
});