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
  questionType?: "MULTIPLE_CHOICE_SINGLE" | "MULTIPLE_CHOICE_MULTIPLE" | "OPEN_ENDED"
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

  // Reset states when mission changes
  useEffect(() => {
    console.log("🔄 MISSION SCREEN - Reseteando estados para nueva misión")
    setSelectedOption(null)
    setUserAnswer("")
    setAnswered(false)
    setIsCorrect(false)
    setIsFocused(false)
  }, [missionNumber, question])

  useEffect(() => {
    console.log("🔍 MISSION SCREEN - Props recibidas:")
    console.log("- missionNumber:", missionNumber)
    console.log("- questionType:", questionType)
    console.log("- options length:", options.length)
    console.log("- question:", question)
    console.log("- options:", options)

    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start()
  }, [missionNumber])

  const handleOptionPress = (optionId: string) => {
    if (!answered && (questionType === "MULTIPLE_CHOICE_SINGLE" || questionType === "MULTIPLE_CHOICE_MULTIPLE")) {
      setSelectedOption(optionId)
      console.log("✅ Opción seleccionada:", optionId)
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
    const isOpenEndedQuestion = questionType === "OPEN_ENDED"

    console.log("🚀 ENVIANDO RESPUESTA:")
    console.log("- questionType:", questionType)
    console.log("- isOpenEndedQuestion:", isOpenEndedQuestion)
    console.log("- selectedOption:", selectedOption)
    console.log("- userAnswer:", userAnswer)
    console.log("- answered:", answered)

    if (answered) return

    if (isOpenEndedQuestion) {
      if (userAnswer.trim()) {
        console.log("✅ Enviando respuesta abierta:", userAnswer)

        // Para preguntas abiertas, siempre consideramos la respuesta como "correcta"
        setIsCorrect(true)
        setAnswered(true)

        if (onSubmit) {
          onSubmit("OPEN", true, userAnswer)
        }
      }
    } else {
      // Para preguntas de opción múltiple
      if (selectedOption) {
        // Encontrar la opción seleccionada
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

  const renderOptions = () => {
    const isOpenEndedQuestion = questionType === "OPEN_ENDED"

    console.log("🎨 RENDERIZANDO CONTENIDO:")
    console.log("- questionType:", questionType)
    console.log("- options length:", options.length)
    console.log("- isOpenEndedQuestion:", isOpenEndedQuestion)

    if (isOpenEndedQuestion) {
      console.log("✏️ Renderizando campo de texto para pregunta abierta")
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
                editable={!answered}
                textAlignVertical="top"
                autoCorrect={true}
                spellCheck={true}
                returnKeyType="default"
                blurOnSubmit={false}
              />
              {!userAnswer && !isFocused && (
                <View style={styles.placeholderOverlay}>
                  <Text style={styles.placeholderText}>💭 Escribe tu respuesta aquí</Text>
                </View>
              )}
            </View>
          </TouchableWithoutFeedback>

          {/* Indicador de caracteres */}
          <Text style={styles.characterCount}>{userAnswer.length} caracteres</Text>
        </View>
      )
    } else {
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
  }

  const isOpenEndedQuestion = questionType === "OPEN_ENDED"

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
                    (!isOpenEndedQuestion && !selectedOption) || (isOpenEndedQuestion && !userAnswer.trim())
                      ? styles.disabledButton
                      : null,
                  ]}
                  onPress={handleSubmit}
                  disabled={(!isOpenEndedQuestion && !selectedOption) || (isOpenEndedQuestion && !userAnswer.trim())}
                >
                  <Text style={styles.submitButtonText}>{isOpenEndedQuestion ? "Enviar Respuesta" : "Enviar"}</Text>
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
