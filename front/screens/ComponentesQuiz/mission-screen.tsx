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
  SafeAreaView,
  StatusBar,
  Modal,
} from "react-native"
import { Ionicons } from "@expo/vector-icons"

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
  onSubmit?: (selectedOption: string | string[], isCorrect: boolean, userAnswer?: string) => void
  // 🔍 NUEVAS PROPS PARA EL AMPLIFICADOR
  amplifier?: {
    enabled: boolean
    threshold: number
    modalTitle: string
    modalDescription: string
  }
  difficulty?: "EASY" | "MEDIUM" | "HARD"
  tags?: string[]
  score?: number
}

const { width, height } = Dimensions.get("window")
const isTablet = width >= 768

export const MissionScreen = ({
  missionNumber,
  backgroundImage,
  characterImage,
  question,
  questionType = "MULTIPLE_CHOICE_SINGLE",
  options,
  onSubmit,
  // 🔍 NUEVAS PROPS
  amplifier,
  difficulty,
  tags,
  score,
}: MissionScreenProps) => {
  // Estados existentes
  const [selectedOption, setSelectedOption] = useState<string | null>(null)
  const [selectedOptions, setSelectedOptions] = useState<string[]>([])
  const [userAnswer, setUserAnswer] = useState<string>("")
  const [answered, setAnswered] = useState<boolean>(false)
  const [isCorrect, setIsCorrect] = useState<boolean>(false)
  const [fadeAnim] = useState(new Animated.Value(0))
  const [isFocused, setIsFocused] = useState<boolean>(false)
  const [dimensions, setDimensions] = useState(Dimensions.get("window"))
  const textInputRef = useRef<TextInput>(null)
  const scrollViewRef = useRef<ScrollView>(null)

  // 🔍 NUEVOS ESTADOS PARA EL AMPLIFICADOR
  const [amplifierVisible, setAmplifierVisible] = useState(false)
  const [showAmplifierButton, setShowAmplifierButton] = useState(true)

  // Actualizar dimensiones cuando cambia la orientación
  useEffect(() => {
    const subscription = Dimensions.addEventListener("change", ({ window }) => {
      setDimensions(window)
    })

    return () => {
      if (subscription?.remove) {
        subscription.remove()
      }
    }
  }, [])

  // Reset states when mission changes
  useEffect(() => {
    console.log("🔄 MISSION SCREEN - Reseteando estados para nueva misión")
    setSelectedOption(null)
    setSelectedOptions([])
    setUserAnswer("")
    setAnswered(false)
    setIsCorrect(false)
    setIsFocused(false)
    // 🔍 RESETEAR AMPLIFICADOR
    setAmplifierVisible(false)
  }, [missionNumber, question])

  useEffect(() => {
    console.log("🔍 MISSION SCREEN - Props recibidas:")
    console.log("- missionNumber:", missionNumber)
    console.log("- questionType:", questionType)
    console.log("- options length:", options.length)
    console.log("- question:", question)
    console.log("- options:", options)
    console.log("- amplifier:", amplifier)

    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start()
  }, [missionNumber])

  // 🔍 FUNCIONES DEL AMPLIFICADOR
  const getDifficultyColor = (difficulty?: string) => {
    switch (difficulty) {
      case "EASY":
        return "#10B981" // green-500
      case "MEDIUM":
        return "#F59E0B" // yellow-500
      case "HARD":
        return "#EF4444" // red-500
      default:
        return "#6B7280" // gray-500
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "MULTIPLE_CHOICE_SINGLE":
        return "radio-button-on"
      case "MULTIPLE_CHOICE_MULTIPLE":
        return "checkbox"
      case "OPEN_ENDED":
        return "create"
      default:
        return "help-circle"
    }
  }

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "MULTIPLE_CHOICE_SINGLE":
        return "Opción Múltiple Simple"
      case "MULTIPLE_CHOICE_MULTIPLE":
        return "Opción Múltiple Múltiple"
      case "OPEN_ENDED":
        return "Pregunta Abierta"
      default:
        return "Pregunta"
    }
  }

  const handleOptionPress = (optionId: string) => {
    if (!answered && (questionType === "MULTIPLE_CHOICE_SINGLE" || questionType === "MULTIPLE_CHOICE_MULTIPLE")) {
      if (questionType === "MULTIPLE_CHOICE_SINGLE") {
        setSelectedOption(optionId)
        console.log("✅ Opción seleccionada (única):", optionId)
      } else if (questionType === "MULTIPLE_CHOICE_MULTIPLE") {
        setSelectedOptions((prev) => {
          if (prev.includes(optionId)) {
            const newSelection = prev.filter((id) => id !== optionId)
            console.log("✅ Opciones seleccionadas (múltiple):", newSelection)
            return newSelection
          } else {
            const newSelection = [...prev, optionId]
            console.log("✅ Opciones seleccionadas (múltiple):", newSelection)
            return newSelection
          }
        })
      }
    }
  }

  const handleTextInputFocus = () => {
    console.log("📝 TextInput recibió foco")
    setIsFocused(true)
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true })
    }, 300)
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
    console.log("- selectedOptions:", selectedOptions)
    console.log("- userAnswer:", userAnswer)
    console.log("- answered:", answered)

    if (answered) return

    if (isOpenEndedQuestion) {
      if (userAnswer.trim()) {
        console.log("✅ Enviando respuesta abierta:", userAnswer)
        setIsCorrect(true)
        setAnswered(true)

        if (onSubmit) {
          onSubmit("OPEN", true, userAnswer)
        }
      }
    } else if (questionType === "MULTIPLE_CHOICE_SINGLE") {
      if (selectedOption) {
        const selected = options.find((option) => option.id === selectedOption)
        const correct = selected?.isCorrect || false

        console.log("✅ Enviando respuesta de opción única:", { selectedOption, correct })

        setIsCorrect(correct)
        setAnswered(true)

        if (onSubmit) {
          onSubmit(selectedOption, correct)
        }
      }
    } else if (questionType === "MULTIPLE_CHOICE_MULTIPLE") {
      if (selectedOptions.length > 0) {
        const selectedOptionObjects = options.filter((option) => selectedOptions.includes(option.id))
        const hasCorrectAnswer = selectedOptionObjects.some((option) => option.isCorrect)

        console.log("✅ Enviando respuesta de opción múltiple:", { selectedOptions, hasCorrectAnswer })

        setIsCorrect(hasCorrectAnswer)
        setAnswered(true)

        if (onSubmit) {
          onSubmit(selectedOptions, hasCorrectAnswer)
        }
      }
    }
  }

  const getOptionStyle = (optionId: string, isOptionCorrect?: boolean) => {
    if (!answered) {
      const isSelected =
        questionType === "MULTIPLE_CHOICE_SINGLE" ? selectedOption === optionId : selectedOptions.includes(optionId)

      return [styles.optionButton, isSelected && styles.selectedOption]
    } else {
      const isSelected =
        questionType === "MULTIPLE_CHOICE_SINGLE" ? selectedOption === optionId : selectedOptions.includes(optionId)

      if (isSelected) {
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
                  isTablet && styles.tabletOpenEndedInput,
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
            </View>
          </TouchableWithoutFeedback>

          <Text style={styles.characterCount}>{userAnswer.length} caracteres</Text>
        </View>
      )
    } else {
      console.log("📝 Renderizando opciones de opción múltiple")
      return (
        <ScrollView
          style={[styles.optionsContainer, isTablet && styles.tabletOptionsContainer]}
          showsVerticalScrollIndicator={true}
          nestedScrollEnabled={true}
          persistentScrollbar={true}
          indicatorStyle="white"
        >
          {options.map((option) => (
            <TouchableOpacity
              key={option.id}
              style={getOptionStyle(option.id, option.isCorrect)}
              onPress={() => handleOptionPress(option.id)}
              disabled={answered}
              activeOpacity={0.7}
            >
              {questionType === "MULTIPLE_CHOICE_MULTIPLE" ? (
                <View style={styles.checkboxContainer}>
                  <View
                    style={[
                      styles.checkbox,
                      selectedOptions.includes(option.id) && styles.checkboxSelected,
                      answered && option.isCorrect && styles.checkboxCorrect,
                      answered && selectedOptions.includes(option.id) && !option.isCorrect && styles.checkboxIncorrect,
                    ]}
                  >
                    {selectedOptions.includes(option.id) && <Text style={styles.checkmark}>✓</Text>}
                  </View>
                </View>
              ) : (
                <View style={styles.radioContainer}>
                  <View
                    style={[
                      styles.radioButton,
                      selectedOption === option.id && styles.radioButtonSelected,
                      answered && option.isCorrect && styles.radioButtonCorrect,
                      answered && selectedOption === option.id && !option.isCorrect && styles.radioButtonIncorrect,
                    ]}
                  >
                    {selectedOption === option.id && <View style={styles.radioButtonInner} />}
                  </View>
                </View>
              )}

              <View style={styles.optionContent}>
                <Text
                  style={[
                    styles.optionLabel,
                    isTablet && styles.tabletOptionLabel,
                    answered && option.isCorrect && styles.correctOptionText,
                    answered &&
                      ((questionType === "MULTIPLE_CHOICE_SINGLE" && selectedOption === option.id) ||
                        (questionType === "MULTIPLE_CHOICE_MULTIPLE" && selectedOptions.includes(option.id))) &&
                      !option.isCorrect &&
                      styles.incorrectOptionText,
                  ]}
                >
                  {option.id}.
                </Text>
                <Text
                  style={[
                    styles.optionText,
                    isTablet && styles.tabletOptionText,
                    answered && option.isCorrect
                      ? styles.correctOptionText
                      : answered &&
                        ((questionType === "MULTIPLE_CHOICE_SINGLE" && selectedOption === option.id) ||
                          (questionType === "MULTIPLE_CHOICE_MULTIPLE" && selectedOptions.includes(option.id))) &&
                        !option.isCorrect
                      ? styles.incorrectOptionText
                      : { color: "#000000" }, 
                  ]}
                >
                  {option.text}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
          <View style={styles.optionsBottomSpace} />
        </ScrollView>
      )
    }
  }

  const isOpenEndedQuestion = questionType === "OPEN_ENDED"

  const isSubmitDisabled = () => {
    if (isOpenEndedQuestion) {
      return !userAnswer.trim()
    } else if (questionType === "MULTIPLE_CHOICE_SINGLE") {
      return !selectedOption
    } else if (questionType === "MULTIPLE_CHOICE_MULTIPLE") {
      return selectedOptions.length === 0
    }
    return true
  }

  // 🔍 RENDERIZAR MODAL DEL AMPLIFICADOR - VERSIÓN AMIGABLE Y ENCANTADORA
  const renderAmplifierModal = () => {
    if (!amplifier || !amplifier.enabled) return null

    return (
      <Modal
        animationType="fade"
        transparent={true}
        visible={amplifierVisible}
        onRequestClose={() => setAmplifierVisible(false)}
        statusBarTranslucent={true}
      >
        <View style={styles.modalOverlay}>
          <StatusBar backgroundColor="rgba(0,0,0,0.7)" barStyle="light-content" />
          <SafeAreaView style={styles.modalContainer}>
            <View style={styles.modalContentFriendly}>
              {/* Decoración superior */}
              <View style={styles.topDecoration}>
                <Text style={styles.decorativeIcon}>📖</Text>
                <Text style={styles.readingTitle}>¡Hora de Leer!</Text>
                <Text style={styles.decorativeIcon}>✨</Text>
              </View>

              {/* Botón de cerrar amigable */}
              <TouchableOpacity
                style={styles.closeButtonFriendly}
                onPress={() => setAmplifierVisible(false)}
                activeOpacity={0.7}
              >
                <Text style={styles.closeButtonText}>❌</Text>
              </TouchableOpacity>

              {/* Contenedor de la pregunta con diseño de libro */}
              <ScrollView
                style={styles.bookContainer}
                contentContainerStyle={styles.bookContent}
                showsVerticalScrollIndicator={false}
              >
                {/* Decoración de esquinas */}
                <View style={styles.cornerDecorations}>
                  <Text style={[styles.cornerIcon, { top: 10, left: 10 }]}>🌟</Text>
                  <Text style={[styles.cornerIcon, { top: 10, right: 10 }]}>🌟</Text>
                  <Text style={[styles.cornerIcon, { bottom: 10, left: 10 }]}>🌟</Text>
                  <Text style={[styles.cornerIcon, { bottom: 10, right: 10 }]}>🌟</Text>
                </View>

                {/* La pregunta principal */}
                <View style={styles.questionBookPage}>
                  <Text style={styles.questionFriendlyText}>{question}</Text>
                </View>

                {/* Decoración inferior */}
                <View style={styles.bottomDecoration}>
                  <Text style={styles.encouragementText}>💡 ¡Tómate tu tiempo para leer! 💡</Text>
                </View>
              </ScrollView>

              {/* Botón de continuar amigable */}
              <TouchableOpacity
                style={styles.continueButtonFriendly}
                onPress={() => setAmplifierVisible(false)}
                activeOpacity={0.8}
              >
                <Text style={styles.continueButtonFriendlyText}>🚀 ¡Entendido, vamos!</Text>
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </View>
      </Modal>
    )
  }

  return (
    <ImageBackground source={backgroundImage} style={styles.background} resizeMode="cover">
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="light-content" backgroundColor="transparent" translucent={true} />

        {/* 🔍 BOTÓN FLOTANTE DEL AMPLIFICADOR */}
        {amplifier && amplifier.enabled && showAmplifierButton && (
          <TouchableOpacity style={styles.floatingButton} onPress={() => setAmplifierVisible(true)} activeOpacity={0.8}>
            <Ionicons name="search" size={24} color="white" />
          </TouchableOpacity>
        )}

        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.keyboardAvoidingView}
          keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <ScrollView
              ref={scrollViewRef}
              contentContainerStyle={styles.scrollContainer}
              showsVerticalScrollIndicator={true}
              persistentScrollbar={true}
              indicatorStyle="white"
              bounces={true}
            >
              <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
                <Text style={[styles.missionTitle, isTablet && styles.tabletMissionTitle]}>Misión {missionNumber}</Text>

                <Image
                  source={characterImage}
                  style={[styles.characterImage, isTablet && styles.tabletCharacterImage]}
                />

                <View style={[styles.questionContainer, isTablet && styles.tabletQuestionContainer]}>
                  <ScrollView
                    style={styles.questionScrollView}
                    contentContainerStyle={styles.questionScrollContent}
                    showsVerticalScrollIndicator={true}
                    persistentScrollbar={true}
                    indicatorStyle="black"
                    nestedScrollEnabled={true}
                  >
                    <Text style={[styles.questionText, isTablet && styles.tabletQuestionText]}>{question}</Text>
                  </ScrollView>

                  {renderOptions()}
                </View>

                {!answered && (
                  <TouchableOpacity
                    style={[
                      styles.submitButton,
                      isSubmitDisabled() ? styles.disabledButton : null,
                      isTablet && styles.tabletSubmitButton,
                    ]}
                    onPress={handleSubmit}
                    disabled={isSubmitDisabled()}
                  >
                    <Text style={[styles.submitButtonText, isTablet && styles.tabletSubmitButtonText]}>
                      {isOpenEndedQuestion
                        ? "Enviar Respuesta"
                        : questionType === "MULTIPLE_CHOICE_MULTIPLE" && selectedOptions.length > 1
                          ? `Enviar (${selectedOptions.length})`
                          : "Enviar"}
                    </Text>
                  </TouchableOpacity>
                )}
              </Animated.View>
            </ScrollView>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>

        {/* 🔍 MODAL DEL AMPLIFICADOR */}
        {renderAmplifierModal()}
      </SafeAreaView>
    </ImageBackground>
  )
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    width: "100%",
  },
  safeArea: {
    flex: 1,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingVertical: 20,
  },
  container: {
    flex: 1,
    alignItems: "center",
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
  tabletMissionTitle: {
    fontSize: 36,
    marginBottom: 15,
  },
  characterImage: {
    width: width * 0.5,
    height: width * 0.5,
    resizeMode: "contain",
    marginBottom: 20,
  },
  tabletCharacterImage: {
    width: width * 0.4,
    height: width * 0.4,
  },
  questionContainer: {
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    borderRadius: 15,
    padding: 15,
    width: width * 0.85,
    marginBottom: 20,
    maxHeight: undefined,
  },
  tabletQuestionContainer: {
    width: width * 0.75,
    padding: 20,
    borderRadius: 20,
  },
  questionScrollView: {
    maxHeight: 150,
  },
  questionScrollContent: {
    paddingBottom: 10,
  },
  questionText: {
    fontSize: 16,
    marginBottom: 15,
    textAlign: "center",
    fontWeight: "500",
    color: "#333",
  },
  tabletQuestionText: {
    fontSize: 20,
    marginBottom: 20,
  },
  optionsContainer: {
    width: "100%",
    maxHeight: 300,
  },
  tabletOptionsContainer: {
    maxHeight: 400,
  },
  optionsBottomSpace: {
    height: 20,
  },
  optionButton: {
    backgroundColor: "#E0E0E0",
    borderRadius: 10,
    padding: 12,
    marginVertical: 5,
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
    fontSize: 14,
    fontWeight: "bold",
    marginRight: 8,
    minWidth: 20,
    color: "#000000", // ← NEGRO PURO

  },
  tabletOptionLabel: {
    fontSize: 18,
    minWidth: 25,
    color: "#000000", // ← NEGRO PURO

  },
  optionText: {
    fontSize: 14,
    flex: 1,
    flexWrap: "wrap",
    color: "#000000", // ← NEGRO PURO

  },
  tabletOptionText: {
    fontSize: 18,
    color: "#000000", // ← NEGRO PURO
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
  tabletSubmitButton: {
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 30,
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
  tabletSubmitButtonText: {
    fontSize: 20,
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
  tabletOpenEndedInput: {
    minHeight: 200,
    maxHeight: 300,
    fontSize: 18,
    lineHeight: 26,
    padding: 20,
    borderRadius: 15,
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
  characterCount: {
    fontSize: 12,
    color: "#666",
    textAlign: "right",
    marginTop: 5,
    fontStyle: "italic",
  },
  checkboxContainer: {
    marginRight: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: "#666",
    borderRadius: 4,
    backgroundColor: "transparent",
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxSelected: {
    backgroundColor: "#4CAF50",
    borderColor: "#4CAF50",
  },
  checkboxCorrect: {
    backgroundColor: "#4CAF50",
    borderColor: "#4CAF50",
  },
  checkboxIncorrect: {
    backgroundColor: "#F44336",
    borderColor: "#F44336",
  },
  checkmark: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  radioContainer: {
    marginRight: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  radioButton: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: "#666",
    borderRadius: 12,
    backgroundColor: "transparent",
    alignItems: "center",
    justifyContent: "center",
  },
  radioButtonSelected: {
    borderColor: "#4CAF50",
  },
  radioButtonCorrect: {
    borderColor: "#4CAF50",
  },
  radioButtonIncorrect: {
    borderColor: "#F44336",
  },
  radioButtonInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#4CAF50",
  },
  optionContent: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",

  },

  // 🔍 ESTILOS DEL AMPLIFICADOR
  floatingButton: {
    position: "absolute",
    top: 50,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#2563EB",
    justifyContent: "center",
    alignItems: "center",
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    zIndex: 1000,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    flex: 1,
    width: "100%",
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  modalContent: {
    flex: 1,
    backgroundColor: "white",
    borderRadius: 16,
    maxHeight: height * 0.9,
    overflow: "hidden",
  },

  // Header
  modalHeader: {
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1F2937",
    flex: 1,
    marginRight: 16,
  },
  closeButton: {
    padding: 4,
  },
  badgeContainer: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 16,
  },
  badge: {
    backgroundColor: "#F3F4F6",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#D1D5DB",
  },
  badgeText: {
    fontSize: 14,
    color: "#374151",
    fontWeight: "500",
  },
  difficultyBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  difficultyText: {
    fontSize: 14,
    color: "white",
    fontWeight: "600",
  },
  modalDescription: {
    fontSize: 18,
    color: "#6B7280",
    lineHeight: 26,
  },

  // Contenido scrolleable
  scrollContent: {
    flex: 1,
    paddingHorizontal: 24,
  },

  // Tarjeta de información
  questionInfoCard: {
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    padding: 20,
    marginVertical: 16,
    borderLeftWidth: 4,
    borderLeftColor: "#3B82F6",
  },
  questionInfoHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 16,
  },
  questionInfoText: {
    flex: 1,
  },
  questionTypeLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 8,
  },
  questionMetadata: {
    gap: 8,
  },
  metadataItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  metadataText: {
    fontSize: 14,
    color: "#6B7280",
  },

  // Tarjeta de pregunta
  questionCard: {
    backgroundColor: "#EFF6FF",
    borderRadius: 12,
    padding: 24,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: "#BFDBFE",
  },
  questionLabel: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1F2937",
    marginBottom: 12,
  },

  // Tarjeta de opciones
  optionsCard: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  optionsLabel: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1F2937",
    marginBottom: 16,
  },
  optionsList: {
    gap: 12,
  },
  optionItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    padding: 16,
    backgroundColor: "#F9FAFB",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  optionId: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#DBEAFE",
    justifyContent: "center",
    alignItems: "center",
  },
  optionIdText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1D4ED8",
  },
  optionTextModal: {
    fontSize: 16,
    lineHeight: 24,
    color: "#374151",
    flex: 1,
  },

  // Tarjeta de instrucciones
  instructionsCard: {
    backgroundColor: "#FFFBEB",
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#FDE68A",
  },
  instructionsHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  instructionsTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#92400E",
  },
  instructionsText: {
    fontSize: 14,
    lineHeight: 20,
    color: "#B45309",
  },

  // Footer
  modalFooter: {
    padding: 24,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  continueButton: {
    backgroundColor: "#2563EB",
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: "center",
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "white",
  },

  // 🔍 ESTILOS SIMPLIFICADOS PARA EL MODAL
  modalContentSimple: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.9)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 60,
  },
  closeButtonSimple: {
    position: "absolute",
    top: 50,
    right: 20,
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  questionOnlyContainer: {
    flex: 1,
    width: "100%",
  },
  questionOnlyContent: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  questionOnlyText: {
    fontSize: 28,
    lineHeight: 40,
    color: "#fff",
    textAlign: "center",
    fontWeight: "500",
    letterSpacing: 0.5,
    textShadowColor: "rgba(0, 0, 0, 0.5)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },

  // 📖 ESTILOS AMIGABLES PARA EL MODAL
  modalContentFriendly: {
    flex: 1,
    backgroundColor: "transparent",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 40,
  },
  topDecoration: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  decorativeIcon: {
    fontSize: 24,
    marginHorizontal: 8,
  },
  readingTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#2D3748",
    marginHorizontal: 10,
  },
  closeButtonFriendly: {
    position: "absolute",
    top: 50,
    right: 20,
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  closeButtonText: {
    fontSize: 20,
  },
  bookContainer: {
    flex: 1,
    width: "100%",
    maxWidth: width * 0.9,
  },
  bookContent: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 20,
  },
  cornerDecorations: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1,
    pointerEvents: "none",
  },
  cornerIcon: {
    position: "absolute",
    fontSize: 16,
    color: "#FFD700",
  },
  questionBookPage: {
    backgroundColor: "rgba(255, 255, 255, 0.98)",
    borderRadius: 20,
    padding: 30,
    marginHorizontal: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
    borderWidth: 3,
    borderColor: "#E2E8F0",
    position: "relative",
    // Gradiente simulado con múltiples sombras
    shadowColor: "#4299E1",
  },
  questionFriendlyText: {
    fontSize: 24,
    lineHeight: 36,
    color: "#2D3748",
    textAlign: "center",
    fontWeight: "500",
    letterSpacing: 0.5,
    fontFamily: Platform.OS === "ios" ? "Georgia" : "serif",
  },
  bottomDecoration: {
    marginTop: 20,
    backgroundColor: "rgba(72, 187, 120, 0.9)",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  encouragementText: {
    fontSize: 16,
    color: "white",
    textAlign: "center",
    fontWeight: "600",
  },
  continueButtonFriendly: {
    backgroundColor: "#4299E1",
    paddingVertical: 16,
    paddingHorizontal: 30,
    borderRadius: 25,
    marginTop: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
    borderWidth: 2,
    borderColor: "#63B3ED",
  },
  continueButtonFriendlyText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "white",
    textAlign: "center",
  },
})
