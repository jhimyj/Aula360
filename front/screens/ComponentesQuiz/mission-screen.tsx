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
} from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { ReadingModeOverlay } from "../ComponentesQuiz/reading-mode-modal" // 🔥 NUEVO OVERLAY

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

  // 🔥 NUEVO ESTADO PARA EL OVERLAY
  const [overlayVisible, setOverlayVisible] = useState(false)

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
    setSelectedOption(null)
    setSelectedOptions([])
    setUserAnswer("")
    setAnswered(false)
    setIsCorrect(false)
    setIsFocused(false)
    setOverlayVisible(false) // 🔥 RESETEAR OVERLAY
  }, [missionNumber, question])

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start()
  }, [missionNumber])

  const handleOptionPress = (optionId: string) => {
    if (!answered && (questionType === "MULTIPLE_CHOICE_SINGLE" || questionType === "MULTIPLE_CHOICE_MULTIPLE")) {
      if (questionType === "MULTIPLE_CHOICE_SINGLE") {
        setSelectedOption(optionId)
      } else if (questionType === "MULTIPLE_CHOICE_MULTIPLE") {
        setSelectedOptions((prev) => {
          if (prev.includes(optionId)) {
            return prev.filter((id) => id !== optionId)
          } else {
            return [...prev, optionId]
          }
        })
      }
    }
  }

  const handleTextInputFocus = () => {
    setIsFocused(true)
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true })
    }, 300)
  }

  const handleTextInputBlur = () => setIsFocused(false)

  const handleTextInputPress = () => {
    if (textInputRef.current && !answered) {
      textInputRef.current.focus()
    }
  }

  const handleSubmit = () => {
    const isOpenEndedQuestion = questionType === "OPEN_ENDED"

    if (answered) return

    if (isOpenEndedQuestion) {
      if (userAnswer.trim()) {
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

    if (isOpenEndedQuestion) {
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
                onChangeText={setUserAnswer}
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
      return (
        <ScrollView
          style={[styles.optionsContainer, isTablet && styles.tabletOptionsContainer]}
          showsVerticalScrollIndicator={true}
          nestedScrollEnabled={true}
          persistentScrollbar={true}
          indicatorStyle="white"
          removeClippedSubviews={false}
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

  return (
    <ImageBackground source={backgroundImage} style={styles.background} resizeMode="cover">
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="light-content" backgroundColor="transparent" translucent={true} />

        {/* 🔥 BOTÓN FLOTANTE PARA ABRIR OVERLAY */}
        {amplifier && amplifier.enabled && (
          <TouchableOpacity style={styles.floatingButton} onPress={() => setOverlayVisible(true)} activeOpacity={0.8}>
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
              removeClippedSubviews={false}
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
                    removeClippedSubviews={false}
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

        {/* 🔥 OVERLAY ABSOLUTO QUE SÍ FUNCIONA */}
        <ReadingModeOverlay
          visible={overlayVisible}
          onClose={() => setOverlayVisible(false)}
          missionNumber={missionNumber}
          question={question}
          questionType={questionType}
          options={options}
          difficulty={difficulty}
          tags={tags}
          score={score}
        />
      </SafeAreaView>
    </ImageBackground>
  )
}

// ESTILOS (los mismos de antes, solo cambié el import)
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

  // 🔥 BOTÓN FLOTANTE
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
})
