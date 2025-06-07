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
  ScrollView,
} from "react-native"
import { CameraView, useCameraPermissions } from "expo-camera"
import { Ionicons } from "@expo/vector-icons"
import axios from "axios"
import AsyncStorage from "@react-native-async-storage/async-storage"

const { width: screenWidth, height: screenHeight } = Dimensions.get("window")

type Props = {
  setIsAuthenticated: (val: boolean) => void
  onBack: () => void
}

export default function StudentAuthScreen({ setIsAuthenticated, onBack }: Props) {
  const [step, setStep] = useState<"choice" | "form">("choice")
  const [isFirstTime, setIsFirstTime] = useState<boolean | null>(null)
  const [username, setUsername] = useState("")
  const [roomCode, setRoomCode] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [fadeAnim] = useState(new Animated.Value(0))
  const [showQRScanner, setShowQRScanner] = useState(false)
  const [permission, requestPermission] = useCameraPermissions()
  const [dimensions, setDimensions] = useState(Dimensions.get("window"))

  useEffect(() => {
    const subscription = Dimensions.addEventListener("change", ({ window }) => {
      setDimensions(window)
    })
    return () => subscription?.remove()
  }, [])

  const currentIsTablet = dimensions.width >= 768

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
    if (!permission) return

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

    let extractedRoomCode = data

    if (data.includes("room_code=")) {
      const urlParams = new URLSearchParams(data.split("?")[1])
      extractedRoomCode = urlParams.get("room_code") || data
    } else if (data.includes("/room/")) {
      extractedRoomCode = data.split("/room/")[1] || data
    }

    setRoomCode(extractedRoomCode)
    setShowQRScanner(false)

    Alert.alert("¡QR Escaneado!", `Room code detectado: ${extractedRoomCode}`, [{ text: "OK" }])
  }

  // Función para limpiar completamente la sesión anterior
  const clearPreviousSession = async () => {
    try {
      console.log("🧹 LIMPIANDO SESIÓN ANTERIOR")
      
      // Lista de todas las claves relacionadas con autenticación
      const authKeys = [
        "studentToken",
        "studentData", 
        "authMethod",
        "userRole",
        "userInfo",
        "room_code",
        "roomId",
        "selectedCharacterName",
        // Agregar cualquier otra clave relacionada con la sesión
        "teacherToken",
        "teacherData",
        "adminToken",
        "adminData"
      ]

      // Eliminar todas las claves de autenticación anteriores
      await AsyncStorage.multiRemove(authKeys)
      
      console.log("✅ Sesión anterior limpiada completamente")
    } catch (error) {
      console.error("❌ Error al limpiar sesión anterior:", error)
      // No lanzar error aquí, solo loggearlo
    }
  }

  // Función para guardar datos de autenticación de forma segura
  const saveAuthenticationData = async (token: string, studentInfo: any) => {
    try {
      console.log("💾 GUARDANDO NUEVA SESIÓN DE AUTENTICACIÓN")
      console.log("🔑 Nuevo token:", token)
      console.log("📋 Información del estudiante:", studentInfo)

      // PASO 1: Limpiar completamente la sesión anterior
      await clearPreviousSession()

      // PASO 2: Guardar los nuevos datos de autenticación
      const authData = [
        ["studentToken", token],
        ["studentData", JSON.stringify(studentInfo)],
        ["authMethod", "student_with_token"],
        ["userRole", "STUDENT"],
        ["userInfo", JSON.stringify(studentInfo)],
        ["room_code", studentInfo.room_code],
        ["roomId", studentInfo.room_id || studentInfo.room_code]
      ]

      // Usar multiSet para operación atómica
      await AsyncStorage.multiSet(authData)

      console.log("✅ Nueva sesión guardada exitosamente")
      
      // Verificar que el token se guardó correctamente
      
      const savedToken = await AsyncStorage.getItem("studentToken")
      if (savedToken === token) {
        console.log("✅ Token verificado correctamente en AsyncStorage")
      } else {
        throw new Error("Error: Token no se guardó correctamente")
      }
      
      return true
    } catch (error) {
      console.error("❌ Error al guardar datos de autenticación:", error)
      throw new Error("Error al guardar datos de autenticación")
    }
  }

  const createStudent = async (room_code: string, username: string) => {
    try {
      console.log("🎓 CREANDO ESTUDIANTE - Primera vez")
      
      const response = await axios.post(
        "https://iza2ya8d9j.execute-api.us-east-1.amazonaws.com/dev/students/create",
        {
          room_code: room_code,
          username: username,
          data: {},
        },
        { headers: { "Content-Type": "application/json" } },
      )
      
      console.log("✅ Estudiante creado exitosamente:", response.data)

      // Extraer datos de la nueva estructura de respuesta
      const { success, data: responseData, message } = response.data
      
      if (!success) {
        throw new Error(message || "Error al crear estudiante")
      }

      const token = responseData?.token
      const studentId = responseData?.id
      const studentData = responseData?.student
      const roomId = studentData?.room_id

      if (!token) {
        throw new Error("Token no encontrado en la respuesta del servidor")
      }

      console.log("🔑 NUEVO TOKEN RECIBIDO DEL REGISTRO:", token)
      console.log("🏠 Room ID obtenido:", roomId)

      const studentInfo = {
        id: studentId,
        username,
        room_code,
        room_id: roomId,
        role: "STUDENT",
        loginMethod: "student_create",
        created_at: new Date().toISOString(),
        isFirstTime: true,
        studentId: studentId,
        authType: "student",
        score_student: studentData?.score_student || 0,
        score_villain: studentData?.score_villain || 0,
        status: studentData?.status || "CREATED",
        token: token,
        lastLogin: new Date().toISOString()
      }

      // Guardar la nueva sesión (esto limpia automáticamente la anterior)
      await saveAuthenticationData(token, studentInfo)

      // Guardar personaje por defecto para nuevos estudiantes
      await AsyncStorage.setItem("selectedCharacterName", "Qhapaq")

      console.log("📋 NUEVA SESIÓN DE REGISTRO GUARDADA COMPLETAMENTE")

      return { success: true, token, message, studentData, studentInfo }
    } catch (error: any) {
      console.error("❌ Error al crear estudiante:", error.response?.data || error.message)
      const apiMessage = error.response?.data?.message || error.response?.data?.error
      throw new Error(apiMessage || "Error desconocido al crear estudiante")
    }
  }

  const loginStudent = async (room_code: string, username: string) => {
    try {
      console.log("🎓 LOGIN DE ESTUDIANTE - Usuario existente")
      console.log("User:", username)
      
      const response = await axios.post(
        "https://iza2ya8d9j.execute-api.us-east-1.amazonaws.com/dev/students/login",
        {
          room_code: room_code,
          username,
        },
        { headers: { "Content-Type": "application/json" } },
      )
      
      console.log("✅ Respuesta completa del login:", response.data)

      // Extraer datos de la nueva estructura de respuesta
      const { success, data: responseData, message } = response.data
      
      if (!success) {
        throw new Error(message || "Error al hacer login")
      }

      const token = responseData?.token
      console.log("Token de estudiante ",token)
      const roomId = responseData?.room_id
      const studentData = responseData?.student

      if (!token) {
        console.error("❌ Token no encontrado en la respuesta:", response.data)
        throw new Error("Token no encontrado en la respuesta del servidor")
      }

      console.log("🔑 NUEVO TOKEN RECIBIDO DEL LOGIN:", token)
      console.log("🏠 Room ID obtenido:", roomId)

      const studentInfo = {
        id: studentData?.id || responseData?.id,
        username,
        room_code,
        room_id: roomId,
        role: "STUDENT",
        loginMethod: "student_login",
        created_at: new Date().toISOString(),
        isFirstTime: false,
        authType: "student",
        score_student: studentData?.score_student || 0,
        score_villain: studentData?.score_villain || 0,
        status: studentData?.status || "ACTIVE",
        token: token,
        lastLogin: new Date().toISOString()
      }

      // Guardar la nueva sesión (esto limpia automáticamente la anterior)
      await saveAuthenticationData(token, studentInfo)

      // Verificar si ya tiene un personaje asignado, si no asignar uno por defecto
      const existingCharacter = await AsyncStorage.getItem("selectedCharacterName")
      if (!existingCharacter) {
        await AsyncStorage.setItem("selectedCharacterName", "Amaru")
        console.log("- Personaje asignado:", "Amaru")
      }

      console.log("📋 NUEVA SESIÓN DE LOGIN GUARDADA COMPLETAMENTE")

      return { token, message, studentInfo }
    } catch (error: any) {
      console.error("❌ Error al hacer login:", error.response?.data || error.message)
      const apiMessage = error.response?.data?.message || error.response?.data?.error
      throw new Error(apiMessage || "Error desconocido al hacer login")
    }
  }

  const handleSubmit = async () => {
    if (!username.trim() || !roomCode.trim()) {
      Alert.alert("Error", "Por favor completa todos los campos")
      return
    }

    setIsLoading(true)
    try {
      if (isFirstTime) {
        console.log("🚀 INICIANDO PROCESO DE REGISTRO...")
        const createResult = await createStudent(roomCode, username)

        if (createResult.token && createResult.success) {
          console.log("✅ REGISTRO EXITOSO - Token guardado:", createResult.token)
          Alert.alert(
            "¡Cuenta creada! 🎓",
            `¡Hola ${username}! Tu cuenta de estudiante ha sido creada exitosamente. ¡Bienvenido al dashboard!`,
            [
              {
                text: "OK",
                onPress: () => {
                  console.log("🎯 Navegando al dashboard con nueva sesión")
                  setIsAuthenticated(true)
                },
              },
            ],
          )
        } else {
          // Fallback al login si no se pudo crear
          console.log("⚠️ Fallback: Intentando login...")
          const loginResult = await loginStudent(roomCode, username)
          if (loginResult.token) {
            console.log("✅ LOGIN FALLBACK EXITOSO - Token guardado:", loginResult.token)
            setIsAuthenticated(true)
          }
        }
      } else {
        console.log("🔑 INICIANDO PROCESO DE LOGIN...")
        const loginResult = await loginStudent(roomCode, username)
        
        if (loginResult.token) {
          console.log("✅ LOGIN EXITOSO - Token guardado:", loginResult.token)
          Alert.alert(
            "¡Bienvenido de vuelta! 👋",
            `¡Hola ${username}! Has iniciado sesión exitosamente. ¡Accediendo al dashboard!`,
            [
              {
                text: "OK",
                onPress: () => {
                  console.log("🎯 Navegando al dashboard con nueva sesión")
                  setIsAuthenticated(true)
                },
              },
            ],
          )
        }
      }
    } catch (error: any) {
      console.error("❌ Error en handleSubmit:", error.message)
      Alert.alert("Error", error.message)
    } finally {
      setIsLoading(false)
    }
  }

  if (step === "choice") {
    return (
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={[styles.imageSection, currentIsTablet && styles.imageSectionTablet]}>
            <Image
              source={require("../../assets/images/Cuenta-inicio.png")}
              style={[styles.heroImage, currentIsTablet && styles.heroImageTablet]}
              resizeMode="contain"
            />
          </View>

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
        </ScrollView>
      </KeyboardAvoidingView>
    )
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        enableOnAndroid={true}
      >
        <View style={[styles.imageSection, currentIsTablet && styles.imageSectionTablet]}>
          <Image
            source={require("../../assets/images/Cuenta-inicio.png")}
            style={[styles.heroImage, currentIsTablet && styles.heroImageTablet]}
            resizeMode="contain"
          />
        </View>

        <View style={[styles.modalSection, currentIsTablet && styles.modalSectionTablet]}>
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
                  returnKeyType="next"
                  blurOnSubmit={false}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, currentIsTablet && styles.inputLabelTablet]}>🏠 Room Code</Text>
                <View style={[styles.roomInputContainer, currentIsTablet && styles.roomInputContainerTablet]}>
                  <TextInput
                    style={[styles.roomInput, currentIsTablet && styles.inputTablet]}
                    placeholder="Código proporcionado por tu profesor"
                    value={roomCode}
                    onChangeText={setRoomCode}
                    autoCapitalize="none"
                    placeholderTextColor="#A0A0A0"
                    returnKeyType="done"
                    onSubmitEditing={handleSubmit}
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
        </View>
      </ScrollView>

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
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  scrollContainer: {
    flexGrow: 1,
    minHeight: screenHeight,
  },
  imageSection: {
    flex: 0.45,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 40,
    paddingHorizontal: 20,
    minHeight: screenHeight * 0.35,
  },
  heroImage: {
    width: screenWidth * 0.5,
    height: screenWidth * 0.5,
    maxWidth: 250,
    maxHeight: 250,
  },
  modalSection: {
    flex: 0.55,
    justifyContent: "flex-end",
    paddingHorizontal: 20,
    paddingBottom: 20,
    minHeight: screenHeight * 0.4,
  },
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
    marginBottom: 20,
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
    marginBottom: 20,
  },
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
    minHeight: 48,
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
    minHeight: 48,
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
    minHeight: 52,
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
  imageSectionTablet: {
    flex: 0.4,
    paddingTop: 60,
    paddingHorizontal: 40,
    minHeight: screenHeight * 0.3,
  },
  heroImageTablet: {
    width: screenWidth * 0.3,
    height: screenWidth * 0.3,
    maxWidth: 300,
    maxHeight: 300,
  },
  modalSectionTablet: {
    flex: 0.6,
    paddingHorizontal: 60,
    paddingBottom: 40,
    justifyContent: "center",
    minHeight: screenHeight * 0.5,
  },
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
  modalTitleTablet: {
    fontSize: 28,
    marginBottom: 12,
  },
  modalSubtitleTablet: {
    fontSize: 18,
    lineHeight: 24,
  },
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
    minHeight: 56,
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
    minHeight: 60,
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