"use client"

import { useState, useEffect, useRef } from "react"
import { View, StyleSheet, Text, ActivityIndicator, Animated, Dimensions } from "react-native"
import { MissionScreen } from "./mission-screen"
import { FeedbackScreen } from "./feedback-screen"
import { TransitionScreen } from "./transition-screen"
import { CharacterFeedback } from "./character-feedback"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { Feather } from "@expo/vector-icons"

const { width: screenWidth, height: screenHeight } = Dimensions.get('window')

// Tipo para imágenes (puede ser require local o URL)
type ImageSource = number | { uri: string }

// Tipo para una misión completa
type MissionType = {
  id: string | number
  missionNumber: number
  backgroundImage: ImageSource
  characterImage: ImageSource
  villainImage: ImageSource
  question: string
  questionType?: "MULTIPLE_CHOICE_SINGLE" | "MULTIPLE_CHOICE_MULTIPLE" | "OPEN_ENDED"
  options: {
    id: string
    text: string
    isCorrect: boolean
    isOpenEnded?: boolean
  }[]
  // Contenido para la pantalla de retroalimentación
  feedback: {
    correctImage: ImageSource
    incorrectImage: ImageSource
    correctBackground: ImageSource
    incorrectBackground: ImageSource
    correctDescription: string
    incorrectDescription: string
  }
  // Contenido para la pantalla de transición
  transition?: {
    backgroundImage: ImageSource
    image: ImageSource
    title: string
    description: string
  }
}

// Estados posibles de la misión
type MissionState = "QUESTION" | "FEEDBACK" | "TRANSITION" | "LOADING"

type MissionManagerProps = {
  missions: MissionType[]
  onComplete?: (
    score: number,
    totalMissions: number,
    aiScores?: number[],
    responseTimes?: number[],
    correctAnswers?: number,
    incorrectAnswers?: number,
  ) => void
}

// Tipo para la respuesta del endpoint de feedback
type FeedbackResponse = {
  success: boolean
  code: string
  message: string
  data: {
    score: number
    feedback: string
  }
  request_id: string
}

// Tipo para almacenar los resultados detallados
type QuestionResult = {
  questionId: string | number
  responseTime: number // tiempo en milisegundos
  aiScore: number
  feedback: string
  userAnswer: string | string[]
  isCorrect: boolean // basado en si el score > 0
}

// 🤖 Componente de pantalla de carga mejorada con IA
const AIEvaluationScreen = () => {
  // Animaciones
  const pulseAnim = useRef(new Animated.Value(1)).current
  const rotateAnim = useRef(new Animated.Value(0)).current
  const scaleAnim = useRef(new Animated.Value(0.8)).current
  const fadeAnim = useRef(new Animated.Value(0)).current
  const slideAnim = useRef(new Animated.Value(50)).current
  
  // Animación de partículas
  const particle1 = useRef(new Animated.Value(0)).current
  const particle2 = useRef(new Animated.Value(0)).current
  const particle3 = useRef(new Animated.Value(0)).current

  useEffect(() => {
    // Animación de entrada
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start()

    // Animación de pulso continua
    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    )

    // Animación de rotación continua
    const rotateAnimation = Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 3000,
        useNativeDriver: true,
      })
    )

    // Animaciones de partículas
    const particleAnimation1 = Animated.loop(
      Animated.sequence([
        Animated.timing(particle1, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(particle1, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    )

    const particleAnimation2 = Animated.loop(
      Animated.sequence([
        Animated.timing(particle2, {
          toValue: 1,
          duration: 2500,
          useNativeDriver: true,
        }),
        Animated.timing(particle2, {
          toValue: 0,
          duration: 2500,
          useNativeDriver: true,
        }),
      ])
    )

    const particleAnimation3 = Animated.loop(
      Animated.sequence([
        Animated.timing(particle3, {
          toValue: 1,
          duration: 1800,
          useNativeDriver: true,
        }),
        Animated.timing(particle3, {
          toValue: 0,
          duration: 1800,
          useNativeDriver: true,
        }),
      ])
    )

    // Iniciar animaciones
    pulseAnimation.start()
    rotateAnimation.start()
    
    // Delay para las partículas
    setTimeout(() => particleAnimation1.start(), 500)
    setTimeout(() => particleAnimation2.start(), 1000)
    setTimeout(() => particleAnimation3.start(), 1500)

    return () => {
      pulseAnimation.stop()
      rotateAnimation.stop()
      particleAnimation1.stop()
      particleAnimation2.stop()
      particleAnimation3.stop()
    }
  }, [])

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  })

  const particle1Y = particle1.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -100],
  })

  const particle2Y = particle2.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -120],
  })

  const particle3Y = particle3.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -80],
  })

  const particle1Opacity = particle1.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, 1, 0],
  })

  const particle2Opacity = particle2.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, 1, 0],
  })

  const particle3Opacity = particle3.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, 1, 0],
  })

  return (
    <View style={styles.aiLoadingContainer}>
      {/* Fondo con gradiente simulado */}
      <View style={styles.gradientBackground} />
      
      {/* Partículas flotantes */}
      <Animated.View 
        style={[
          styles.particle,
          styles.particle1,
          {
            opacity: particle1Opacity,
            transform: [{ translateY: particle1Y }]
          }
        ]}
      >
        <Feather name="cpu" size={20} color="#4CAF50" />
      </Animated.View>
      
      <Animated.View 
        style={[
          styles.particle,
          styles.particle2,
          {
            opacity: particle2Opacity,
            transform: [{ translateY: particle2Y }]
          }
        ]}
      >
        <Feather name="zap" size={16} color="#2196F3" />
      </Animated.View>
      
      <Animated.View 
        style={[
          styles.particle,
          styles.particle3,
          {
            opacity: particle3Opacity,
            transform: [{ translateY: particle3Y }]
          }
        ]}
      >
        <Feather name="activity" size={18} color="#FF9800" />
      </Animated.View>

      {/* Contenedor principal animado */}
      <Animated.View 
        style={[
          styles.aiMainContainer,
          {
            opacity: fadeAnim,
            transform: [
              { translateY: slideAnim },
              { scale: scaleAnim }
            ]
          }
        ]}
      >
        {/* Robot/IA Icon con animaciones */}
        <View style={styles.robotContainer}>
          {/* Círculos de fondo animados */}
          <Animated.View 
            style={[
              styles.robotCircle,
              styles.robotCircle1,
              { transform: [{ scale: pulseAnim }] }
            ]} 
          />
          <Animated.View 
            style={[
              styles.robotCircle,
              styles.robotCircle2,
              { transform: [{ rotate: spin }] }
            ]} 
          />
          <Animated.View 
            style={[
              styles.robotCircle,
              styles.robotCircle3,
              { transform: [{ scale: pulseAnim }, { rotate: spin }] }
            ]} 
          />
          
          {/* Robot principal */}
          <Animated.View 
            style={[
              styles.robotIcon,
              { transform: [{ scale: pulseAnim }] }
            ]}
          >
            <Feather name="cpu" size={40} color="#fff" />
          </Animated.View>
        </View>

        {/* Texto principal */}
        <Animated.Text 
          style={[
            styles.aiMainText,
            { opacity: fadeAnim }
          ]}
        >
          🤖 IA Evaluando
        </Animated.Text>

        {/* Subtexto con animación */}
        <Animated.View 
          style={[
            styles.aiSubtextContainer,
            { 
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }
          ]}
        >
          <Text style={styles.aiSubtext}>
            Analizando tu respuesta con inteligencia artificial...
          </Text>
        </Animated.View>

        {/* Indicador de progreso personalizado */}
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <Animated.View 
              style={[
                styles.progressFill,
                { transform: [{ scaleX: pulseAnim }] }
              ]} 
            />
          </View>
          <Text style={styles.progressText}>Procesando datos</Text>
        </View>

        {/* Puntos de carga animados */}
        <View style={styles.dotsContainer}>
          <Animated.View 
            style={[
              styles.dot,
              { transform: [{ scale: pulseAnim }] }
            ]} 
          />
          <Animated.View 
            style={[
              styles.dot,
              { transform: [{ scale: pulseAnim }] }
            ]} 
          />
          <Animated.View 
            style={[
              styles.dot,
              { transform: [{ scale: pulseAnim }] }
            ]} 
          />
        </View>

        {/* Información adicional */}
        <Animated.View 
          style={[
            styles.infoContainer,
            { opacity: fadeAnim }
          ]}
        >
          <View style={styles.infoItem}>
            <Feather name="brain" size={16} color="#4CAF50" />
            <Text style={styles.infoText}>Análisis semántico</Text>
          </View>
          <View style={styles.infoItem}>
            <Feather name="target" size={16} color="#2196F3" />
            <Text style={styles.infoText}>Evaluación de precisión</Text>
          </View>
          <View style={styles.infoItem}>
            <Feather name="award" size={16} color="#FF9800" />
            <Text style={styles.infoText}>Generando feedback</Text>
          </View>
        </Animated.View>
      </Animated.View>
    </View>
  )
}

export const MissionManager = ({ missions, onComplete }: MissionManagerProps) => {
  const [currentMissionIndex, setCurrentMissionIndex] = useState(0)
  const [score, setScore] = useState(0)
  const [missionState, setMissionState] = useState<MissionState>("QUESTION")
  const [lastAnswerCorrect, setLastAnswerCorrect] = useState(false)
  const [showCharacterFeedback, setShowCharacterFeedback] = useState(true)
  const [userAnswers, setUserAnswers] = useState<{ [key: number]: string }>({})
  const [aiFeedback, setAiFeedback] = useState<string>("")
  const [aiScore, setAiScore] = useState<number>(0)
  const [isLoadingFeedback, setIsLoadingFeedback] = useState(false)

  // Nuevos estados para tracking
  const [aiScores, setAiScores] = useState<number[]>([])
  const [responseTimes, setResponseTimes] = useState<number[]>([])
  const [questionResults, setQuestionResults] = useState<QuestionResult[]>([])
  const [correctAnswers, setCorrectAnswers] = useState<number>(0)
  const [incorrectAnswers, setIncorrectAnswers] = useState<number>(0)
  const questionStartTimeRef = useRef<number>(Date.now())

  useEffect(() => {
    console.log("🎯 MISSION MANAGER - Estado actual:")
    console.log("- currentMissionIndex:", currentMissionIndex)
    console.log("- missionState:", missionState)
    console.log("- missions.length:", missions.length)
    console.log("- showCharacterFeedback:", showCharacterFeedback)
    console.log("- correctAnswers:", correctAnswers)
    console.log("- incorrectAnswers:", incorrectAnswers)

    // Reiniciar el tiempo de inicio cuando cambia la misión o el estado
    if (missionState === "QUESTION") {
      questionStartTimeRef.current = Date.now()
      console.log("⏱️ Tiempo de inicio registrado:", questionStartTimeRef.current)
    }
  }, [currentMissionIndex, missionState, missions.length, showCharacterFeedback])

  // Función para llamar al endpoint de feedback de IA
  const generateFeedback = async (questionId: string, responseStudent: string[]): Promise<FeedbackResponse | null> => {
    try {
      console.log("🚀 Llamando al endpoint de feedback de IA")

      // Obtener room_id y token del AsyncStorage
      const roomId = await AsyncStorage.getItem("roomId")
      const token = await AsyncStorage.getItem("studentToken")

      if (!roomId) {
        console.error("❌ No se encontró room_id en AsyncStorage")
        return null
      }

      if (!token) {
        console.error("❌ No se encontró token en AsyncStorage")
        return null
      }

      console.log("📦 Datos para el endpoint:", {
        room_id: roomId,
        question_id: questionId,
        response_student: responseStudent,
      })
      console.log("TOKEN:", token)

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

      console.log(response)

      if (!response.ok) {
        const errorData = await response.json().catch(() => null)
        const errorMessage = errorData?.message || `Error HTTP: ${response.status}`
        throw new Error(errorMessage)
      }

      const data: FeedbackResponse = await response.json()
      console.log("✅ Respuesta del endpoint de feedback:", data)

      return data
    } catch (error) {
      console.error("❌ Error llamando al endpoint de feedback:", error)
      return null
    }
  }

  const handleSubmit = async (selectedOption: string | string[], isCorrect: boolean, userAnswer?: string) => {
    console.log("🎯 HANDLE SUBMIT - Iniciando procesamiento")
    console.log("- currentMissionIndex:", currentMissionIndex)
    console.log("- missions.length:", missions.length)

    if (currentMissionIndex >= missions.length) {
      console.log("❌ Índice de misión fuera de rango")
      return
    }

    // Calcular el tiempo de respuesta
    const endTime = Date.now()
    const responseTime = endTime - questionStartTimeRef.current
    console.log("⏱️ Tiempo de respuesta:", responseTime, "ms")

    // Guardar el tiempo de respuesta
    setResponseTimes((prev) => [...prev, responseTime])

    const currentMission = missions[currentMissionIndex]
    console.log("- currentMission:", currentMission.missionNumber)
    console.log("- questionType:", currentMission.questionType)

    // Cambiar a estado de carga
    setIsLoadingFeedback(true)
    setMissionState("LOADING")

    try {
      // Preparar la respuesta del estudiante
      let responseStudent: string[] = []

      if (currentMission.questionType === "OPEN_ENDED" && userAnswer) {
        // Para preguntas abiertas, usar la respuesta del usuario
        responseStudent = [userAnswer]

        // Guardar la respuesta del usuario
        setUserAnswers((prev) => ({
          ...prev,
          [currentMissionIndex]: userAnswer,
        }))
      } else if (currentMission.questionType === "MULTIPLE_CHOICE_SINGLE") {
        // Para opción única, usar el texto de la opción seleccionada
        const selectedOptionObj = currentMission.options.find((opt) => opt.id === selectedOption)
        if (selectedOptionObj) {
          responseStudent = [selectedOptionObj.text]
        }
        console.log("📝 SINGLE CHOICE - Respuesta preparada:", responseStudent)
      } else if (currentMission.questionType === "MULTIPLE_CHOICE_MULTIPLE") {
        // 🔥 PARA MÚLTIPLES OPCIONES, ENVIAR TODAS LAS RESPUESTAS SELECCIONADAS
        if (Array.isArray(selectedOption)) {
          const selectedOptionObjects = currentMission.options.filter((opt) => selectedOption.includes(opt.id))
          responseStudent = selectedOptionObjects.map((opt) => opt.text)
        }
        console.log("📝 MULTIPLE CHOICE - Respuestas preparadas:", responseStudent)
      }

      // Obtener el ID de la pregunta actual
      const questionId = currentMission.id.toString()

      console.log("🚀 ENVIANDO AL ENDPOINT DE IA:")
      console.log("- questionId:", questionId)
      console.log("- responseStudent:", responseStudent)
      console.log("- Número de respuestas:", responseStudent.length)

      // Llamar al endpoint de feedback
      const feedbackResponse = await generateFeedback(questionId, responseStudent)

      let currentAiScore = 0
      let currentFeedback = ""
      let isAnswerCorrect = false

      if (feedbackResponse && feedbackResponse.success) {
        // Usar el feedback y score del endpoint
        currentAiScore = feedbackResponse.data.score
        currentFeedback = feedbackResponse.data.feedback

        // 🎯 DETERMINAR SI LA RESPUESTA ES CORRECTA BASADO EN EL SCORE
        // Si el score es mayor a 0, consideramos la respuesta como correcta
        isAnswerCorrect = currentAiScore > 0

        console.log("🎯 EVALUACIÓN DE RESPUESTA:")
        console.log("- Score de IA:", currentAiScore)
        console.log("- ¿Es correcta?:", isAnswerCorrect)
        console.log("- Lógica: score > 0 =", currentAiScore > 0)

        setAiFeedback(currentFeedback)
        setAiScore(currentAiScore)

        // Guardar el score de IA
        setAiScores((prev) => [...prev, currentAiScore])

        // 🎯 ACTUALIZAR CONTADORES DE RESPUESTAS CORRECTAS/INCORRECTAS
        if (isAnswerCorrect) {
          setCorrectAnswers((prev) => prev + 1)
          console.log("✅ Respuesta CORRECTA (score > 0) - Incrementando contador")
        } else {
          setIncorrectAnswers((prev) => prev + 1)
          console.log("❌ Respuesta INCORRECTA (score = 0) - Incrementando contador")
        }

        // Actualizar puntuación total
        setScore((prevScore) => prevScore + currentAiScore)

        // Para el feedback visual
        setLastAnswerCorrect(isAnswerCorrect)
      } else {
        // Fallback al comportamiento original si falla el endpoint
        setAiFeedback("")
        setAiScore(0)

        // Guardar un score de 0 para esta pregunta
        setAiScores((prev) => [...prev, 0])

        // En caso de error, usar la lógica original
        isAnswerCorrect = isCorrect
        if (isCorrect) {
          setScore((prevScore) => prevScore + 1)
          setCorrectAnswers((prev) => prev + 1)
        } else {
          setIncorrectAnswers((prev) => prev + 1)
        }
        setLastAnswerCorrect(isCorrect)
      }

      // Guardar resultado detallado
      setQuestionResults((prev) => [
        ...prev,
        {
          questionId: questionId,
          responseTime: responseTime,
          aiScore: currentAiScore,
          feedback: currentFeedback || "No se pudo obtener feedback del servidor",
          userAnswer: Array.isArray(selectedOption) ? selectedOption : [selectedOption || userAnswer || ""],
          isCorrect: isAnswerCorrect,
        },
      ])

      console.log("📊 ESTADÍSTICAS ACTUALIZADAS:")
      console.log("- Respuestas correctas:", isAnswerCorrect ? correctAnswers + 1 : correctAnswers)
      console.log("- Respuestas incorrectas:", isAnswerCorrect ? incorrectAnswers : incorrectAnswers + 1)
      console.log("- Score total:", currentAiScore > 0 ? score + currentAiScore : score)
    } catch (error) {
      console.error("❌ Error en handleSubmit:", error)

      // Fallback al comportamiento original
      setAiFeedback("")
      setAiScore(0)

      // Guardar un score de 0 para esta pregunta
      setAiScores((prev) => [...prev, 0])

      // En caso de error, incrementar incorrectas
      setIncorrectAnswers((prev) => prev + 1)
      setLastAnswerCorrect(false)

      // Guardar resultado con error
      setQuestionResults((prev) => [
        ...prev,
        {
          questionId: currentMission.id.toString(),
          responseTime: responseTime,
          aiScore: 0,
          feedback: "Error al procesar la respuesta",
          userAnswer: userAnswer || "Sin respuesta",
          isCorrect: false,
        },
      ])
    } finally {
      setIsLoadingFeedback(false)
    }

    // Continuar con el flujo normal
    console.log("🎯 Cambiando a estado FEEDBACK")
    setShowCharacterFeedback(true)
    setMissionState("FEEDBACK")
  }

  useEffect(() => {
    if (missionState === "FEEDBACK" && showCharacterFeedback) {
      console.log("⏰ Iniciando timer para ocultar character feedback")
      const timer = setTimeout(() => {
        console.log("⏰ Timer completado - ocultando character feedback")
        setShowCharacterFeedback(false)
      }, 2000)
      return () => {
        console.log("⏰ Limpiando timer")
        clearTimeout(timer)
      }
    }
  }, [missionState, showCharacterFeedback])

  const handleFeedbackContinue = () => {
    console.log("🎯 HANDLE FEEDBACK CONTINUE")
    console.log("- currentMissionIndex:", currentMissionIndex)
    console.log("- missions.length:", missions.length)

    // Limpiar feedback para la siguiente pregunta
    setAiFeedback("")
    setAiScore(0)

    // Si es la última misión, llamar a onComplete
    if (currentMissionIndex >= missions.length - 1) {
      console.log("🏁 Última misión completada - llamando onComplete")
      console.log("📊 ESTADÍSTICAS FINALES:")
      console.log("- Respuestas correctas:", correctAnswers)
      console.log("- Respuestas incorrectas:", incorrectAnswers)
      console.log("- Score total:", score)
      console.log("- Total de misiones:", missions.length)

      if (onComplete) {
        // Pasar todos los datos incluyendo respuestas correctas e incorrectas
        onComplete(score, missions.length, aiScores, responseTimes, correctAnswers, incorrectAnswers)

        // Guardar los resultados en AsyncStorage para acceso posterior
        try {
          AsyncStorage.setItem(
            "quizResults",
            JSON.stringify({
              score,
              totalMissions: missions.length,
              aiScores,
              responseTimes,
              questionResults,
              correctAnswers,
              incorrectAnswers,
            }),
          )
          console.log("💾 Resultados guardados en AsyncStorage")
        } catch (error) {
          console.error("❌ Error guardando resultados:", error)
        }
      }
      return
    }

    // Verificar si hay información de transición disponible
    const nextMission = missions[currentMissionIndex + 1]
    console.log("- nextMission:", nextMission?.missionNumber)
    console.log("- tiene transición:", !!nextMission?.transition)

    if (nextMission && nextMission.transition) {
      // Cambiar al estado de transición
      console.log("🔄 Cambiando a estado TRANSITION")
      setMissionState("TRANSITION")
    } else {
      // Si no hay información de transición, avanzar directamente a la siguiente misión
      console.log("➡️ Avanzando directamente a la siguiente misión")
      setCurrentMissionIndex((prev) => {
        const newIndex = prev + 1
        console.log("- Nuevo índice:", newIndex)
        return newIndex
      })
      setMissionState("QUESTION")
    }
  }

  const handleTransitionFinish = () => {
    console.log("🎯 HANDLE TRANSITION FINISH")
    console.log("- currentMissionIndex antes:", currentMissionIndex)

    // Avanzar a la siguiente misión
    setCurrentMissionIndex((prev) => {
      const newIndex = prev + 1
      console.log("- Nuevo índice después de transición:", newIndex)
      return newIndex
    })

    // Volver al estado de pregunta
    console.log("🔄 Cambiando a estado QUESTION")
    setMissionState("QUESTION")
  }

  // Renderizar según el estado actual
  const currentMission = missions[currentMissionIndex]

  console.log("🎨 RENDERIZANDO ESTADO:", missionState)
  console.log("- currentMission existe:", !!currentMission)
  console.log("- currentMission número:", currentMission?.missionNumber)

  if (!currentMission) {
    console.log("❌ No hay misión actual - renderizando null")
    return null
  }

  switch (missionState) {
    case "LOADING":
      console.log("🔄 Renderizando pantalla de carga mejorada")
      return <AIEvaluationScreen />

    case "QUESTION":
      console.log("❓ Renderizando pantalla de pregunta")
      console.log("- Misión:", currentMission.missionNumber)
      console.log("- Tipo:", currentMission.questionType)
      return (
        <View style={styles.container}>
          <MissionScreen
            missionNumber={currentMission.missionNumber}
            backgroundImage={currentMission.backgroundImage}
            characterImage={currentMission.villainImage}
            question={currentMission.question}
            questionType={currentMission.questionType}
            options={currentMission.options}
            onSubmit={handleSubmit}
          />
        </View>
      )

    case "FEEDBACK":
      console.log("💬 Renderizando pantalla de feedback")
      console.log("- showCharacterFeedback:", showCharacterFeedback)

      // Verificar que exista el objeto feedback
      if (!currentMission.feedback) {
        console.error(`❌ La misión ${currentMission.id} no tiene definido el objeto feedback`)
        // Avanzar a la siguiente misión o estado
        handleFeedbackContinue()
        return null
      }

      return (
        <View style={styles.container}>
          {showCharacterFeedback ? (
            <CharacterFeedback
              isCorrect={lastAnswerCorrect}
              characterImage={currentMission.characterImage}
              backgroundImage={currentMission.backgroundImage}
            />
          ) : (
            <FeedbackScreen
              isCorrect={lastAnswerCorrect}
              correctImage={currentMission.feedback.correctImage}
              incorrectImage={currentMission.feedback.incorrectImage}
              correctBackground={currentMission.feedback.correctBackground}
              incorrectBackground={currentMission.feedback.incorrectBackground}
              correctDescription={
                aiFeedback || // Usar feedback de IA si está disponible
                (currentMission.questionType === "OPEN_ENDED"
                  ? "¡Gracias por tu respuesta! Continuemos con la siguiente pregunta."
                  : currentMission.feedback.correctDescription)
              }
              incorrectDescription={
                aiFeedback || // Usar feedback de IA si está disponible
                (currentMission.questionType === "OPEN_ENDED"
                  ? "¡Gracias por tu respuesta! Continuemos con la siguiente pregunta."
                  : currentMission.feedback.incorrectDescription)
              }
              userAnswer={userAnswers[currentMissionIndex]}
              isOpenEnded={currentMission.questionType === "OPEN_ENDED"}
              aiScore={aiScore} // Pasar score de IA
              onContinue={handleFeedbackContinue}
            />
          )}
        </View>
      )

    case "TRANSITION":
      console.log("🔄 Renderizando pantalla de transición")

      // Si es la última misión, no mostrar transición
      if (currentMissionIndex >= missions.length - 1) {
        console.log("❌ Es la última misión - no mostrar transición")
        return null
      }

      const nextMission = missions[currentMissionIndex + 1]

      // Verificar que exista la siguiente misión y su objeto transition
      if (!nextMission || !nextMission.transition) {
        console.error(`❌ La misión ${currentMissionIndex + 1} no tiene definido el objeto transition`)
        // Avanzar directamente a la siguiente misión
        handleTransitionFinish()
        return null
      }

      console.log("- Transición hacia misión:", nextMission.missionNumber)

      return (
        <View style={styles.container}>
          <TransitionScreen
            backgroundImage={nextMission.transition.backgroundImage}
            image={nextMission.transition.image}
            title={nextMission.transition.title}
            description={nextMission.transition.description}
            missionNumber={nextMission.missionNumber}
            onFinishTransition={handleTransitionFinish}
          />
        </View>
      )

    default:
      console.log("❌ Estado no reconocido:", missionState)
      return null
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  // 🤖 Estilos para la pantalla de evaluación de IA mejorada
  aiLoadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0a0a0a',
    position: 'relative',
  },
  gradientBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#0a0a0a',
    opacity: 0.95,
  },
  aiMainContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    zIndex: 10,
  },
  robotContainer: {
    position: 'relative',
    width: 120,
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 30,
  },
  robotCircle: {
    position: 'absolute',
    borderRadius: 100,
    borderWidth: 2,
  },
  robotCircle1: {
    width: 120,
    height: 120,
    borderColor: 'rgba(76, 175, 80, 0.3)',
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
  },
  robotCircle2: {
    width: 90,
    height: 90,
    borderColor: 'rgba(33, 150, 243, 0.4)',
    backgroundColor: 'rgba(33, 150, 243, 0.1)',
    borderStyle: 'dashed',
  },
  robotCircle3: {
    width: 60,
    height: 60,
    borderColor: 'rgba(255, 152, 0, 0.5)',
    backgroundColor: 'rgba(255, 152, 0, 0.1)',
  },
  robotIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#4CAF50',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 20,
    elevation: 10,
  },
  aiMainText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 15,
    letterSpacing: 1,
  },
  aiSubtextContainer: {
    marginBottom: 30,
    paddingHorizontal: 20,
  },
  aiSubtext: {
    fontSize: 16,
    color: '#B0BEC5',
    textAlign: 'center',
    lineHeight: 24,
  },
  progressContainer: {
    width: screenWidth * 0.7,
    alignItems: 'center',
    marginBottom: 25,
  },
  progressBar: {
    width: '100%',
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 10,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4CAF50',
    borderRadius: 3,
    width: '70%',
  },
  progressText: {
    fontSize: 12,
    color: '#78909C',
    textAlign: 'center',
  },
  dotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 30,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4CAF50',
    marginHorizontal: 4,
  },
  infoContainer: {
    alignItems: 'center',
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 5,
    paddingHorizontal: 15,
    paddingVertical: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  infoText: {
    fontSize: 14,
    color: '#E0E0E0',
    marginLeft: 10,
    fontWeight: '500',
  },
  // Partículas flotantes
  particle: {
    position: 'absolute',
    zIndex: 5,
  },
  particle1: {
    top: '30%',
    left: '20%',
  },
  particle2: {
    top: '40%',
    right: '25%',
  },
  particle3: {
    top: '60%',
    left: '15%',
  },
})