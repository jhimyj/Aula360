import { useState, useEffect } from "react"
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  Dimensions,
  Modal,
} from "react-native"
import { useNavigation, useRoute } from "@react-navigation/native"
import { Feather } from "@expo/vector-icons"
import {
  useFonts,
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
  Poppins_700Bold,
} from "@expo-google-fonts/poppins"
import {
  useQuestions,
  type QuestionType,
  type DifficultyLevel,
  type Question,
} from "../../components/hooks/useQuestions"
import { QuestionTypeCard, DifficultyBadge, OptionInput, TagInput } from "../../components/Evaluation/QuestionTypes"
import AsyncStorage from "@react-native-async-storage/async-storage"
import axios from "axios"

const { height: screenHeight } = Dimensions.get("window")

// Tipos para las recomendaciones de IA
interface AIQuestion {
  type: QuestionType
  text: string
  score: number
  tags?: string[]
  difficulty: DifficultyLevel
  config: {
    options?: string[]
  }
}

interface AIRecommendationResponse {
  success: boolean
  code: string
  message: string
  data: AIQuestion[]
  request_id: string
}

export default function UploadEvaluationScreenEnhanced() {
  const navigation = useNavigation()
  const route = useRoute()
  const { roomId, roomName } = route.params as { roomId: string; roomName: string }

  const { createQuestion, createQuestionsList, loading: questionsLoading, error } = useQuestions()

  // Estados principales del flujo
  const [flowType, setFlowType] = useState<"ai" | "manual">("ai")
  const [step, setStep] = useState(1)

  // Estados para flujo IA
  const [questionCount, setQuestionCount] = useState(1)
  const [userPrompt, setUserPrompt] = useState("")
  const [aiQuestions, setAiQuestions] = useState<AIQuestion[]>([])
  const [editedQuestions, setEditedQuestions] = useState<Question[]>([])
  const [isGeneratingAI, setIsGeneratingAI] = useState(false)
  const [aiError, setAiError] = useState<string | null>(null)

  // 🔧 Estado para acumular todas las preguntas generadas
  const [allGeneratedQuestions, setAllGeneratedQuestions] = useState<Question[]>([])

  // Estados para flujo manual - MÚLTIPLES PREGUNTAS
  const [manualQuestions, setManualQuestions] = useState<Question[]>([])
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [currentQuestion, setCurrentQuestion] = useState<Partial<Question>>({
    room_id: roomId,
    type: "MULTIPLE_CHOICE_SINGLE",
    text: "",
    score: 200,
    difficulty: "EASY",
    config: { options: ["", ""] },
    tags: [],
  })
  const [isFormValid, setIsFormValid] = useState(false)

  // 🆕 Estados para el modal de opciones y eliminación
  const [showGenerateOptions, setShowGenerateOptions] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [questionToDelete, setQuestionToDelete] = useState<number | null>(null)

  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
  })

  // Validación del formulario manual
  useEffect(() => {
    if (flowType === "manual") {
      if (step === 1) {
        setIsFormValid(currentQuestion.text && currentQuestion.text.trim().length > 0)
      } else if (step === 2) {
        if (currentQuestion.type === "OPEN_ENDED") {
          setIsFormValid(true)
        } else {
          const validOptions = currentQuestion.config?.options?.filter((opt) => opt.trim().length > 0) || []
          setIsFormValid(validOptions.length >= 2)
        }
      } else if (step === 3) {
        const scoreNum = currentQuestion.score || 0
        setIsFormValid(scoreNum >= 100 && scoreNum <= 1000)
      }
    }
  }, [currentQuestion, step, flowType])

  // 🔧 Función para generar preguntas con IA (mejorada para acumular)
  const generateAIQuestions = async (isGeneratingMore = false) => {
    if (!userPrompt.trim()) {
      Alert.alert("Error", "Por favor escribe un prompt para generar preguntas.")
      return
    }

    try {
      setIsGeneratingAI(true)
      setAiError(null)

      const token = await AsyncStorage.getItem("userToken")
      if (!token) {
        throw new Error("No se encontró token de autenticación")
      }

      console.log("🤖 Generando preguntas con IA...")
      console.log("📝 Prompt:", userPrompt)
      console.log("🔢 Cantidad solicitada:", questionCount)
      console.log("🔄 ¿Generando más?:", isGeneratingMore)

      const response = await axios.post<AIRecommendationResponse>(
        "https://fmrdkboi63.execute-api.us-east-1.amazonaws.com/dev/questions/room/recommendation_ia",
        {
          room_id: roomId,
          user_prompt: userPrompt,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        },
      )

      console.log("✅ Respuesta de la IA:", response.data)

      if (response.data.success) {
        const limitedQuestions = response.data.data.slice(0, questionCount)
        console.log(`📊 Preguntas recibidas: ${response.data.data.length}, Mostrando: ${limitedQuestions.length}`)

        setAiQuestions(limitedQuestions)

        const newEditableQuestions: Question[] = limitedQuestions.map((q, index) => {
          console.log(`📝 Pregunta ${index + 1}:`, {
            text: q.text,
            type: q.type,
            difficulty: q.difficulty,
            score: q.score,
            options: q.config?.options?.length || 0,
            tags: q.tags?.length || 0,
          })

          return {
            ...q,
            room_id: roomId,
            id: undefined,
          }
        })

        if (isGeneratingMore) {
          // Agregar a las existentes
          const updatedQuestions = [...allGeneratedQuestions, ...newEditableQuestions]
          setAllGeneratedQuestions(updatedQuestions)
          setEditedQuestions(updatedQuestions)
          console.log(`📈 Total de preguntas acumuladas: ${updatedQuestions.length}`)
        } else {
          // Primera vez o reinicio
          setAllGeneratedQuestions(newEditableQuestions)
          setEditedQuestions(newEditableQuestions)
          console.log(`🆕 Preguntas iniciales: ${newEditableQuestions.length}`)
        }

        setStep(3) // Ir al paso de revisión IA
      } else {
        throw new Error(response.data.message || "Error al generar preguntas")
      }
    } catch (error: any) {
      console.error("❌ Error generating AI questions:", error)
      setAiError(error.response?.data?.message || error.message || "Error al generar preguntas con IA")
    } finally {
      setIsGeneratingAI(false)
    }
  }

  // 🆕 Función para eliminar una pregunta
  const handleDeleteQuestion = (index: number) => {
    setQuestionToDelete(index)
    setShowDeleteConfirm(true)
  }

  // 🆕 Confirmar eliminación de pregunta
  const confirmDeleteQuestion = () => {
    if (questionToDelete !== null) {
      const updatedQuestions = allGeneratedQuestions.filter((_, index) => index !== questionToDelete)
      setAllGeneratedQuestions(updatedQuestions)
      setEditedQuestions(updatedQuestions)
      console.log(`🗑️ Pregunta ${questionToDelete + 1} eliminada. Total restante: ${updatedQuestions.length}`)
    }
    setShowDeleteConfirm(false)
    setQuestionToDelete(null)
  }

  // Función para mostrar opciones de generación
  const handleGenerateMoreOptions = () => {
    setShowGenerateOptions(true)
  }

  // 🔧 Función para cambiar la solicitud a IA (mantiene preguntas existentes)
  const handleChangeAIPrompt = () => {
    setShowGenerateOptions(false)
    // Mantener las preguntas actuales y volver al paso 2
    setStep(2)
    // Limpiar el prompt para que el usuario escriba uno nuevo
    setUserPrompt("")
  }

  // Función para generar más preguntas con el mismo prompt
  const handleGenerateWithSamePrompt = () => {
    setShowGenerateOptions(false)
    generateAIQuestions(true) // true = agregar a las existentes
  }

  // Función para editar una pregunta generada por IA
  const editAIQuestion = (index: number, updatedQuestion: Partial<Question>) => {
    const newEditedQuestions = [...editedQuestions]
    newEditedQuestions[index] = { ...newEditedQuestions[index], ...updatedQuestion }
    setEditedQuestions(newEditedQuestions)

    const newAllQuestions = [...allGeneratedQuestions]
    newAllQuestions[index] = { ...newAllQuestions[index], ...updatedQuestion }
    setAllGeneratedQuestions(newAllQuestions)

    console.log(`✏️ Editando pregunta ${index + 1}:`, updatedQuestion)
  }

  // Funciones del flujo manual (sin cambios)
  const updateCurrentQuestion = (updates: Partial<Question>) => {
    setCurrentQuestion((prev) => ({ ...prev, ...updates }))
  }

  const handleAddOption = () => {
    const currentOptions = currentQuestion.config?.options || []
    if (currentOptions.length < 5) {
      updateCurrentQuestion({
        config: { ...currentQuestion.config, options: [...currentOptions, ""] },
      })
    } else {
      Alert.alert("Límite alcanzado", "No puedes agregar más de 5 opciones.")
    }
  }

  const handleRemoveOption = (index: number) => {
    const currentOptions = currentQuestion.config?.options || []
    if (currentOptions.length > 2) {
      const newOptions = [...currentOptions]
      newOptions.splice(index, 1)
      updateCurrentQuestion({
        config: { ...currentQuestion.config, options: newOptions },
      })
    } else {
      Alert.alert("Mínimo requerido", "Debes tener al menos 2 opciones.")
    }
  }

  const handleUpdateOption = (text: string, index: number) => {
    const currentOptions = currentQuestion.config?.options || []
    const newOptions = [...currentOptions]
    newOptions[index] = text
    updateCurrentQuestion({
      config: { ...currentQuestion.config, options: newOptions },
    })
  }

  const handleAddTag = (tag: string) => {
    const currentTags = currentQuestion.tags || []
    if (!currentTags.includes(tag)) {
      updateCurrentQuestion({ tags: [...currentTags, tag] })
    }
  }

  const handleRemoveTag = (index: number) => {
    const currentTags = currentQuestion.tags || []
    const newTags = [...currentTags]
    newTags.splice(index, 1)
    updateCurrentQuestion({ tags: newTags })
  }

  // Función para guardar la pregunta manual actual y continuar
  const saveCurrentManualQuestion = () => {
    const completeQuestion: Question = {
      room_id: roomId,
      type: currentQuestion.type!,
      text: currentQuestion.text!,
      score: currentQuestion.score!,
      tags: currentQuestion.tags?.length ? currentQuestion.tags : undefined,
      difficulty: currentQuestion.difficulty!,
      config:
        currentQuestion.type === "OPEN_ENDED"
          ? {}
          : {
              options: currentQuestion.config?.options?.filter((opt) => opt.trim().length > 0) || [],
            },
    }

    const newManualQuestions = [...manualQuestions]
    newManualQuestions[currentQuestionIndex] = completeQuestion
    setManualQuestions(newManualQuestions)

    if (currentQuestionIndex + 1 < questionCount) {
      setCurrentQuestionIndex(currentQuestionIndex + 1)
      setCurrentQuestion({
        room_id: roomId,
        type: "MULTIPLE_CHOICE_SINGLE",
        text: "",
        score: 200,
        difficulty: "EASY",
        config: { options: ["", ""] },
        tags: [],
      })
      setStep(1)
    } else {
      setStep(4)
    }
  }

  // Función para guardar todas las preguntas manuales
  const saveAllManualQuestions = async () => {
    try {
      const questionsToSave = manualQuestions.filter((q) => q.text && q.text.trim().length > 0)

      if (questionsToSave.length === 0) {
        Alert.alert("Error", "No hay preguntas válidas para guardar.")
        return
      }

      const questionIds = await createQuestionsList(
        roomId,
        questionsToSave.map((q) => ({
          type: q.type,
          text: q.text,
          score: q.score,
          tags: q.tags,
          difficulty: q.difficulty,
          config: q.config,
        })),
      )

      if (questionIds) {
        Alert.alert("Preguntas creadas", `Se han creado ${questionIds.length} preguntas exitosamente.`, [
          {
            text: "Crear más",
            onPress: () => {
              setStep(1)
              setQuestionCount(1)
              setManualQuestions([])
              setCurrentQuestionIndex(0)
              setCurrentQuestion({
                room_id: roomId,
                type: "MULTIPLE_CHOICE_SINGLE",
                text: "",
                score: 200,
                difficulty: "EASY",
                config: { options: ["", ""] },
                tags: [],
              })
              setFlowType("ai")
            },
          },
          {
            text: "Volver",
            onPress: () => navigation.goBack(),
          },
        ])
      }
    } catch (error) {
      console.error("Error saving manual questions:", error)
      Alert.alert("Error", "No se pudieron guardar las preguntas. Inténtalo de nuevo.")
    }
  }

  // 🔧 Función para guardar preguntas de IA (mejorada)
  const saveAIQuestions = async () => {
    try {
      const questionsToSave = allGeneratedQuestions.filter((q) => q.text && q.text.trim().length > 0)

      if (questionsToSave.length === 0) {
        Alert.alert("Error", "No hay preguntas válidas para guardar.")
        return
      }

      console.log("💾 Guardando TODAS las preguntas de IA:", questionsToSave.length)

      const questionIds = await createQuestionsList(
        roomId,
        questionsToSave.map((q) => ({
          type: q.type,
          text: q.text,
          score: q.score,
          tags: q.tags,
          difficulty: q.difficulty,
          config: q.config,
        })),
      )

      if (questionIds) {
        console.log("✅ Preguntas guardadas con IDs:", questionIds)
        Alert.alert("Preguntas creadas", `Se han creado ${questionIds.length} preguntas exitosamente.`, [
          {
            text: "Crear más",
            onPress: () => {
              setStep(1)
              setQuestionCount(1)
              setUserPrompt("")
              setAiQuestions([])
              setEditedQuestions([])
              setAllGeneratedQuestions([])
              setAiError(null)
              setFlowType("ai")
            },
          },
          {
            text: "Volver",
            onPress: () => navigation.goBack(),
          },
        ])
      }
    } catch (error) {
      console.error("Error saving AI questions:", error)
      Alert.alert("Error", "No se pudieron guardar las preguntas. Inténtalo de nuevo.")
    }
  }

  const handleNext = () => {
    if (flowType === "ai") {
      if (step === 1) {
        setStep(2)
      } else if (step === 2) {
        if (userPrompt.trim()) {
          // 🔧 Si hay preguntas existentes, agregar a ellas; si no, crear nuevas
          const isAddingMore = allGeneratedQuestions.length > 0
          generateAIQuestions(isAddingMore)
        } else {
          setFlowType("manual")
          setStep(1)
          setManualQuestions(new Array(questionCount).fill(null))
          setCurrentQuestionIndex(0)
        }
      } else if (step === 3) {
        saveAIQuestions()
      }
    } else {
      if (step < 3) {
        setStep(step + 1)
      } else {
        saveCurrentManualQuestion()
      }
    }
  }

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1)
    } else if (flowType === "manual") {
      if (currentQuestionIndex > 0) {
        setCurrentQuestionIndex(currentQuestionIndex - 1)
        setCurrentQuestion(
          manualQuestions[currentQuestionIndex - 1] || {
            room_id: roomId,
            type: "MULTIPLE_CHOICE_SINGLE",
            text: "",
            score: 200,
            difficulty: "EASY",
            config: { options: ["", ""] },
            tags: [],
          },
        )
        setStep(3)
      } else {
        setFlowType("ai")
        setStep(2)
      }
    } else {
      navigation.goBack()
    }
  }

  if (!fontsLoaded) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4361EE" />
      </View>
    )
  }

  const renderStepContent = () => {
    if (flowType === "ai") {
      switch (step) {
        case 1:
          return (
            <View style={styles.stepContainer}>
              <Text style={styles.stepTitle}>¿Cuántas preguntas quieres crear?</Text>
              <Text style={styles.stepDescription}>Selecciona la cantidad de preguntas que deseas crear.</Text>

              <View style={styles.questionCountContainer}>
                {[1, 2, 3].map((count) => (
                  <TouchableOpacity
                    key={count}
                    style={[styles.countButton, questionCount === count && styles.selectedCountButton]}
                    onPress={() => setQuestionCount(count)}
                  >
                    <Text style={[styles.countButtonText, questionCount === count && styles.selectedCountButtonText]}>
                      {count} pregunta{count > 1 ? "s" : ""}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.infoBox}>
                <Feather name="info" size={20} color="#4361EE" />
                <Text style={styles.infoText}>
                  Puedes usar IA para generar automáticamente o crear manualmente paso a paso.
                </Text>
              </View>
            </View>
          )

        case 2:
          return (
            <View style={styles.stepContainer}>
              <Text style={styles.stepTitle}>Recomendaciones con IA</Text>
              <Text style={styles.stepDescription}>
                Describe el tema y la IA generará {questionCount} pregunta{questionCount > 1 ? "s" : ""} para ti.
              </Text>

              {/* 🆕 Mostrar preguntas existentes si las hay */}
              {allGeneratedQuestions.length > 0 && (
                <View style={styles.existingQuestionsInfo}>
                  <Feather name="check-circle" size={20} color="#4CAF50" />
                  <Text style={styles.existingQuestionsText}>
                    Ya tienes {allGeneratedQuestions.length} pregunta{allGeneratedQuestions.length > 1 ? "s" : ""} creada
                    {allGeneratedQuestions.length > 1 ? "s" : ""}. Las nuevas se agregarán a las existentes.
                  </Text>
                </View>
              )}

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Prompt para la IA (opcional)</Text>
                <TextInput
                  style={styles.promptInput}
                  value={userPrompt}
                  onChangeText={setUserPrompt}
                  placeholder="Ej: Genera preguntas sobre José María Arguedas que fomenten la reflexión y el pensamiento crítico..."
                  placeholderTextColor="#999"
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />
              </View>

              {aiError && (
                <View style={styles.errorContainer}>
                  <Feather name="alert-circle" size={20} color="#FF4444" />
                  <Text style={styles.errorText}>{aiError}</Text>
                </View>
              )}

              <View style={styles.aiInfoBox}>
                <Feather name="zap" size={20} color="#FF9800" />
                <Text style={styles.aiInfoText}>
                  Si no escribes un prompt, podrás crear las {questionCount} pregunta{questionCount > 1 ? "s" : ""}{" "}
                  manualmente paso a paso.
                </Text>
              </View>
            </View>
          )

        case 3:
          return (
            <View style={styles.stepContainer}>
              <Text style={styles.stepTitle}>
                {allGeneratedQuestions.length} Pregunta{allGeneratedQuestions.length > 1 ? "s" : ""} generada
                {allGeneratedQuestions.length > 1 ? "s" : ""} por IA
              </Text>
              <Text style={styles.stepDescription}>
                Revisa y edita todas las preguntas generadas. Puedes modificar cualquier campo antes de guardar.
              </Text>

              {/* 🔧 Sección de preguntas con funcionalidad de eliminación */}
              <View style={styles.questionsSection}>
                <Text style={styles.questionsSectionTitle}>
                  📝 Preguntas generadas ({allGeneratedQuestions.length})
                </Text>

                {allGeneratedQuestions.map((question, index) => (
                  <View key={index} style={styles.questionCard}>
                    <View style={styles.questionHeader}>
                      <Text style={styles.questionNumber}>Pregunta {index + 1}</Text>
                      <View style={styles.questionActions}>
                        <View
                          style={[
                            styles.difficultyBadge,
                            {
                              backgroundColor:
                                question.difficulty === "EASY"
                                  ? "#4CAF50"
                                  : question.difficulty === "MEDIUM"
                                    ? "#FF9800"
                                    : "#F44336",
                            },
                          ]}
                        >
                          <Text style={styles.difficultyText}>
                            {question.difficulty === "EASY"
                              ? "Fácil"
                              : question.difficulty === "MEDIUM"
                                ? "Medio"
                                : "Difícil"}
                          </Text>
                        </View>
                        {/* 🆕 Botón de eliminar */}
                        <TouchableOpacity
                          style={styles.deleteButton}
                          onPress={() => handleDeleteQuestion(index)}
                          activeOpacity={0.7}
                        >
                          <Feather name="trash-2" size={18} color="#FF4444" />
                        </TouchableOpacity>
                      </View>
                    </View>

                    <View style={styles.questionContent}>
                      <Text style={styles.questionLabel}>Pregunta:</Text>
                      <TextInput
                        style={styles.questionTextInput}
                        value={question.text}
                        onChangeText={(text) => editAIQuestion(index, { text })}
                        multiline
                        placeholder="Texto de la pregunta..."
                      />
                    </View>

                    <View style={styles.questionMeta}>
                      <View style={styles.metaItem}>
                        <Text style={styles.metaLabel}>Puntaje:</Text>
                        <TextInput
                          style={styles.scoreInputSmall}
                          value={question.score.toString()}
                          onChangeText={(text) => editAIQuestion(index, { score: Number.parseInt(text) || 200 })}
                          keyboardType="number-pad"
                        />
                      </View>

                      <View style={styles.metaItem}>
                        <Text style={styles.metaLabel}>Tipo:</Text>
                        <Text style={styles.typeText}>
                          {question.type === "MULTIPLE_CHOICE_SINGLE"
                            ? "Opción única"
                            : question.type === "MULTIPLE_CHOICE_MULTIPLE"
                              ? "Opción múltiple"
                              : "Abierta"}
                        </Text>
                      </View>
                    </View>

                    {question.config?.options && question.config.options.length > 0 && (
                      <View style={styles.optionsContainer}>
                        <Text style={styles.questionLabel}>Opciones:</Text>
                        {question.config.options.map((option, optionIndex) => (
                          <View key={optionIndex} style={styles.optionRow}>
                            <Text style={styles.optionLetter}>{String.fromCharCode(65 + optionIndex)}.</Text>
                            <TextInput
                              style={styles.optionInput}
                              value={option}
                              onChangeText={(text) => {
                                const newOptions = [...(question.config?.options || [])]
                                newOptions[optionIndex] = text
                                editAIQuestion(index, {
                                  config: { ...question.config, options: newOptions },
                                })
                              }}
                              placeholder={`Opción ${optionIndex + 1}`}
                            />
                          </View>
                        ))}
                      </View>
                    )}

                    {question.tags && question.tags.length > 0 && (
                      <View style={styles.tagsContainer}>
                        <Text style={styles.questionLabel}>Etiquetas:</Text>
                        <View style={styles.tagsWrapper}>
                          {question.tags.map((tag, tagIndex) => (
                            <View key={tagIndex} style={styles.tag}>
                              <Text style={styles.tagText}>{tag}</Text>
                            </View>
                          ))}
                        </View>
                      </View>
                    )}
                  </View>
                ))}
              </View>

              {/* Botón para generar más preguntas */}
              <TouchableOpacity
                style={styles.generateMoreButton}
                onPress={handleGenerateMoreOptions}
                disabled={isGeneratingAI}
              >
                {isGeneratingAI ? (
                  <ActivityIndicator size="small" color="#4361EE" />
                ) : (
                  <Feather name="plus" size={20} color="#4361EE" />
                )}
                <Text style={styles.generateMoreText}>{isGeneratingAI ? "Generando..." : "Generar más preguntas"}</Text>
              </TouchableOpacity>
            </View>
          )

        default:
          return null
      }
    } else {
      // Contenido del flujo manual (sin cambios significativos)
      switch (step) {
        case 1:
          return (
            <View style={styles.stepContainer}>
              <View style={styles.questionProgress}>
                <Text style={styles.questionProgressText}>
                  Pregunta {currentQuestionIndex + 1} de {questionCount}
                </Text>
                <View style={styles.progressDots}>
                  {Array.from({ length: questionCount }, (_, i) => (
                    <View key={i} style={[styles.progressDot, i <= currentQuestionIndex && styles.progressDotActive]} />
                  ))}
                </View>
              </View>

              <Text style={styles.stepTitle}>¿Qué quieres preguntar?</Text>
              <Text style={styles.stepDescription}>Escribe el texto de tu pregunta y selecciona el tipo.</Text>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Texto de la pregunta</Text>
                <TextInput
                  style={styles.textInput}
                  value={currentQuestion.text || ""}
                  onChangeText={(text) => updateCurrentQuestion({ text })}
                  placeholder="Ej: ¿Cuál es la capital de Francia?"
                  placeholderTextColor="#999"
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                />
              </View>

              <Text style={styles.sectionTitle}>Tipo de pregunta</Text>

              <QuestionTypeCard
                type="MULTIPLE_CHOICE_SINGLE"
                title="Opción múltiple (una respuesta)"
                description="El estudiante selecciona una opción correcta"
                icon={<Feather name="check-circle" size={24} color="#4361EE" />}
                selected={currentQuestion.type === "MULTIPLE_CHOICE_SINGLE"}
                onSelect={() =>
                  updateCurrentQuestion({
                    type: "MULTIPLE_CHOICE_SINGLE",
                    config: { options: ["", ""] },
                  })
                }
              />

              <QuestionTypeCard
                type="MULTIPLE_CHOICE_MULTIPLE"
                title="Opción múltiple (varias respuestas)"
                description="El estudiante puede seleccionar varias opciones"
                icon={<Feather name="check-square" size={24} color="#4361EE" />}
                selected={currentQuestion.type === "MULTIPLE_CHOICE_MULTIPLE"}
                onSelect={() =>
                  updateCurrentQuestion({
                    type: "MULTIPLE_CHOICE_MULTIPLE",
                    config: { options: ["", ""] },
                  })
                }
              />

              <QuestionTypeCard
                type="OPEN_ENDED"
                title="Respuesta abierta"
                description="El estudiante escribe una respuesta libre"
                icon={<Feather name="edit-3" size={24} color="#4361EE" />}
                selected={currentQuestion.type === "OPEN_ENDED"}
                onSelect={() =>
                  updateCurrentQuestion({
                    type: "OPEN_ENDED",
                    config: {},
                  })
                }
              />
            </View>
          )

        case 2:
          return (
            <View style={styles.stepContainer}>
              <View style={styles.questionProgress}>
                <Text style={styles.questionProgressText}>
                  Pregunta {currentQuestionIndex + 1} de {questionCount}
                </Text>
              </View>

              {currentQuestion.type !== "OPEN_ENDED" ? (
                <>
                  <Text style={styles.stepTitle}>Opciones de respuesta</Text>
                  <Text style={styles.stepDescription}>
                    Agrega entre 2 y 5 opciones para tu pregunta de opción múltiple.
                  </Text>

                  <View style={styles.optionsContainer}>
                    {(currentQuestion.config?.options || []).map((option, index) => (
                      <OptionInput
                        key={index}
                        value={option}
                        onChange={(text) => handleUpdateOption(text, index)}
                        onRemove={() => handleRemoveOption(index)}
                        index={index}
                      />
                    ))}

                    {(currentQuestion.config?.options?.length || 0) < 5 && (
                      <TouchableOpacity style={styles.addOptionButton} onPress={handleAddOption} activeOpacity={0.8}>
                        <Feather name="plus" size={20} color="#4361EE" />
                        <Text style={styles.addOptionText}>Agregar opción</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </>
              ) : (
                <>
                  <Text style={styles.stepTitle}>Respuesta abierta</Text>
                  <Text style={styles.stepDescription}>
                    Has seleccionado una pregunta de respuesta abierta. Los estudiantes podrán escribir libremente su
                    respuesta.
                  </Text>

                  <View style={styles.openEndedInfo}>
                    <Feather name="info" size={24} color="#4361EE" />
                    <Text style={styles.openEndedInfoText}>
                      Las respuestas abiertas deberán ser revisadas manualmente para asignar puntaje.
                    </Text>
                  </View>
                </>
              )}
            </View>
          )

        case 3:
          return (
            <View style={styles.stepContainer}>
              <View style={styles.questionProgress}>
                <Text style={styles.questionProgressText}>
                  Pregunta {currentQuestionIndex + 1} de {questionCount}
                </Text>
              </View>

              <Text style={styles.stepTitle}>Detalles finales</Text>
              <Text style={styles.stepDescription}>Configura la dificultad, puntaje y etiquetas para tu pregunta.</Text>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Puntaje (100-1000)</Text>
                <TextInput
                  style={styles.scoreInput}
                  value={(currentQuestion.score || 200).toString()}
                  onChangeText={(text) => updateCurrentQuestion({ score: Number.parseInt(text) || 200 })}
                  placeholder="200"
                  placeholderTextColor="#999"
                  keyboardType="number-pad"
                />
              </View>

              <Text style={styles.sectionTitle}>Dificultad</Text>
              <View style={styles.difficultyContainer}>
                <DifficultyBadge
                  difficulty="EASY"
                  selected={currentQuestion.difficulty === "EASY"}
                  onSelect={() => updateCurrentQuestion({ difficulty: "EASY" })}
                />
                <DifficultyBadge
                  difficulty="MEDIUM"
                  selected={currentQuestion.difficulty === "MEDIUM"}
                  onSelect={() => updateCurrentQuestion({ difficulty: "MEDIUM" })}
                />
                <DifficultyBadge
                  difficulty="HARD"
                  selected={currentQuestion.difficulty === "HARD"}
                  onSelect={() => updateCurrentQuestion({ difficulty: "HARD" })}
                />
              </View>

              <Text style={styles.sectionTitle}>Etiquetas (opcional)</Text>
              <Text style={styles.sectionDescription}>Agrega etiquetas para categorizar tu pregunta.</Text>

              <TagInput tags={currentQuestion.tags || []} onAddTag={handleAddTag} onRemoveTag={handleRemoveTag} />
            </View>
          )

        case 4:
          return (
            <View style={styles.stepContainer}>
              <Text style={styles.stepTitle}>Revisión final</Text>
              <Text style={styles.stepDescription}>
                Revisa todas las {questionCount} pregunta{questionCount > 1 ? "s" : ""} antes de guardar.
              </Text>

              <View style={styles.summaryContainer}>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryNumber}>{manualQuestions.length}</Text>
                  <Text style={styles.summaryLabel}>Preguntas creadas</Text>
                </View>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryNumber}>
                    {manualQuestions.reduce((sum, q) => sum + (q?.score || 0), 0)}
                  </Text>
                  <Text style={styles.summaryLabel}>Puntos totales</Text>
                </View>
              </View>

              <View style={styles.questionsSection}>
                {manualQuestions.map(
                  (question, index) =>
                    question && (
                      <View key={index} style={styles.questionCard}>
                        <View style={styles.questionHeader}>
                          <Text style={styles.questionNumber}>Pregunta {index + 1}</Text>
                          <View
                            style={[
                              styles.difficultyBadge,
                              {
                                backgroundColor:
                                  question.difficulty === "EASY"
                                    ? "#4CAF50"
                                    : question.difficulty === "MEDIUM"
                                      ? "#FF9800"
                                      : "#F44336",
                              },
                            ]}
                          >
                            <Text style={styles.difficultyText}>
                              {question.difficulty === "EASY"
                                ? "Fácil"
                                : question.difficulty === "MEDIUM"
                                  ? "Medio"
                                  : "Difícil"}
                            </Text>
                          </View>
                        </View>

                        <Text style={styles.questionTextDisplay}>{question.text}</Text>

                        <View style={styles.questionMeta}>
                          <Text style={styles.metaLabel}>Puntaje: {question.score}</Text>
                          <Text style={styles.metaLabel}>
                            Tipo:{" "}
                            {question.type === "MULTIPLE_CHOICE_SINGLE"
                              ? "Opción única"
                              : question.type === "MULTIPLE_CHOICE_MULTIPLE"
                                ? "Opción múltiple"
                                : "Abierta"}
                          </Text>
                        </View>

                        {question.config?.options && question.config.options.length > 0 && (
                          <View style={styles.optionsContainer}>
                            <Text style={styles.metaLabel}>Opciones:</Text>
                            {question.config.options.map((option, optionIndex) => (
                              <Text key={optionIndex} style={styles.optionDisplay}>
                                {String.fromCharCode(65 + optionIndex)}. {option}
                              </Text>
                            ))}
                          </View>
                        )}
                      </View>
                    ),
                )}
              </View>
            </View>
          )

        default:
          return null
      }
    }
  }

  const getStepCount = () => {
    if (flowType === "ai") return 3
    if (flowType === "manual" && step === 4) return 4
    return 3
  }

  const getButtonText = () => {
    if (flowType === "ai") {
      if (step === 1) return "Continuar"
      if (step === 2) {
        if (userPrompt.trim()) {
          return allGeneratedQuestions.length > 0 ? "Agregar más preguntas" : "Generar con IA"
        }
        return "Crear manualmente"
      }
      if (step === 3) return "Guardar preguntas"
    } else {
      if (step < 3) return "Siguiente"
      if (step === 3) {
        return currentQuestionIndex + 1 < questionCount
          ? `Guardar y crear pregunta ${currentQuestionIndex + 2}`
          : "Finalizar preguntas"
      }
      if (step === 4) return "Guardar todas las preguntas"
    }
    return "Continuar"
  }

  const isButtonDisabled = () => {
    if (isGeneratingAI || questionsLoading) return true
    if (flowType === "manual") return !isFormValid
    return false
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Feather name="arrow-left" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {flowType === "ai" ? "Crear con IA" : `Manual (${currentQuestionIndex + 1}/${questionCount})`}
        </Text>
        <View style={styles.placeholder} />
      </View>

      {/* Progress Indicator */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${(step / getStepCount()) * 100}%` }]} />
        </View>
        <Text style={styles.progressText}>
          Paso {step} de {getStepCount()}
        </Text>
      </View>

      {/* Room Info */}
      <View style={styles.roomInfoContainer}>
        <View style={styles.roomBadge}>
          <Feather name="book-open" size={16} color="#4361EE" />
        </View>
        <Text style={styles.roomName}>{roomName || "Sala seleccionada"}</Text>
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        nestedScrollEnabled={true}
        keyboardShouldPersistTaps="handled"
      >
        {renderStepContent()}

        {/* 🆕 Modal de opciones para generar más preguntas */}
        <Modal
          visible={showGenerateOptions}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowGenerateOptions(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Generar más preguntas</Text>
                <TouchableOpacity onPress={() => setShowGenerateOptions(false)}>
                  <Feather name="x" size={24} color="#666" />
                </TouchableOpacity>
              </View>

              <View style={styles.modalContent}>
                <TouchableOpacity style={styles.modalOption} onPress={handleGenerateWithSamePrompt} activeOpacity={0.7}>
                  <View style={styles.modalOptionIcon}>
                    <Feather name="refresh-cw" size={24} color="#4361EE" />
                  </View>
                  <View style={styles.modalOptionContent}>
                    <Text style={styles.modalOptionTitle}>Generar automáticamente</Text>
                    <Text style={styles.modalOptionDescription}>
                      Usar el mismo prompt para generar más preguntas similares
                    </Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity style={styles.modalOption} onPress={handleChangeAIPrompt} activeOpacity={0.7}>
                  <View style={styles.modalOptionIcon}>
                    <Feather name="edit-3" size={24} color="#FF9800" />
                  </View>
                  <View style={styles.modalOptionContent}>
                    <Text style={styles.modalOptionTitle}>Cambiar solicitud a IA</Text>
                    <Text style={styles.modalOptionDescription}>
                      Escribir un nuevo prompt manteniendo las preguntas actuales
                    </Text>
                  </View>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* 🆕 Modal de confirmación para eliminar pregunta */}
        <Modal
          visible={showDeleteConfirm}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowDeleteConfirm(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Eliminar pregunta</Text>
                <TouchableOpacity onPress={() => setShowDeleteConfirm(false)}>
                  <Feather name="x" size={24} color="#666" />
                </TouchableOpacity>
              </View>

              <View style={styles.modalContent}>
                <View style={styles.deleteConfirmContent}>
                  <Feather name="alert-triangle" size={48} color="#FF4444" />
                  <Text style={styles.deleteConfirmTitle}>¿Estás seguro?</Text>
                  <Text style={styles.deleteConfirmText}>
                    Esta acción eliminará permanentemente la pregunta {(questionToDelete || 0) + 1}. No se puede
                    deshacer.
                  </Text>
                </View>

                <View style={styles.deleteConfirmButtons}>
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={() => setShowDeleteConfirm(false)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.cancelButtonText}>Cancelar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.confirmDeleteButton} onPress={confirmDeleteQuestion} activeOpacity={0.7}>
                    <Text style={styles.confirmDeleteButtonText}>Eliminar</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        </Modal>

        {error && (
          <View style={styles.errorContainer}>
            <Feather name="alert-circle" size={20} color="#FF4444" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.nextButton, isButtonDisabled() && styles.disabledButton]}
          onPress={flowType === "manual" && step === 4 ? saveAllManualQuestions : handleNext}
          disabled={isButtonDisabled()}
          activeOpacity={0.8}
        >
          {isGeneratingAI || questionsLoading ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <>
              <Text style={styles.nextButtonText}>{getButtonText()}</Text>
              <Feather
                name={
                  (flowType === "ai" && step === 3) || (flowType === "manual" && step === 4) ? "check" : "arrow-right"
                }
                size={20}
                color="#FFFFFF"
              />
            </>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  )
}

// 🔧 Estilos actualizados con nuevas funcionalidades
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FA",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F8F9FA",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5E5",
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F8F9FA",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: "Poppins_600SemiBold",
    color: "#333",
  },
  placeholder: {
    width: 40,
  },
  progressContainer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: "#FFFFFF",
  },
  progressBar: {
    height: 6,
    backgroundColor: "#E0E0E0",
    borderRadius: 3,
    marginBottom: 8,
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#4361EE",
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    fontFamily: "Poppins_500Medium",
    color: "#666",
  },
  roomInfoContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: "#F0F4FF",
  },
  roomBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  roomName: {
    fontSize: 14,
    fontFamily: "Poppins_500Medium",
    color: "#4361EE",
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 140, // Más espacio para el footer y el teclado
  },
  stepContainer: {
    marginBottom: 20,
  },
  stepTitle: {
    fontSize: 20,
    fontFamily: "Poppins_600SemiBold",
    color: "#333",
    marginBottom: 8,
  },
  stepDescription: {
    fontSize: 14,
    fontFamily: "Poppins_400Regular",
    color: "#666",
    marginBottom: 24,
  },
  questionProgress: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    alignItems: "center",
  },
  questionProgressText: {
    fontSize: 16,
    fontFamily: "Poppins_600SemiBold",
    color: "#4361EE",
    marginBottom: 12,
  },
  progressDots: {
    flexDirection: "row",
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#E0E0E0",
    marginHorizontal: 4,
  },
  progressDotActive: {
    backgroundColor: "#4361EE",
  },
  questionCountContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  countButton: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 4,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#E0E0E0",
  },
  selectedCountButton: {
    borderColor: "#4361EE",
    backgroundColor: "#F0F4FF",
  },
  countButtonText: {
    fontSize: 14,
    fontFamily: "Poppins_500Medium",
    color: "#666",
  },
  selectedCountButtonText: {
    color: "#4361EE",
  },
  infoBox: {
    flexDirection: "row",
    backgroundColor: "#F0F4FF",
    borderRadius: 12,
    padding: 16,
    alignItems: "flex-start",
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    fontFamily: "Poppins_400Regular",
    color: "#4361EE",
    marginLeft: 12,
    lineHeight: 20,
  },
  // 🆕 Nuevo estilo para mostrar preguntas existentes
  existingQuestionsInfo: {
    flexDirection: "row",
    backgroundColor: "#E8F5E8",
    borderRadius: 12,
    padding: 16,
    alignItems: "flex-start",
    marginBottom: 16,
  },
  existingQuestionsText: {
    flex: 1,
    fontSize: 14,
    fontFamily: "Poppins_500Medium",
    color: "#4CAF50",
    marginLeft: 12,
    lineHeight: 20,
  },
  inputContainer: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 14,
    fontFamily: "Poppins_500Medium",
    color: "#333",
    marginBottom: 8,
  },
  promptInput: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    fontSize: 14,
    fontFamily: "Poppins_400Regular",
    color: "#333",
    borderWidth: 1,
    borderColor: "#E0E0E0",
    minHeight: 120,
    textAlignVertical: "top",
  },
  textInput: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    fontSize: 14,
    fontFamily: "Poppins_400Regular",
    color: "#333",
    borderWidth: 1,
    borderColor: "#E0E0E0",
    minHeight: 120,
  },
  aiInfoBox: {
    flexDirection: "row",
    backgroundColor: "#FFF8E1",
    borderRadius: 12,
    padding: 16,
    alignItems: "flex-start",
  },
  aiInfoText: {
    flex: 1,
    fontSize: 14,
    fontFamily: "Poppins_400Regular",
    color: "#F57C00",
    marginLeft: 12,
    lineHeight: 20,
  },
  questionsSection: {
    marginBottom: 20,
  },
  questionsSectionTitle: {
    fontSize: 16,
    fontFamily: "Poppins_600SemiBold",
    color: "#333",
    marginBottom: 16,
    textAlign: "center",
  },
  questionCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  questionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  questionNumber: {
    fontSize: 18,
    fontFamily: "Poppins_700Bold",
    color: "#333",
  },
  // 🆕 Nuevo contenedor para acciones de pregunta
  questionActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  difficultyBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
  },
  difficultyText: {
    fontSize: 12,
    fontFamily: "Poppins_600SemiBold",
    color: "#FFFFFF",
  },
  // 🆕 Botón de eliminar
  deleteButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#FFEBEE",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#FFCDD2",
  },
  questionContent: {
    marginBottom: 16,
  },
  questionLabel: {
    fontSize: 14,
    fontFamily: "Poppins_600SemiBold",
    color: "#333",
    marginBottom: 8,
  },
  questionTextInput: {
    backgroundColor: "#F8F9FA",
    borderRadius: 12,
    padding: 16,
    fontSize: 14,
    fontFamily: "Poppins_400Regular",
    color: "#333",
    minHeight: 80,
    textAlignVertical: "top",
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  questionTextDisplay: {
    fontSize: 14,
    fontFamily: "Poppins_400Regular",
    color: "#333",
    marginBottom: 12,
    lineHeight: 20,
    backgroundColor: "#F8F9FA",
    padding: 12,
    borderRadius: 8,
  },
  questionMeta: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    flexWrap: "wrap",
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 16,
    marginBottom: 8,
  },
  metaLabel: {
    fontSize: 12,
    fontFamily: "Poppins_500Medium",
    color: "#666",
    marginRight: 8,
  },
  typeText: {
    fontSize: 12,
    fontFamily: "Poppins_500Medium",
    color: "#4361EE",
    backgroundColor: "#F0F4FF",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  scoreInput: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    fontSize: 14,
    fontFamily: "Poppins_400Regular",
    color: "#333",
    borderWidth: 1,
    borderColor: "#E0E0E0",
    height: 56,
  },
  scoreInputSmall: {
    backgroundColor: "#F8F9FA",
    borderRadius: 8,
    padding: 8,
    fontSize: 14,
    fontFamily: "Poppins_500Medium",
    color: "#333",
    width: 70,
    textAlign: "center",
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  optionsContainer: {
    marginBottom: 16,
  },
  optionRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  optionLetter: {
    fontSize: 14,
    fontFamily: "Poppins_600SemiBold",
    color: "#4361EE",
    width: 24,
    marginRight: 8,
  },
  optionInput: {
    flex: 1,
    backgroundColor: "#F8F9FA",
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    fontFamily: "Poppins_400Regular",
    color: "#333",
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  optionDisplay: {
    fontSize: 14,
    fontFamily: "Poppins_400Regular",
    color: "#333",
    marginBottom: 6,
    paddingLeft: 8,
    backgroundColor: "#F8F9FA",
    padding: 8,
    borderRadius: 6,
  },
  tagsContainer: {
    marginBottom: 8,
  },
  tagsWrapper: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 8,
  },
  tag: {
    backgroundColor: "#E3F2FD",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 6,
  },
  tagText: {
    fontSize: 12,
    fontFamily: "Poppins_500Medium",
    color: "#1976D2",
  },
  generateMoreButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F0F4FF",
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: "#4361EE",
    borderStyle: "dashed",
    marginTop: 16,
  },
  generateMoreText: {
    fontSize: 14,
    fontFamily: "Poppins_500Medium",
    color: "#4361EE",
    marginLeft: 8,
  },
  summaryContainer: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    justifyContent: "space-around",
  },
  // Continuación de los estilos
  summaryItem: {
    alignItems: "center",
  },
  summaryNumber: {
    fontSize: 24,
    fontFamily: "Poppins_700Bold",
    color: "#4361EE",
  },
  summaryLabel: {
    fontSize: 12,
    fontFamily: "Poppins_400Regular",
    color: "#666",
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: "Poppins_600SemiBold",
    color: "#333",
    marginBottom: 12,
    marginTop: 8,
  },
  sectionDescription: {
    fontSize: 14,
    fontFamily: "Poppins_400Regular",
    color: "#666",
    marginBottom: 16,
  },
  addOptionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F0F4FF",
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: "#4361EE20",
    borderStyle: "dashed",
  },
  addOptionText: {
    fontSize: 14,
    fontFamily: "Poppins_500Medium",
    color: "#4361EE",
    marginLeft: 8,
  },
  openEndedInfo: {
    flexDirection: "row",
    backgroundColor: "#F0F4FF",
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
  },
  openEndedInfoText: {
    flex: 1,
    fontSize: 14,
    fontFamily: "Poppins_400Regular",
    color: "#4361EE",
    marginLeft: 12,
  },
  difficultyContainer: {
    flexDirection: "row",
    marginBottom: 24,
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: "#E5E5E5",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  nextButton: {
    backgroundColor: "#4361EE",
    borderRadius: 12,
    paddingVertical: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  disabledButton: {
    backgroundColor: "#A0A0A0",
  },
  nextButtonText: {
    fontSize: 16,
    fontFamily: "Poppins_600SemiBold",
    color: "#FFFFFF",
    marginRight: 8,
  },
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFEBEE",
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    flex: 1,
    fontSize: 14,
    fontFamily: "Poppins_400Regular",
    color: "#FF4444",
    marginLeft: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    width: "100%",
    maxWidth: 500,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: "Poppins_600SemiBold",
    color: "#333",
  },
  modalContent: {
    padding: 20,
  },
  modalOption: {
    flexDirection: "row",
    backgroundColor: "#F8F9FA",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  modalOptionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#F0F4FF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  modalOptionContent: {
    flex: 1,
  },
  modalOptionTitle: {
    fontSize: 16,
    fontFamily: "Poppins_600SemiBold",
    color: "#333",
    marginBottom: 4,
  },
  modalOptionDescription: {
    fontSize: 14,
    fontFamily: "Poppins_400Regular",
    color: "#666",
    lineHeight: 20,
  },
  // 🆕 Estilos para el modal de confirmación de eliminación
  deleteConfirmContent: {
    alignItems: "center",
    marginBottom: 24,
  },
  deleteConfirmTitle: {
    fontSize: 18,
    fontFamily: "Poppins_600SemiBold",
    color: "#333",
    marginTop: 16,
    marginBottom: 8,
  },
  deleteConfirmText: {
    fontSize: 14,
    fontFamily: "Poppins_400Regular",
    color: "#666",
    textAlign: "center",
    lineHeight: 20,
  },
  deleteConfirmButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  cancelButton: {
    flex: 1,
    backgroundColor: "#F5F5F5",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    marginRight: 8,
  },
  cancelButtonText: {
    fontSize: 14,
    fontFamily: "Poppins_600SemiBold",
    color: "#666",
  },
  confirmDeleteButton: {
    flex: 1,
    backgroundColor: "#FF4444",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    marginLeft: 8,
  },
  confirmDeleteButtonText: {
    fontSize: 14,
    fontFamily: "Poppins_600SemiBold",
    color: "#FFFFFF",
  },
})