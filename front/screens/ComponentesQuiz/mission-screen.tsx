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
} from "react-native"
import { __DEV__ } from "react-native"

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
  questionType?: "MULTIPLE_CHOICE_SINGLE" | "OPEN_ENDED"
  options: OptionType[]
  onSubmit?: (selectedOption: string, isCorrect: boolean, userAnswer?: string) => void
}

const { width } = Dimensions.get("window")

export const MissionScreen = ({
  missionNumber,
  backgroundImage,
  characterImage,
  question,
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
  const textInputRef = useRef<TextInput>(null)

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start()
  }, [])

  // 🔍 LOG PARA DEBUGGING
  useEffect(() => {
    console.log("🔍 MISSION SCREEN - Props recibidas:")
    console.log("- questionType:", questionType)
    console.log("- options length:", options.length)
    console.log("- question:", question)
    console.log("- options:", options)
  }, [questionType, options, question])

  // 🔥 DETERMINAR SI ES REALMENTE UNA PREGUNTA ABIERTA
  const isOpenEndedQuestion =
    questionType === "OPEN_ENDED" || (questionType === "MULTIPLE_CHOICE_SINGLE" && options.length === 0)

  const handleOptionPress = (optionId: string) => {
    if (!answered && questionType === "MULTIPLE_CHOICE_SINGLE" && options.length > 0) {
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

  const handleSubmit = () => {
    console.log("🚀 ENVIANDO RESPUESTA:")
    console.log("- questionType:", questionType)
    console.log("- isOpenEndedQuestion:", isOpenEndedQuestion)
    console.log("- selectedOption:", selectedOption)
    console.log("- userAnswer:", userAnswer)
    console.log("- answered:", answered)

    if (isOpenEndedQuestion) {
      // Para preguntas abiertas (incluyendo fallback)
      if (userAnswer.trim() && !answered) {
        console.log("✅ Enviando respuesta abierta:", userAnswer)

        setIsCorrect(true)
        setAnswered(true)

        if (onSubmit) {
          onSubmit("OPEN_ENDED_RESPONSE", true, userAnswer.trim())
        }
      } else if (!userAnswer.trim()) {
        console.log("⚠️ No hay respuesta escrita")
      }
    } else if (questionType === "MULTIPLE_CHOICE_SINGLE" && options.length > 0) {
      // Para preguntas de opción múltiple normales
      if (selectedOption && !answered) {
        const selected = options.find((option) => option.id === selectedOption)
        const correct = selected?.isCorrect || false

        console.log("✅ Enviando respuesta de opción múltiple:", { selectedOption, correct })

        setIsCorrect(correct)
        setAnswered(true)

        if (onSubmit) {
          onSubmit(selectedOption, correct)
        }
      }
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

  const renderContent = () => {
    console.log("🎨 RENDERIZANDO CONTENIDO:")
    console.log("- questionType:", questionType)
    console.log("- options length:", options.length)
    console.log("- isOpenEndedQuestion:", isOpenEndedQuestion)

    // 🔥 SI ES PREGUNTA ABIERTA (REAL O FALLBACK)
    if (isOpenEndedQuestion) {
      console.log("✏️ RENDERIZANDO CAMPO DE TEXTO")
      return (
        <View style={styles.openEndedContainer}>
          <Text style={styles.instructionText}>💭 Escribe tu respuesta:</Text>
          <TouchableWithoutFeedback onPress={handleTextInputPress}>
            <View style={styles.textInputWrapper}>
              <TextInput
                ref={textInputRef}
                style={[
                  styles.openEndedInput,
                  isFocused && styles.openEndedInputFocused,
                  answered && styles.openEndedInputDisabled,
                ]}
                placeholder="Toca aquí para escribir tu respuesta..."
                placeholderTextColor="#999"
                multiline={true}
                numberOfLines={8}
                value={userAnswer}
                onChangeText={(text) => {
                  console.log("📝 Texto cambiado:", text)
                  setUserAnswer(text)
                }}
                onFocus={handleTextInputFocus}
                onBlur={handleTextInputBlur}
                editable={!answered}
                textAlignVertical="top"
                autoCorrect={true}
                spellCheck={true}
                returnKeyType="default"
                blurOnSubmit={false}
                autoFocus={false}
              />
            </View>
          </TouchableWithoutFeedback>

          {/* Indicador de caracteres */}
          <Text style={styles.characterCount}>
            {userAnswer.length} caracteres {userAnswer.length > 0 ? "✓" : ""}
          </Text>
        </View>
      )
    }

    // Para preguntas de opción múltiple con opciones
    else if (questionType === "MULTIPLE_CHOICE_SINGLE" && options.length > 0) {
      console.log("📝 Renderizando opciones de opción múltiple")
      return (
        <ScrollView style={styles.optionsContainer} showsVerticalScrollIndicator={false} nestedScrollEnabled={true}>
          {options.map((option) => (
            <TouchableOpacity
              key={option.id}
              style={getOptionStyle(option.id, option.isCorrect)}
              onPress={() => handleOptionPress(option.id)}
              disabled={answered}
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

    // No debería llegar aquí, pero por seguridad
    return null
  }

  // 🔥 LÓGICA SIMPLIFICADA PARA EL BOTÓN
  const isButtonDisabled = () => {
    if (answered) return true

    if (isOpenEndedQuestion) {
      return !userAnswer || userAnswer.trim().length === 0
    } else {
      return !selectedOption
    }
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

                {/* Contenido dinámico según el tipo */}
                {renderContent()}
              </View>

              {/* Botón de enviar */}
              {!answered && (
                <TouchableOpacity
                  style={[styles.submitButton, isButtonDisabled() ? styles.disabledButton : styles.enabledButton]}
                  onPress={handleSubmit}
                  disabled={isButtonDisabled()}
                >
                  <Text style={styles.submitButtonText}>{isOpenEndedQuestion ? "📝 Enviar Respuesta" : "Enviar"}</Text>
                </TouchableOpacity>
              )}

              {/* Debug info para ver el estado */}
              {__DEV__ && (
                <View style={styles.debugInfo}>
                  <Text style={styles.debugText}>QuestionType: {questionType}</Text>
                  <Text style={styles.debugText}>Options length: {options.length}</Text>
                  <Text style={styles.debugText}>IsOpenEndedQuestion: {isOpenEndedQuestion.toString()}</Text>
                  <Text style={styles.debugText}>UserAnswer length: {userAnswer.length}</Text>
                  <Text style={styles.debugText}>UserAnswer trimmed: "{userAnswer.trim()}"</Text>
                  <Text style={styles.debugText}>Button disabled: {isButtonDisabled().toString()}</Text>
                </View>
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
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    borderRadius: 15,
    padding: 20,
    width: width * 0.9,
    marginBottom: 20,
    minHeight: 200,
  },
  questionText: {
    fontSize: 18,
    marginBottom: 20,
    textAlign: "center",
    fontWeight: "600",
    color: "#333",
    lineHeight: 24,
  },
  optionsContainer: {
    width: "100%",
    maxHeight: width * 0.5,
  },
  optionButton: {
    backgroundColor: "#E0E0E0",
    borderRadius: 10,
    padding: 12,
    marginVertical: 4,
    flexDirection: "row",
    alignItems: "center",
    minHeight: 50,
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
    fontSize: 16,
    fontWeight: "bold",
    marginRight: 10,
    minWidth: 25,
  },
  optionText: {
    fontSize: 16,
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
    borderRadius: 25,
    paddingVertical: 15,
    paddingHorizontal: 40,
    marginTop: 15,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  disabledButton: {
    backgroundColor: "#A5D6A7",
    opacity: 0.7,
  },
  enabledButton: {
    backgroundColor: "#4CAF50",
  },
  submitButtonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
  // 🔥 ESTILOS MEJORADOS PARA PREGUNTAS ABIERTAS
  openEndedContainer: {
    width: "100%",
    marginTop: 10,
  },
  instructionText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#4CAF50",
    marginBottom: 10,
    textAlign: "center",
  },
  textInputWrapper: {
    position: "relative",
    width: "100%",
  },
  openEndedInput: {
    backgroundColor: "#FFFFFF",
    borderWidth: 3,
    borderColor: "#4CAF50",
    borderRadius: 15,
    padding: 20,
    minHeight: 180,
    maxHeight: 250,
    textAlignVertical: "top",
    fontSize: 16,
    color: "#333",
    fontFamily: Platform.OS === "ios" ? "System" : "Roboto",
    lineHeight: 24,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  openEndedInputFocused: {
    borderColor: "#2E7D32",
    backgroundColor: "#F8FFF8",
    borderWidth: 3,
  },
  openEndedInputDisabled: {
    backgroundColor: "#F5F5F5",
    borderColor: "#CCC",
    color: "#666",
  },
  characterCount: {
    fontSize: 14,
    color: "#4CAF50",
    textAlign: "right",
    marginTop: 8,
    fontWeight: "500",
  },
  // Debug styles
  debugInfo: {
    marginTop: 10,
    padding: 10,
    backgroundColor: "rgba(0,0,0,0.1)",
    borderRadius: 5,
  },
  debugText: {
    fontSize: 12,
    color: "#666",
  },
})
