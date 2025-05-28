"use client"

import { useState, useEffect, useRef } from "react"
import {
  View,
  Text,
  Image,
  ImageBackground,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Animated,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableWithoutFeedback,
  Keyboard,
  Alert,
} from "react-native"

// Tipos para las propiedades
type OptionType = {
  id: string
  text: string
  isCorrect?: boolean
  isOpenEnded?: boolean
}

// Tipo para imágenes (puede ser require local o URL)
type ImageSource = number | { uri: string }

type MissionScreenProps = {
  missionNumber: number
  backgroundImage: ImageSource
  characterImage: ImageSource
  question: string
  questionId: string // Nuevo: ID de la pregunta para el endpoint
  questionType?: "MULTIPLE_CHOICE_SINGLE" | "OPEN_ENDED"
  options: OptionType[]
  onSubmit?: (
    selectedOption: string,
    isCorrect: boolean,
    userAnswer?: string,
    aiScore?: number,
    aiFeedback?: string,
  ) => void
}

const { width } = Dimensions.get("window")

export const MissionScreen = ({
  missionNumber,
  backgroundImage,
  characterImage,
  question,
  questionId,
  questionType = "MULTIPLE_CHOICE_SINGLE",
  options,
  onSubmit,
}: MissionScreenProps) => {
  const [selectedOption, setSelectedOption] = useState<string | null>(null)
  const [userAnswer, setUserAnswer] = useState<string>("")
  const [answered, setAnswered] = useState<boolean>(false)
  const [isCorrect, setIsCorrect] = useState<boolean>(false)
  const [fadeAnim] = useState(new Animated.Value(0))
  const [isFocused, setIsFocused] = useState<boolean>(false)
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const textInputRef = useRef<TextInput>(null)

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start()
  }, [])

  const handleOptionPress = (optionId: string) => {
    if (!answered && questionType === "MULTIPLE_CHOICE_SINGLE") {
      setSelectedOption(optionId)
    }
  }

  const handleTextInputFocus = () => {
    console.log("📝 TextInput recibió foco")
    setIsFocused(true)
  }

  const handleTextInputBlur = () => {
    console.log("📝 TextInput perdió foco")
    setIsFocused(false)
  }

  const handleTextInputPress = () => {
    console.log("📝 TextInput fue presionado")
    if (textInputRef.current && !answered) {
      textInputRef.current.focus()
    }
  }

  // Función para llamar al endpoint de IA
  const callAIFeedbackEndpoint = async (responseStudent: string[]) => {
    try {
      // Obtener datos del localStorage
      const roomId = localStorage.getItem("room_id")
      const token = localStorage.getItem("auth_token") || localStorage.getItem("token")

      if (!roomId) {
        throw new Error("No se encontró room_id en localStorage")
      }

      if (!token) {
        throw new Error("No se encontró token de autorización")
      }

      console.log("🚀 Llamando al endpoint de IA:", {
        room_id: roomId,
        question_id: questionId,
        response_student: responseStudent,
      })

      const response = await fetch("https://6axx5kevpc.execute-api.us-east-1.amazonaws.com/dev/responses/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          room_id: roomId,
          question_id: questionId,
          response_student: responseStudent,
        }),
      })

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      console.log("✅ Respuesta del endpoint de IA:", data)

      if (data.success && data.data) {
        return {
          score: data.data.score,
          feedback: data.data.feedback,
        }
      } else {
        throw new Error("Respuesta inválida del servidor")
      }
    } catch (error) {
      console.error("❌ Error al llamar al endpoint de IA:", error)
      Alert.alert("Error", "No se pudo obtener el feedback de la IA. Se continuará con el flujo normal.", [
        { text: "OK" },
      ])
      return null
    }
  }

  const handleSubmit = async () => {
    console.log("🚀 ENVIANDO RESPUESTA:")
    console.log("- questionType:", questionType)
    console.log("- selectedOption:", selectedOption)
    console.log("- userAnswer:", userAnswer)
    console.log("- answered:", answered)

    if (answered || isLoading) return

    setIsLoading(true)

    try {
      if (questionType === "MULTIPLE_CHOICE_SINGLE") {
        if (selectedOption) {
          // Encontrar la opción seleccionada
          const selected = options.find((option) => option.id === selectedOption)
          const correct = selected?.isCorrect || false

          console.log("✅ Enviando respuesta de opción múltiple:", { selectedOption, correct })

          // Llamar al endpoint de IA
          const aiResponse = await callAIFeedbackEndpoint([selected?.text || selectedOption])

          setIsCorrect(correct)
          setAnswered(true)

          if (onSubmit) {
            onSubmit(selectedOption, correct, undefined, aiResponse?.score, aiResponse?.feedback)
          }
        }
      } else if (questionType === "OPEN_ENDED") {
        if (userAnswer.trim()) {
          console.log("✅ Enviando respuesta abierta:", userAnswer)

          // Llamar al endpoint de IA
          const aiResponse = await callAIFeedbackEndpoint([userAnswer.trim()])

          // Para preguntas abiertas, consideramos la respuesta como "correcta" por defecto
          // pero el score real vendrá de la IA
          setIsCorrect(true)
          setAnswered(true)

          if (onSubmit) {
            onSubmit("OPEN", true, userAnswer, aiResponse?.score, aiResponse?.feedback)
          }
        }
      }
    } catch (error) {
      console.error("❌ Error en handleSubmit:", error)
      Alert.alert("Error", "Ocurrió un error al enviar la respuesta. Por favor, intenta de nuevo.", [{ text: "OK" }])
    } finally {
      setIsLoading(false)
    }
  }

  const getOptionStyle = (optionId: string, isOptionCorrect?: boolean) => {
    if (!answered) {
      return [styles.optionButton, selectedOption === optionId && styles.selectedOption]
    } else {
      if (optionId === selectedOption) {
        return [styles.optionButton, isOptionCorrect ? styles.correctOption : styles.incorrectOption]
      } else if (isOptionCorrect) {
        return [styles.optionButton, styles.correctOption]
      } else {
        return [styles.optionButton]
      }
    }
  }

  const renderOptions = () => {
    console.log("🔍 RENDERIZANDO OPCIONES:")
    console.log("- questionType:", questionType)

    if (questionType === "OPEN_ENDED") {
      console.log("✏️ Renderizando SOLO campo de texto para pregunta abierta (sin opciones)")
      return (
        <View style={styles.openEndedContainer}>
          <TouchableWithoutFeedback onPress={handleTextInputPress}>
            <View style={styles.textInputWrapper}>
              <TextInput
                ref={textInputRef}
                style={[
                  styles.openEndedInput,
                  isFocused && styles.openEndedInputFocused,
                  answered && styles.openEndedInputDisabled,
                ]}
                placeholder="Escribe tu respuesta aquí..."
                placeholderTextColor="#999"
                multiline={true}
                numberOfLines={6}
                value={userAnswer}
                onChangeText={(text) => {
                  console.log("📝 Texto cambiado:", text)
                  setUserAnswer(text)
                }}
                onFocus={handleTextInputFocus}
                onBlur={handleTextInputBlur}
                editable={!answered && !isLoading}
                textAlignVertical="top"
                autoCorrect={true}
                spellCheck={true}
                returnKeyType="default"
                blurOnSubmit={false}
              />
              {!userAnswer && !isFocused && (
                <View style={styles.placeholderOverlay}>
                </View>
              )}
            </View>
          </TouchableWithoutFeedback>

          {/* Indicador de caracteres */}
          <Text style={styles.characterCount}>{userAnswer.length} caracteres</Text>
        </View>
      )
    } else if (questionType === "MULTIPLE_CHOICE_SINGLE") {
      console.log("📝 Renderizando opciones de opción múltiple")
      return (
        <ScrollView style={styles.optionsContainer} showsVerticalScrollIndicator={false} nestedScrollEnabled={true}>
          {options.map((option) => (
            <TouchableOpacity
              key={option.id}
              style={getOptionStyle(option.id, option.isCorrect)}
              onPress={() => handleOptionPress(option.id)}
              disabled={answered || isLoading}
            >
              <Text
                style={[
                  styles.optionLabel,
                  answered && option.isCorrect && styles.correctOptionText,
                  answered && selectedOption === option.id && !option.isCorrect && styles.incorrectOptionText,
                ]}
              >
                {option.id}.
              </Text>
              <Text
                style={[
                  styles.optionText,
                  answered && option.isCorrect && styles.correctOptionText,
                  answered && selectedOption === option.id && !option.isCorrect && styles.incorrectOptionText,
                ]}
              >
                {option.text}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )
    }

    // Fallback por defecto
    console.log("❌ Tipo de pregunta no reconocido, renderizando campo de texto por defecto")
    return (
      <View style={styles.openEndedContainer}>
        <TouchableWithoutFeedback onPress={handleTextInputPress}>
          <View style={styles.textInputWrapper}>
            <TextInput
              ref={textInputRef}
              style={[
                styles.openEndedInput,
                isFocused && styles.openEndedInputFocused,
                answered && styles.openEndedInputDisabled,
              ]}
              placeholder="Escribe tu respuesta aquí..."
              placeholderTextColor="#999"
              multiline={true}
              numberOfLines={6}
              value={userAnswer}
              onChangeText={setUserAnswer}
              onFocus={handleTextInputFocus}
              onBlur={handleTextInputBlur}
              editable={!answered && !isLoading}
              textAlignVertical="top"
              autoCorrect={true}
              spellCheck={true}
            />
          </View>
        </TouchableWithoutFeedback>
      </View>
    )
  }

  return (
    <ImageBackground source={backgroundImage} style={styles.background} resizeMode="cover">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardAvoidingView}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView contentContainerStyle={styles.scrollContainer}>
            <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
              {/* Título de la misión */}
              <Text style={styles.missionTitle}>Misión {missionNumber}</Text>

              {/* Imagen del personaje */}
              <Image source={characterImage} style={styles.characterImage} />

              {/* Contenedor de la pregunta */}
              <View style={styles.questionContainer}>
                <Text style={styles.questionText}>{question}</Text>

                {/* Opciones o campo de texto según el tipo */}
                {renderOptions()}
              </View>

              {/* Botón de enviar */}
              {!answered && (
                <TouchableOpacity
                  style={[
                    styles.submitButton,
                    (questionType === "MULTIPLE_CHOICE_SINGLE" && !selectedOption) ||
                    (questionType === "OPEN_ENDED" && !userAnswer.trim()) ||
                    isLoading
                      ? styles.disabledButton
                      : null,
                  ]}
                  onPress={handleSubmit}
                  disabled={
                    (questionType === "MULTIPLE_CHOICE_SINGLE" && !selectedOption) ||
                    (questionType === "OPEN_ENDED" && !userAnswer.trim()) ||
                    isLoading
                  }
                >
                  <Text style={styles.submitButtonText}>
                    {isLoading ? "Enviando..." : questionType === "OPEN_ENDED" ? "Enviar Respuesta" : "Enviar"}
                  </Text>
                </TouchableOpacity>
              )}
            </Animated.View>
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </ImageBackground>
  )
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    width: "100%",
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
  },
  container: {
    flex: 1,
    alignItems: "center",
    paddingTop: 20,
    paddingBottom: 40,
  },
  missionTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "black",
    marginBottom: 10,
    textShadowColor: "rgba(255, 255, 255, 0.7)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  characterImage: {
    width: width * 0.5,
    height: width * 0.5,
    resizeMode: "contain",
    marginBottom: 20,
  },
  questionContainer: {
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    borderRadius: 15,
    padding: 15,
    width: width * 0.85,
    marginBottom: 20,
    maxHeight: width * 0.8,
  },
  questionText: {
    fontSize: 16,
    marginBottom: 15,
    textAlign: "center",
    fontWeight: "500",
    color: "#333",
  },
  optionsContainer: {
    width: "100%",
    maxHeight: width * 0.5,
  },
  optionButton: {
    backgroundColor: "#E0E0E0",
    borderRadius: 10,
    padding: 10,
    marginVertical: 3,
    flexDirection: "row",
    alignItems: "center",
    minHeight: 45,
  },
  selectedOption: {
    backgroundColor: "#4CAF50",
  },
  correctOption: {
    backgroundColor: "#4CAF50",
  },
  incorrectOption: {
    backgroundColor: "#F44336",
  },
  optionLabel: {
    fontSize: 14,
    fontWeight: "bold",
    marginRight: 8,
    minWidth: 20,
  },
  optionText: {
    fontSize: 14,
    flex: 1,
    flexWrap: "wrap",
  },
  correctOptionText: {
    color: "white",
  },
  incorrectOptionText: {
    color: "white",
  },
  submitButton: {
    backgroundColor: "#4CAF50",
    borderRadius: 25,
    paddingVertical: 12,
    paddingHorizontal: 30,
    marginTop: 10,
  },
  disabledButton: {
    backgroundColor: "#A5D6A7",
    opacity: 0.7,
  },
  submitButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  openEndedContainer: {
    width: "100%",
    marginTop: 10,
  },
  textInputWrapper: {
    position: "relative",
    width: "100%",
  },
  openEndedInput: {
    backgroundColor: "#FFFFFF",
    borderWidth: 2,
    borderColor: "#E0E0E0",
    borderRadius: 12,
    padding: 15,
    minHeight: 150,
    maxHeight: 200,
    textAlignVertical: "top",
    fontSize: 16,
    color: "#333",
    fontFamily: Platform.OS === "ios" ? "System" : "Roboto",
    lineHeight: 22,
  },
  openEndedInputFocused: {
    borderColor: "#4CAF50",
    backgroundColor: "#F8FFF8",
  },
  openEndedInputDisabled: {
    backgroundColor: "#F5F5F5",
    borderColor: "#CCC",
    color: "#666",
  },
  placeholderOverlay: {
    position: "absolute",
    top: 15,
    left: 15,
    right: 15,
    pointerEvents: "none",
  },
  placeholderText: {
    fontSize: 16,
    color: "#999",
    fontStyle: "italic",
  },
  characterCount: {
    fontSize: 12,
    color: "#666",
    textAlign: "right",
    marginTop: 5,
    fontStyle: "italic",
  },
})
