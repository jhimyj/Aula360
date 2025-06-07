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
import { Feather } from "@expo/vector-icons"

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
}

const { width, height } = Dimensions.get("window")
const isTablet = width >= 768;

// Límites de caracteres para mostrar "Ver más..."
const MOBILE_CHAR_LIMIT = 150;
const TABLET_CHAR_LIMIT = 300;

export const MissionScreen = ({
  missionNumber,
  backgroundImage,
  characterImage,
  question,
  questionType = "MULTIPLE_CHOICE_SINGLE",
  options,
  onSubmit,
}: MissionScreenProps) => {
  // Estados existentes
  const [selectedOption, setSelectedOption] = useState<string | null>(null)
  const [selectedOptions, setSelectedOptions] = useState<string[]>([])
  const [userAnswer, setUserAnswer] = useState<string>("")
  const [answered, setAnswered] = useState<boolean>(false)
  const [isCorrect, setIsCorrect] = useState<boolean>(false)
  const [fadeAnim] = useState(new Animated.Value(0))
  const [isFocused, setIsFocused] = useState<boolean>(false)
  const [dimensions, setDimensions] = useState(Dimensions.get('window'))
  
  // Nuevos estados para el modal de pregunta
  const [showQuestionModal, setShowQuestionModal] = useState<boolean>(false)
  const [modalFadeAnim] = useState(new Animated.Value(0))
  const [modalScaleAnim] = useState(new Animated.Value(0.8))
  
  const textInputRef = useRef<TextInput>(null)
  const scrollViewRef = useRef<ScrollView>(null)

  // Actualizar dimensiones cuando cambia la orientación
  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setDimensions(window);
    });
    
    return () => {
      if (subscription?.remove) {
        subscription.remove();
      }
    };
  }, []);

  // Reset states when mission changes
  useEffect(() => {
    console.log("🔄 MISSION SCREEN - Reseteando estados para nueva misión")
    setSelectedOption(null)
    setSelectedOptions([])
    setUserAnswer("")
    setAnswered(false)
    setIsCorrect(false)
    setIsFocused(false)
    setShowQuestionModal(false)
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

  // Función para determinar si la pregunta necesita modal
  const shouldShowModal = () => {
    const charLimit = isTablet ? TABLET_CHAR_LIMIT : MOBILE_CHAR_LIMIT;
    return question.length > charLimit;
  }

  // Función para obtener texto truncado
  const getTruncatedQuestion = () => {
    const charLimit = isTablet ? TABLET_CHAR_LIMIT : MOBILE_CHAR_LIMIT;
    if (question.length <= charLimit) {
      return question;
    }
    return question.substring(0, charLimit) + "...";
  }

  // Funciones para manejar el modal
  const openQuestionModal = () => {
    setShowQuestionModal(true);
    Animated.parallel([
      Animated.timing(modalFadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.spring(modalScaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();
  }

  const closeQuestionModal = () => {
    Animated.parallel([
      Animated.timing(modalFadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(modalScaleAnim, {
        toValue: 0.8,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setShowQuestionModal(false);
    });
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
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 300);
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

  const renderQuestionText = () => {
    const needsModal = shouldShowModal();
    
    if (!needsModal) {
      // Si no necesita modal, mostrar la pregunta completa
      return (
        <Text style={[
          styles.questionText,
          isTablet && styles.tabletQuestionText
        ]}>
          {question}
        </Text>
      );
    }

    // Si necesita modal, mostrar texto truncado con botón "Ver más"
    return (
      <View style={styles.questionWithButton}>
        <Text style={[
          styles.questionText,
          isTablet && styles.tabletQuestionText
        ]}>
          {getTruncatedQuestion()}
        </Text>
        <TouchableOpacity 
          style={[
            styles.seeMoreButton,
            isTablet && styles.tabletSeeMoreButton
          ]} 
          onPress={openQuestionModal}
          activeOpacity={0.7}
        >
          <Feather 
            name="eye" 
            size={isTablet ? 18 : 16} 
            color="#4CAF50" 
            style={styles.seeMoreIcon} 
          />
          <Text style={[
            styles.seeMoreText,
            isTablet && styles.tabletSeeMoreText
          ]}>
            Ver más...
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  const renderQuestionModal = () => {
    return (
      <Modal
        visible={showQuestionModal}
        transparent={true}
        animationType="none"
        onRequestClose={closeQuestionModal}
      >
        <View style={styles.modalOverlay}>
          <TouchableWithoutFeedback onPress={closeQuestionModal}>
            <View style={styles.modalBackdrop} />
          </TouchableWithoutFeedback>
          
          <Animated.View 
            style={[
              styles.modalContainer,
              isTablet && styles.tabletModalContainer,
              {
                opacity: modalFadeAnim,
                transform: [{ scale: modalScaleAnim }]
              }
            ]}
          >
            {/* Header del modal */}
            <View style={[
              styles.modalHeader,
              isTablet && styles.tabletModalHeader
            ]}>
              <Text style={[
                styles.modalTitle,
                isTablet && styles.tabletModalTitle
              ]}>
                Pregunta - Misión {missionNumber}
              </Text>
              <TouchableOpacity 
                style={[
                  styles.closeButton,
                  isTablet && styles.tabletCloseButton
                ]} 
                onPress={closeQuestionModal}
                activeOpacity={0.7}
              >
                <Feather 
                  name="x" 
                  size={isTablet ? 28 : 24} 
                  color="#666" 
                />
              </TouchableOpacity>
            </View>

            {/* Contenido del modal */}
            <ScrollView 
              style={styles.modalContent}
              contentContainerStyle={[
                styles.modalContentContainer,
                isTablet && styles.tabletModalContentContainer
              ]}
              showsVerticalScrollIndicator={true}
              persistentScrollbar={true}
              indicatorStyle="black"
            >
              <Text style={[
                styles.modalQuestionText,
                isTablet && styles.tabletModalQuestionText
              ]}>
                {question}
              </Text>
            </ScrollView>

            {/* Footer del modal */}
            <View style={[
              styles.modalFooter,
              isTablet && styles.tabletModalFooter
            ]}>
              <TouchableOpacity 
                style={[
                  styles.modalCloseButton,
                  isTablet && styles.tabletModalCloseButton
                ]} 
                onPress={closeQuestionModal}
                activeOpacity={0.8}
              >
                <Text style={[
                  styles.modalCloseButtonText,
                  isTablet && styles.tabletModalCloseButtonText
                ]}>
                  Entendido
                </Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      </Modal>
    );
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
                  isTablet && styles.tabletOpenEndedInput
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
          style={[
            styles.optionsContainer,
            isTablet && styles.tabletOptionsContainer
          ]} 
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
                    answered && option.isCorrect && styles.correctOptionText,
                    answered &&
                      ((questionType === "MULTIPLE_CHOICE_SINGLE" && selectedOption === option.id) ||
                        (questionType === "MULTIPLE_CHOICE_MULTIPLE" && selectedOptions.includes(option.id))) &&
                      !option.isCorrect &&
                      styles.incorrectOptionText,
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
                <Text style={[styles.missionTitle, isTablet && styles.tabletMissionTitle]}>
                  Misión {missionNumber}
                </Text>

                <Image 
                  source={characterImage} 
                  style={[
                    styles.characterImage,
                    isTablet && styles.tabletCharacterImage
                  ]} 
                />

                <View style={[
                  styles.questionContainer,
                  isTablet && styles.tabletQuestionContainer
                ]}>
                  {/* Renderizar pregunta con o sin modal según sea necesario */}
                  {renderQuestionText()}

                  {/* Opciones o campo de texto según el tipo */}
                  {renderOptions()}
                </View>

                {!answered && (
                  <TouchableOpacity
                    style={[
                      styles.submitButton, 
                      isSubmitDisabled() ? styles.disabledButton : null,
                      isTablet && styles.tabletSubmitButton
                    ]}
                    onPress={handleSubmit}
                    disabled={isSubmitDisabled()}
                  >
                    <Text style={[
                      styles.submitButtonText,
                      isTablet && styles.tabletSubmitButtonText
                    ]}>
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

        {/* Modal para pregunta completa */}
        {renderQuestionModal()}
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
  },
  tabletQuestionContainer: {
    width: width * 0.75,
    padding: 20,
    borderRadius: 20,
  },
  questionWithButton: {
    marginBottom: 15,
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
  seeMoreButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(76, 175, 80, 0.1)",
    borderWidth: 1,
    borderColor: "#4CAF50",
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 15,
    marginTop: 5,
  },
  tabletSeeMoreButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 25,
  },
  seeMoreIcon: {
    marginRight: 5,
  },
  seeMoreText: {
    color: "#4CAF50",
    fontSize: 14,
    fontWeight: "600",
  },
  tabletSeeMoreText: {
    fontSize: 16,
  },
  // Estilos del Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalBackdrop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  modalContainer: {
    backgroundColor: "white",
    borderRadius: 20,
    width: width * 0.9,
    maxHeight: height * 0.8,
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  tabletModalContainer: {
    width: width * 0.7,
    maxHeight: height * 0.7,
    borderRadius: 25,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  tabletModalHeader: {
    padding: 25,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    flex: 1,
  },
  tabletModalTitle: {
    fontSize: 22,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F5F5F5",
    justifyContent: "center",
    alignItems: "center",
  },
  tabletCloseButton: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
  },
  modalContent: {
    flex: 1,
  },
  modalContentContainer: {
    padding: 20,
  },
  tabletModalContentContainer: {
    padding: 25,
  },
  modalQuestionText: {
    fontSize: 16,
    lineHeight: 24,
    color: "#333",
    textAlign: "justify",
  },
  tabletModalQuestionText: {
    fontSize: 20,
    lineHeight: 28,
  },
  modalFooter: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: "#E0E0E0",
  },
  tabletModalFooter: {
    padding: 25,
  },
  modalCloseButton: {
    backgroundColor: "#4CAF50",
    borderRadius: 25,
    paddingVertical: 12,
    paddingHorizontal: 30,
    alignItems: "center",
  },
  tabletModalCloseButton: {
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 30,
  },
  modalCloseButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  tabletModalCloseButtonText: {
    fontSize: 18,
  },
  // Resto de estilos existentes...
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
  },
  tabletOptionLabel: {
    fontSize: 18,
    minWidth: 25,
  },
  optionText: {
    fontSize: 14,
    flex: 1,
    flexWrap: "wrap",
  },
  tabletOptionText: {
    fontSize: 18,
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
})