"use client"

import React, { useState, useEffect } from "react"
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
  Animated,
  Modal,
  Dimensions,
} from "react-native"
import { CameraView, useCameraPermissions } from "expo-camera"
import { Ionicons } from "@expo/vector-icons"
import axios from "axios"
import AsyncStorage from "@react-native-async-storage/async-storage"
import MissionScreen from "../Students/StudentDashboardScreen"

// Obtener dimensiones de pantalla y detectar tipo de dispositivo
const { width: screenWidth, height: screenHeight } = Dimensions.get("window")
const isTablet = screenWidth >= 768
const isLargeTablet = screenWidth >= 1024

type Props = {
  setIsAuthenticated: (val: boolean) => void
  onBack: () => void
}

export default function StudentAuthScreen({ setIsAuthenticated, onBack }: Props) {
  const [step, setStep] = useState<"choice" | "form">("choice")
  const [isFirstTime, setIsFirstTime] = useState<boolean | null>(null)
  const [username, setUsername] = useState("")
  const [roomId, setRoomId] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [fadeAnim] = useState(new Animated.Value(0))
  const [showQRScanner, setShowQRScanner] = useState(false)
  const [permission, requestPermission] = useCameraPermissions()
  const [dimensions, setDimensions] = useState(Dimensions.get("window"))

  // 🎯 NUEVO ESTADO PARA MOSTRAR MISSIONSCREEN
  const [showMissionScreen, setShowMissionScreen] = useState(false)

  // Escuchar cambios en las dimensiones de pantalla
  useEffect(() => {
    const subscription = Dimensions.addEventListener("change", ({ window }) => {
      setDimensions(window)
    })
    return () => subscription?.remove()
  }, [])

  // Calcular si es tablet basado en las dimensiones actuales
  const currentIsTablet = dimensions.width >= 768
  const currentIsLargeTablet = dimensions.width >= 1024

  React.useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start()
  }, [])

  const handleChoice = (firstTime: boolean) => {
    setIsFirstTime(firstTime)
    setStep("form")
  }

  const handleQRScan = async () => {
    if (!permission) {
      return
    }

    if (!permission.granted) {
      const { granted } = await requestPermission()
      if (!granted) {
        Alert.alert("Permisos de Cámara", "Necesitamos acceso a la cámara para escanear códigos QR")
        return
      }
    }

    setShowQRScanner(true)
  }

  const handleBarcodeScanned = ({ data }: { data: string }) => {
    console.log("QR escaneado:", data)

    let extractedRoomId = data

    if (data.includes("room_id=")) {
      const urlParams = new URLSearchParams(data.split("?")[1])
      extractedRoomId = urlParams.get("room_id") || data
    } else if (data.includes("/room/")) {
      extractedRoomId = data.split("/room/")[1] || data
    }

    setRoomId(extractedRoomId)
    setShowQRScanner(false)

    Alert.alert("¡QR Escaneado!", `Room ID detectado: ${extractedRoomId}`, [{ text: "OK" }])
  }

  const createStudent = async (roomId: string, username: string) => {
    try {
      console.log("🎓 CREANDO ESTUDIANTE - Primera vez")
      const response = await axios.post(
        "https://iza2ya8d9j.execute-api.us-east-1.amazonaws.com/dev/students/create",
        {
          room_id: roomId,
          username: username,
          data: {},
        },
        {
          headers: { "Content-Type": "application/json" },
        },
      )
      console.log("✅ Estudiante creado exitosamente:", response.data)

      const token = response.data?.data?.token
      if (token) {
        console.log("🔑 Token obtenido del create:", token)

        // 🎯 INFORMACIÓN COMPLETA DEL ESTUDIANTE CON ROL
        const studentInfo = {
          id: response.data?.data?.id,
          username: username,
          room_id: roomId,
          role: "STUDENT", // 🎯 ROL ASIGNADO EXPLÍCITAMENTE
          loginMethod: "student_create",
          created_at: new Date().toISOString(),
          isFirstTime: true,
          studentId: response.data?.data?.id,
          authType: "student",
        }

        // 🎯 GUARDAR TODA LA INFORMACIÓN DE ROL
        await AsyncStorage.setItem("studentToken", token)
        await AsyncStorage.setItem("studentData", JSON.stringify(studentInfo))
        await AsyncStorage.setItem("authMethod", "student_with_token")
        await AsyncStorage.setItem("userRole", "STUDENT") // 🎯 ROL PRINCIPAL
        await AsyncStorage.setItem("userInfo", JSON.stringify(studentInfo)) // 🎯 INFO COMPLETA
        await AsyncStorage.setItem('roomId', studentInfo.room_id);

        // 🎯 ASIGNAR PERSONAJE POR DEFECTO PARA MISIONES
        await AsyncStorage.setItem("selectedCharacterName", "Qhapaq")

        console.log("📋 Información del estudiante guardada:")
        console.log("- Rol:", "STUDENT")
        console.log("- Username:", username)
        console.log("- Room ID:", roomId)
        console.log("- Método de login:", "student_create")
        console.log("- Student ID:", response.data?.data?.id)
        console.log("- Personaje asignado:", "Qhapaq")

        return { success: true, token, message: response.data?.message }
      }

      return { success: true, token: null, message: response.data?.message }
    } catch (error: any) {
      console.error("❌ Error al crear estudiante:", error.response?.data || error.message)

      const apiMessage = error.response?.data?.message || error.response?.data?.error
      throw new Error(apiMessage || "Error desconocido al crear estudiante")
    }
  }

  const loginStudent = async (roomId: string, username: string) => {
    try {
      console.log("🎓 LOGIN DE ESTUDIANTE - Usuario existente")
      const response = await axios.post(
        "https://iza2ya8d9j.execute-api.us-east-1.amazonaws.com/dev/students/login",
        {
          room_id: roomId,
          username: username,
        },
        {
          headers: { "Content-Type": "application/json" },
        },
      )

      console.log("✅ Respuesta completa del login:", response.data)

      const token = response.data?.token || response.data?.data?.token

      if (!token) {
        console.error("❌ Token no encontrado en la respuesta:", response.data)
        const apiMessage = response.data?.message || "Token no encontrado en la respuesta"
        throw new Error(apiMessage)
      }

      console.log("🔑 Token obtenido exitosamente:", token)

      // 🎯 INFORMACIÓN COMPLETA DEL ESTUDIANTE CON ROL
      const studentInfo = {
        username: username,
        room_id: roomId,
        role: "STUDENT", // 🎯 ROL ASIGNADO EXPLÍCITAMENTE
        loginMethod: "student_login",
        created_at: new Date().toISOString(),
        isFirstTime: false,
        authType: "student",
      }

      // 🎯 GUARDAR TODA LA INFORMACIÓN DE ROL
      await AsyncStorage.setItem("studentToken", token)
      await AsyncStorage.setItem("studentData", JSON.stringify(studentInfo))
      await AsyncStorage.setItem("authMethod", "student_with_token")
      await AsyncStorage.setItem("userRole", "STUDENT") // 🎯 ROL PRINCIPAL
      await AsyncStorage.setItem("userInfo", JSON.stringify(studentInfo)) // 🎯 INFO COMPLETA
      await AsyncStorage.setItem("roomId", roomId) // 🔥 AGREGAR ESTA LÍNEA
      // 🎯 ASIGNAR PERSONAJE POR DEFECTO SI NO EXISTE
      const existingCharacter = await AsyncStorage.getItem("selectedCharacterName")
      if (!existingCharacter) {
        await AsyncStorage.setItem("selectedCharacterName", "Amaru")
        console.log("- Personaje asignado:", "Amaru")
      }
    
      console.log("📋 Información del estudiante guardada:")
      console.log("- Rol:", "STUDENT")
      console.log("- Username:", username)
      console.log("- Room ID:", roomId)
      console.log("- Método de login:", "student_login")

      return { token, message: response.data?.message }
    } catch (error: any) {
      console.error("❌ Error al hacer login:", error.response?.data || error.message)

      const apiMessage = error.response?.data?.message || error.response?.data?.error
      throw new Error(apiMessage || "Error desconocido al hacer login")
    }
  }

  const handleSubmit = async () => {
    if (!username.trim() || !roomId.trim()) {
      Alert.alert("Error", "Por favor completa todos los campos")
      return
    }

    setIsLoading(true)
    try {
      if (isFirstTime) {
        const createResult = await createStudent(roomId, username)

        if (createResult.token) {
          console.log("✅ FLUJO PRIMERA VEZ COMPLETADO - Estudiante creado con token")
          Alert.alert(
            "¡Cuenta creada! 🎓",
            `¡Hola ${username}! Tu cuenta de estudiante ha sido creada exitosamente. ¡Prepárate para tu primera misión!`,
            [
              {
                text: "OK",
                onPress: () => {
                  // 🎯 MOSTRAR MISSIONSCREEN INMEDIATAMENTE
                  console.log("🎮 Mostrando MissionScreen después de crear cuenta")
                  setShowMissionScreen(true)
                },
              },
            ],
          )
        } else {
          await loginStudent(roomId, username)
          console.log("✅ FLUJO PRIMERA VEZ COMPLETADO - Estudiante creado y token obtenido via login")
          // 🎯 MOSTRAR MISSIONSCREEN INMEDIATAMENTE
          console.log("🎮 Mostrando MissionScreen después de login fallback")
          setShowMissionScreen(true)
        }
      } else {
        const loginResult = await loginStudent(roomId, username)
        console.log("✅ FLUJO ESTUDIANTE EXISTENTE COMPLETADO - Token obtenido")
        Alert.alert(
          "¡Bienvenido de vuelta! 👋",
          `¡Hola ${username}! Has iniciado sesión exitosamente. ¡Continúa con tus misiones!`,
          [
            {
              text: "OK",
              onPress: () => {
                // 🎯 MOSTRAR MISSIONSCREEN INMEDIATAMENTE
                console.log("🎮 Mostrando MissionScreen después de login existente")
                setShowMissionScreen(true)
              },
            },
          ],
        )
      }
    } catch (error: any) {
      console.error("💥 Error en handleSubmit:", error)
      Alert.alert("Error", error.message)
    } finally {
      setIsLoading(false)
    }
  }

  // 🎯 FUNCIÓN PARA MANEJAR EL CIERRE DEL MISSIONSCREEN
  const handleCloseMissionScreen = () => {
    console.log("🚪 Cerrando MissionScreen y yendo al dashboard principal")
    setShowMissionScreen(false)
    // Ahora sí ir al dashboard principal
    setIsAuthenticated(true)
  }

  // 🎯 FUNCIÓN PARA MANEJAR EL INICIO DE MISIÓN
  const handleStartMission = () => {
    console.log("🚀 Iniciando misión desde StudentAuthScreen")
    setShowMissionScreen(false)
    // Ir al dashboard principal después de iniciar misión
    setIsAuthenticated(true)
  }

  // 🎯 SI ESTÁ MOSTRANDO MISSIONSCREEN, RENDERIZAR ESO
  if (showMissionScreen) {
    return <MissionScreen visible={true} onClose={handleCloseMissionScreen} onStartMission={handleStartMission} />
  }

  if (step === "choice") {
    return (
      <View style={styles.container}>
        {/* Imagen superior - ocupa más espacio */}
        <View style={[styles.imageSection, currentIsTablet && styles.imageSectionTablet]}>
          <Image
            source={require("../../assets/images/Cuenta-inicio.png")}
            style={[styles.heroImage, currentIsTablet && styles.heroImageTablet]}
            resizeMode="contain"
          />
        </View>

        {/* Modal inferior */}
        <View style={[styles.modalSection, currentIsTablet && styles.modalSectionTablet]}>
          <Animated.View
            style={[styles.choiceModal, currentIsTablet && styles.choiceModalTablet, { opacity: fadeAnim }]}
          >
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, currentIsTablet && styles.modalTitleTablet]}>
                ¡Bienvenido Estudiante! 🎓
              </Text>
              <Text style={[styles.modalSubtitle, currentIsTablet && styles.modalSubtitleTablet]}>
                Para comenzar, necesitamos saber si es tu primera vez aquí
              </Text>
            </View>

            <View style={[styles.choiceButtons, currentIsTablet && styles.choiceButtonsTablet]}>
              <TouchableOpacity
                style={[styles.firstTimeButton, currentIsTablet && styles.choiceButtonTablet]}
                onPress={() => handleChoice(true)}
              >
                <View style={styles.buttonContent}>
                  <Text style={[styles.buttonEmoji, currentIsTablet && styles.buttonEmojiTablet]}>🆕</Text>
                  <Text style={[styles.buttonTitle, currentIsTablet && styles.buttonTitleTablet]}>
                    Sí, es mi primera vez
                  </Text>
                  <Text style={[styles.buttonSubtext, currentIsTablet && styles.buttonSubtextTablet]}>
                    Crear nueva cuenta de estudiante
                  </Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.returningButton, currentIsTablet && styles.choiceButtonTablet]}
                onPress={() => handleChoice(false)}
              >
                <View style={styles.buttonContent}>
                  <Text style={[styles.buttonEmoji, currentIsTablet && styles.buttonEmojiTablet]}>👋</Text>
                  <Text style={[styles.buttonTitle, currentIsTablet && styles.buttonTitleTablet]}>
                    No, ya tengo cuenta
                  </Text>
                  <Text style={[styles.buttonSubtext, currentIsTablet && styles.buttonSubtextTablet]}>
                    Iniciar sesión como estudiante
                  </Text>
                </View>
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={[styles.backLink, currentIsTablet && styles.backLinkTablet]} onPress={onBack}>
              <Text style={[styles.backText, currentIsTablet && styles.backTextTablet]}>← Volver al inicio</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      {/* Imagen superior - ocupa más espacio */}
      <View style={[styles.imageSection, currentIsTablet && styles.imageSectionTablet]}>
        <Image
          source={require("../../assets/images/Cuenta-inicio.png")}
          style={[styles.heroImage, currentIsTablet && styles.heroImageTablet]}
          resizeMode="contain"
        />
      </View>

      {/* Modal inferior */}
      <View style={[styles.modalSection, currentIsTablet && styles.modalSectionTablet]}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.keyboardView}>
          <Animated.View style={[styles.formModal, currentIsTablet && styles.formModalTablet, { opacity: fadeAnim }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, currentIsTablet && styles.modalTitleTablet]}>
                {isFirstTime ? "¡Crear tu cuenta! 🎯" : "¡Bienvenido de vuelta! 👋"}
              </Text>
              <Text style={[styles.modalSubtitle, currentIsTablet && styles.modalSubtitleTablet]}>
                {isFirstTime
                  ? "Ingresa tus datos para crear tu cuenta de estudiante"
                  : "Ingresa tus datos para acceder a tu cuenta"}
              </Text>
            </View>

            <View style={[styles.formContent, currentIsTablet && styles.formContentTablet]}>
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, currentIsTablet && styles.inputLabelTablet]}>
                  👤 Nombre de Usuario
                </Text>
                <TextInput
                  style={[styles.input, currentIsTablet && styles.inputTablet]}
                  placeholder="Ej: juan_perez"
                  value={username}
                  onChangeText={setUsername}
                  autoCapitalize="none"
                  placeholderTextColor="#A0A0A0"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, currentIsTablet && styles.inputLabelTablet]}>🏠 Room ID</Text>
                <View style={[styles.roomInputContainer, currentIsTablet && styles.roomInputContainerTablet]}>
                  <TextInput
                    style={[styles.roomInput, currentIsTablet && styles.inputTablet]}
                    placeholder="Código proporcionado por tu profesor"
                    value={roomId}
                    onChangeText={setRoomId}
                    autoCapitalize="none"
                    placeholderTextColor="#A0A0A0"
                  />
                  <TouchableOpacity
                    style={[styles.qrButton, currentIsTablet && styles.qrButtonTablet]}
                    onPress={handleQRScan}
                  >
                    <Ionicons name="qr-code" size={currentIsTablet ? 28 : 24} color="#059669" />
                  </TouchableOpacity>
                </View>
                <Text style={[styles.qrHint, currentIsTablet && styles.qrHintTablet]}>
                  💡 Toca el ícono QR para escanear el código
                </Text>
              </View>

              <TouchableOpacity
                style={[
                  styles.submitButton,
                  currentIsTablet && styles.submitButtonTablet,
                  isLoading && styles.submitButtonDisabled,
                ]}
                onPress={handleSubmit}
                disabled={isLoading}
              >
                <Text style={[styles.submitButtonText, currentIsTablet && styles.submitButtonTextTablet]}>
                  {isLoading
                    ? isFirstTime
                      ? "Creando cuenta..."
                      : "Iniciando sesión..."
                    : isFirstTime
                      ? "🚀 Crear Cuenta de Estudiante"
                      : "🔑 Iniciar Sesión como Estudiante"}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.changeChoiceButton, currentIsTablet && styles.changeChoiceButtonTablet]}
                onPress={() => setStep("choice")}
              >
                <Text style={[styles.changeChoiceText, currentIsTablet && styles.changeChoiceTextTablet]}>
                  {isFirstTime ? "¿Ya tienes cuenta?" : "¿Primera vez aquí?"}
                </Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </KeyboardAvoidingView>
      </View>

      {/* Modal del Escáner QR */}
      <Modal visible={showQRScanner} animationType="slide" presentationStyle="fullScreen">
        <View style={styles.qrScannerContainer}>
          <View style={[styles.qrHeader, currentIsTablet && styles.qrHeaderTablet]}>
            <TouchableOpacity
              style={[styles.closeButton, currentIsTablet && styles.closeButtonTablet]}
              onPress={() => setShowQRScanner(false)}
            >
              <Ionicons name="close" size={currentIsTablet ? 40 : 30} color="#FFF" />
            </TouchableOpacity>
            <Text style={[styles.qrTitle, currentIsTablet && styles.qrTitleTablet]}>Escanear Código QR</Text>
            <View style={styles.placeholder} />
          </View>

          <CameraView
            style={styles.camera}
            facing="back"
            onBarcodeScanned={handleBarcodeScanned}
            barcodeScannerSettings={{
              barcodeTypes: ["qr"],
            }}
          >
            <View style={styles.scannerOverlay}>
              <View style={[styles.scannerFrame, currentIsTablet && styles.scannerFrameTablet]}>
                <View style={[styles.corner, styles.topLeft]} />
                <View style={[styles.corner, styles.topRight]} />
                <View style={[styles.corner, styles.bottomLeft]} />
                <View style={[styles.corner, styles.bottomRight]} />
              </View>
              <Text style={[styles.scannerText, currentIsTablet && styles.scannerTextTablet]}>
                Apunta la cámara hacia el código QR
              </Text>
            </View>
          </CameraView>
        </View>
      </Modal>
    </View>
  )
}

// Los estilos permanecen exactamente iguales
const styles = StyleSheet.create({
  // Layout principal
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },

  // Sección de imagen - MÁS ESPACIO COMO EN LA IMAGEN
  imageSection: {
    flex: 0.55, // Más espacio para la imagen
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 40,
    paddingHorizontal: 20,
  },

  // Imagen hero - tamaño como en el diseño
  heroImage: {
    width: screenWidth * 0.6, // 60% del ancho de pantalla
    height: screenWidth * 0.6,
    maxWidth: 280,
    maxHeight: 280,
  },

  // Sección modal - MENOS ESPACIO, POSICIONADO ABAJO
  modalSection: {
    flex: 0.45, // Menos espacio para el modal
    justifyContent: "flex-end",
    paddingHorizontal: 20,
    paddingBottom: 40,
  },

  keyboardView: {
    flex: 1,
    justifyContent: "flex-end",
  },

  // Modales - diseño como en la imagen
  choiceModal: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 12,
    borderTopWidth: 4,
    borderTopColor: "#4F46E5",
  },

  formModal: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 12,
    borderTopWidth: 4,
    borderTopColor: "#059669",
  },

  // Headers
  modalHeader: {
    alignItems: "center",
    marginBottom: 24,
  },

  modalTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#1F2937",
    marginBottom: 8,
    textAlign: "center",
  },

  modalSubtitle: {
    fontSize: 15,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 20,
  },

  // Botones de elección
  choiceButtons: {
    gap: 16,
    marginBottom: 24,
  },

  firstTimeButton: {
    backgroundColor: "#EEF2FF",
    borderRadius: 16,
    padding: 20,
    borderWidth: 2,
    borderColor: "#C7D2FE",
  },

  returningButton: {
    backgroundColor: "#F0FDF4",
    borderRadius: 16,
    padding: 20,
    borderWidth: 2,
    borderColor: "#BBF7D0",
  },

  buttonContent: {
    alignItems: "center",
  },

  buttonEmoji: {
    fontSize: 28,
    marginBottom: 8,
  },

  buttonTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1F2937",
    marginBottom: 4,
  },

  buttonSubtext: {
    fontSize: 13,
    color: "#6B7280",
  },

  // Formulario
  formContent: {
    gap: 18,
  },

  inputGroup: {
    gap: 8,
  },

  inputLabel: {
    fontSize: 15,
    fontWeight: "600",
    color: "#374151",
  },

  input: {
    backgroundColor: "#F9FAFB",
    borderWidth: 2,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: "#1F2937",
  },

  roomInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  roomInput: {
    flex: 1,
    backgroundColor: "#F9FAFB",
    borderWidth: 2,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: "#1F2937",
  },

  qrButton: {
    backgroundColor: "#F0FDF4",
    borderWidth: 2,
    borderColor: "#059669",
    borderRadius: 12,
    padding: 10,
    alignItems: "center",
    justifyContent: "center",
    width: 48,
    height: 48,
  },

  qrHint: {
    fontSize: 11,
    color: "#059669",
    fontStyle: "italic",
    marginTop: 4,
  },

  submitButton: {
    backgroundColor: "#059669",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    marginTop: 8,
  },

  submitButtonDisabled: {
    backgroundColor: "#9CA3AF",
  },

  submitButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },

  changeChoiceButton: {
    alignItems: "center",
    padding: 8,
  },

  changeChoiceText: {
    color: "#6366F1",
    fontSize: 14,
    fontWeight: "500",
  },

  backLink: {
    alignItems: "center",
    padding: 8,
  },

  backText: {
    color: "#6B7280",
    fontSize: 13,
  },

  // QR Scanner
  qrScannerContainer: {
    flex: 1,
    backgroundColor: "#000",
  },

  qrHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: "rgba(0,0,0,0.8)",
  },

  closeButton: {
    padding: 8,
  },

  qrTitle: {
    color: "#FFF",
    fontSize: 18,
    fontWeight: "600",
  },

  placeholder: {
    width: 46,
  },

  camera: {
    flex: 1,
  },

  scannerOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },

  scannerFrame: {
    width: 250,
    height: 250,
    position: "relative",
  },

  corner: {
    position: "absolute",
    width: 30,
    height: 30,
    borderColor: "#059669",
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
    color: "#FFF",
    fontSize: 16,
    textAlign: "center",
    marginTop: 30,
    paddingHorizontal: 40,
  },

  // ===== ESTILOS RESPONSIVOS PARA TABLET =====

  // Sección de imagen en tablet
  imageSectionTablet: {
    flex: 0.5, // Ajustado para tablets
    paddingTop: 60,
    paddingHorizontal: 40,
  },

  // Imagen más grande en tablets
  heroImageTablet: {
    width: screenWidth * 0.4, // 40% en tablets
    height: screenWidth * 0.4,
    maxWidth: 350,
    maxHeight: 350,
  },

  // Modal section en tablet
  modalSectionTablet: {
    flex: 0.5,
    paddingHorizontal: 60,
    paddingBottom: 60,
    justifyContent: "center",
  },

  // Modales en tablet
  choiceModalTablet: {
    borderRadius: 32,
    padding: 32,
    maxWidth: 600,
    alignSelf: "center",
    width: "100%",
  },

  formModalTablet: {
    borderRadius: 32,
    padding: 32,
    maxWidth: 600,
    alignSelf: "center",
    width: "100%",
  },

  // Textos en tablet
  modalTitleTablet: {
    fontSize: 28,
    marginBottom: 12,
  },

  modalSubtitleTablet: {
    fontSize: 18,
    lineHeight: 24,
  },

  // Botones en tablet
  choiceButtonsTablet: {
    gap: 20,
    marginBottom: 32,
  },

  choiceButtonTablet: {
    padding: 24,
    borderRadius: 20,
  },

  buttonEmojiTablet: {
    fontSize: 36,
    marginBottom: 12,
  },

  buttonTitleTablet: {
    fontSize: 20,
    marginBottom: 6,
  },

  buttonSubtextTablet: {
    fontSize: 15,
  },

  // Formulario en tablet
  formContentTablet: {
    gap: 24,
  },

  inputLabelTablet: {
    fontSize: 17,
  },

  inputTablet: {
    padding: 18,
    fontSize: 17,
    borderRadius: 16,
  },

  roomInputContainerTablet: {
    gap: 14,
  },

  qrButtonTablet: {
    padding: 14,
    borderRadius: 16,
    width: 56,
    height: 56,
  },

  qrHintTablet: {
    fontSize: 13,
  },

  submitButtonTablet: {
    padding: 20,
    borderRadius: 16,
    marginTop: 12,
  },

  submitButtonTextTablet: {
    fontSize: 18,
  },

  changeChoiceButtonTablet: {
    padding: 12,
  },

  changeChoiceTextTablet: {
    fontSize: 16,
  },

  backLinkTablet: {
    padding: 12,
  },

  backTextTablet: {
    fontSize: 15,
  },

  // QR Scanner en tablet
  qrHeaderTablet: {
    paddingTop: 60,
    paddingHorizontal: 30,
    paddingBottom: 30,
  },

  closeButtonTablet: {
    padding: 12,
  },

  qrTitleTablet: {
    fontSize: 22,
  },

  scannerFrameTablet: {
    width: 350,
    height: 350,
  },

  scannerTextTablet: {
    fontSize: 18,
    marginTop: 40,
    paddingHorizontal: 60,
  },
})
