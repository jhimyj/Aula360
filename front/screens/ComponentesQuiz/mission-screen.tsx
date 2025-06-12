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

  // 🔍 RENDERIZAR MODAL DEL AMPLIFICADOR - VERSIÓN PROFESIONAL MEJORADA
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
          <StatusBar backgroundColor="rgba(0,0,0,0.8)" barStyle="light-content" />
          <SafeAreaView style={styles.modalContainer}>
            <View style={styles.modalContentProfessional}>
              {/* Header profesional */}
              <View style={styles.professionalHeader}>
                <View style={styles.headerContent}>
                  <View style={styles.headerIcon}>
                    <Ionicons name="book-outline" size={24} color="#2563EB" />
                  </View>
                  <View style={styles.headerText}>
                    <Text style={styles.professionalTitle}>Modo Lectura</Text>
                    <Text style={styles.professionalSubtitle}>Pregunta {missionNumber}</Text>
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.closeButtonProfessional}
                  onPress={() => setAmplifierVisible(false)}
                  activeOpacity={0.7}
                >
                  <Ionicons name="close" size={24} color="#64748B" />
                </TouchableOpacity>
              </View>

              {/* Contenedor principal con scroll mejorado */}
              <View style={styles.contentWrapper}>
                <ScrollView
                  style={styles.professionalScrollContainer}
                  contentContainerStyle={styles.professionalScrollContent}
                  showsVerticalScrollIndicator={true}
                  persistentScrollbar={true}
                  indicatorStyle="default"
                  bounces={true}
                  alwaysBounceVertical={false}
                  scrollEventThrottle={16}
                >
                  {/* Indicador de scroll */}
                  <View style={styles.scrollIndicator}>
                    <Ionicons name="chevron-down" size={16} color="#94A3B8" />
                    <Text style={styles.scrollIndicatorText}>Desliza para leer todo el contenido</Text>
                  </View>

                  {/* Contenido de la pregunta */}
                  <View style={styles.questionContentCard}>
                    <View style={styles.questionHeader}>
                      <View style={styles.questionTypeIndicator}>
                        <Ionicons name={getTypeIcon(questionType)} size={20} color="#2563EB" />
                        <Text style={styles.questionTypeText}>{getTypeLabel(questionType)}</Text>
                      </View>

                      {difficulty && (
                        <View
                          style={[
                            styles.difficultyBadgeProfessional,
                            { backgroundColor: getDifficultyColor(difficulty) },
                          ]}
                        >
                          <Text style={styles.difficultyTextProfessional}>{difficulty}</Text>
                        </View>
                      )}
                    </View>

                    {/* Pregunta principal */}
                    <View style={styles.questionTextContainer}>
                      <Text style={styles.questionTextProfessional}>{question}</Text>
                    </View>

                    {/* Opciones si las hay */}
                    {!isOpenEndedQuestion && options.length > 0 && (
                      <View style={styles.optionsPreview}>
                        <Text style={styles.optionsPreviewTitle}>Opciones disponibles:</Text>
                        <View style={styles.optionsPreviewList}>
                          {options.map((option, index) => (
                            <View key={option.id} style={styles.optionPreviewItem}>
                              <View style={styles.optionPreviewBullet}>
                                <Text style={styles.optionPreviewBulletText}>{option.id}</Text>
                              </View>
                              <Text style={styles.optionPreviewText}>{option.text}</Text>
                            </View>
                          ))}
                        </View>
                      </View>
                    )}

                    {/* Tags si los hay */}
                    {tags && tags.length > 0 && (
                      <View style={styles.tagsContainer}>
                        <Text style={styles.tagsTitle}>Temas:</Text>
                        <View style={styles.tagsList}>
                          {tags.map((tag, index) => (
                            <View key={index} style={styles.tagItem}>
                              <Text style={styles.tagText}>{tag}</Text>
                            </View>
                          ))}
                        </View>
                      </View>
                    )}

                    {/* Información adicional */}
                    <View style={styles.additionalInfo}>
                      <View style={styles.infoItem}>
                        <Ionicons name="time-outline" size={16} color="#64748B" />
                        <Text style={styles.infoText}>Tómate el tiempo necesario para leer</Text>
                      </View>

                      {score && (
                        <View style={styles.infoItem}>
                          <Ionicons name="star-outline" size={16} color="#64748B" />
                          <Text style={styles.infoText}>Puntuación: {score} puntos</Text>
                        </View>
                      )}
                    </View>
                  </View>

                  {/* Espaciado inferior para mejor scroll */}
                  <View style={styles.bottomSpacing} />
                </ScrollView>

                {/* Indicador de scroll inferior */}
                <View style={styles.scrollHint}>
                  <View style={styles.scrollHintLine} />
                  <Text style={styles.scrollHintText}>Desliza hacia arriba para ver más contenido</Text>
                  <View style={styles.scrollHintLine} />
                </View>
              </View>

              {/* Footer profesional */}
              <View style={styles.professionalFooter}>
                <TouchableOpacity
                  style={styles.continueButtonProfessional}
                  onPress={() => setAmplifierVisible(false)}
                  activeOpacity={0.8}
                >
                  <Ionicons name="checkmark-circle-outline" size={20} color="white" />
                  <Text style={styles.continueButtonProfessionalText}>Continuar con la pregunta</Text>
                </TouchableOpacity>
              </View>
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
            <Ionicons name="book-outline" size={24} color="white" />
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

        {/* 🔍 MODAL DEL AMPLIFICADOR PROFESIONAL */}
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
    color: "#000000",
  },
  tabletOptionLabel: {
    fontSize: 18,
    minWidth: 25,
    color: "#000000",
  },
  optionText: {
    fontSize: 14,
    flex: 1,
    flexWrap: "wrap",
    color: "#000000",
  },
  tabletOptionText: {
    fontSize: 18,
    color: "#000000",
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

  // 📖 ESTILOS PROFESIONALES PARA EL MODAL
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.85)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    flex: 1,
    width: "100%",
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 20,
  },
  modalContentProfessional: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 20,
  },

  // Header profesional
  professionalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingVertical: 20,
    backgroundColor: "#F8FAFC",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  headerIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#EBF4FF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  headerText: {
    flex: 1,
  },
  professionalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1E293B",
    marginBottom: 2,
  },
  professionalSubtitle: {
    fontSize: 14,
    color: "#64748B",
    fontWeight: "500",
  },
  closeButtonProfessional: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F1F5F9",
    justifyContent: "center",
    alignItems: "center",
  },

  // Contenedor principal
  contentWrapper: {
    flex: 1,
    position: "relative",
  },
  professionalScrollContainer: {
    flex: 1,
  },
  professionalScrollContent: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 40,
  },

  // Indicador de scroll
  scrollIndicator: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    marginBottom: 20,
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  scrollIndicatorText: {
    fontSize: 12,
    color: "#64748B",
    marginLeft: 8,
    fontWeight: "500",
  },

  // Tarjeta de contenido
  questionContentCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },

  // Header de la pregunta
  questionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  questionTypeIndicator: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EBF4FF",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  questionTypeText: {
    fontSize: 14,
    color: "#2563EB",
    fontWeight: "600",
    marginLeft: 8,
  },
  difficultyBadgeProfessional: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  difficultyTextProfessional: {
    fontSize: 12,
    color: "white",
    fontWeight: "700",
    textTransform: "uppercase",
  },

  // Contenedor de la pregunta
  questionTextContainer: {
    marginBottom: 24,
  },
  questionTextProfessional: {
    fontSize: 18,
    lineHeight: 28,
    color: "#1E293B",
    fontWeight: "500",
    textAlign: "left",
  },

  // Preview de opciones
  optionsPreview: {
    marginBottom: 24,
  },
  optionsPreviewTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 12,
  },
  optionsPreviewList: {
    gap: 12,
  },
  optionPreviewItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#F8FAFC",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  optionPreviewBullet: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#2563EB",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
    flexShrink: 0,
  },
  optionPreviewBulletText: {
    fontSize: 14,
    fontWeight: "700",
    color: "white",
  },
  optionPreviewText: {
    fontSize: 15,
    lineHeight: 22,
    color: "#374151",
    flex: 1,
  },

  // Tags
  tagsContainer: {
    marginBottom: 24,
  },
  tagsTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#64748B",
    marginBottom: 8,
  },
  tagsList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  tagItem: {
    backgroundColor: "#F1F5F9",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  tagText: {
    fontSize: 12,
    color: "#475569",
    fontWeight: "500",
  },

  // Información adicional
  additionalInfo: {
    gap: 12,
  },
  infoItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  infoText: {
    fontSize: 14,
    color: "#64748B",
    marginLeft: 8,
    fontWeight: "500",
  },

  // Espaciado inferior
  bottomSpacing: {
    height: 60,
  },

  // Indicador de scroll inferior
  scrollHint: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    backgroundColor: "rgba(248, 250, 252, 0.95)",
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
  },
  scrollHintLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#CBD5E1",
    marginHorizontal: 16,
  },
  scrollHintText: {
    fontSize: 11,
    color: "#64748B",
    fontWeight: "500",
    textAlign: "center",
  },

  // Footer profesional
  professionalFooter: {
    paddingHorizontal: 24,
    paddingVertical: 20,
    backgroundColor: "#F8FAFC",
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
  },
  continueButtonProfessional: {
    flexDirection: "row",
    backgroundColor: "#2563EB",
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#2563EB",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  continueButtonProfessionalText: {
    fontSize: 16,
    fontWeight: "600",
    color: "white",
    marginLeft: 8,
  },
})
