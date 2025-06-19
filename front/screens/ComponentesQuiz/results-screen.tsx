"use client"
import { View, Text, StyleSheet, TouchableOpacity, Image, Animated, Dimensions, ScrollView } from "react-native"
import { useState, useEffect } from "react"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { removeSavedCharacterImage } from "../../screens/ComponentesHero/saveCharacterImage"

type CharacterName = "Qhapaq" | "Amaru" | "Killa"
type VillainName = "Corporatus" | "Toxicus" | "Shadowman"

// Tipo para resultados detallados
type QuestionResult = {
  questionId: string | number
  responseTime: number // tiempo en milisegundos
  aiScore: number
  feedback: string
  userAnswer: string | string[]
  isCorrect: boolean // basado en si el score > 0
}

// Imágenes de celebración por personaje
const characterCelebrationImages: Record<CharacterName, any> = {
  Qhapaq: require("../../assets/images/chaman.png"),
  Amaru: require("../../assets/Personajes/Amaru1.png"),
  Killa: require("../../assets/Personajes/Guerrera.png"),
}

// Fondos por personaje
const characterBackgrounds: Record<CharacterName, any> = {
  Qhapaq: require("../../assets/fondoQuiz/FondoQuiz-Qhapaq.png"),
  Amaru: require("../../assets/fondoQuiz/FondoQuiz-Amaru.png"),
  Killa: require("../../assets/fondoQuiz/FondoQuiz-Killa.png"),
}

const { width, height } = Dimensions.get("window")

const ResultsScreen = ({ route, navigation }) => {
  // Obtener los parámetros de la ruta
  const {
    score,
    totalMissions,
    aiScores = [],
    responseTimes = [],
    questionResults = [],
    correctAnswers = 0,
    incorrectAnswers = 0,
  } = route.params || {
    score: 0,
    totalMissions: 0,
    aiScores: [],
    responseTimes: [],
    questionResults: [],
    correctAnswers: 0,
    incorrectAnswers: 0,
  }

  const [characterName, setCharacterName] = useState<CharacterName>("Qhapaq")
  const [fadeAnim] = useState(new Animated.Value(0))
  const [scaleAnim] = useState(new Animated.Value(0.8))
  const [bounceAnim] = useState(new Animated.Value(0))
  const [showDetails, setShowDetails] = useState(false)
  const [storedResults, setStoredResults] = useState<any>(null)

  // Cargar información del personaje y resultados guardados
  useEffect(() => {
    const loadData = async () => {
      try {
        // Cargar personaje
        const savedCharacter = await AsyncStorage.getItem("selectedCharacterName")
        if (savedCharacter) {
          setCharacterName(savedCharacter as CharacterName)
        }

        // Cargar resultados guardados si no se pasaron por parámetros
        if (!aiScores.length || !responseTimes.length) {
          const savedResults = await AsyncStorage.getItem("quizResults")
          if (savedResults) {
            const parsedResults = JSON.parse(savedResults)
            setStoredResults(parsedResults)
            console.log("📊 Resultados cargados desde AsyncStorage:", parsedResults)
          }
        }
      } catch (error) {
        console.error("Error cargando datos:", error)
      }
    }
    loadData()
  }, [])

  // Usar resultados almacenados si están disponibles y no hay parámetros
  const finalAiScores = aiScores.length > 0 ? aiScores : storedResults?.aiScores || []
  const finalResponseTimes = responseTimes.length > 0 ? responseTimes : storedResults?.responseTimes || []
  const finalQuestionResults = questionResults.length > 0 ? questionResults : storedResults?.questionResults || []
  const finalScore = score || storedResults?.score || 0
  const finalTotalMissions = totalMissions || storedResults?.totalMissions || 0
  const finalCorrectAnswers = correctAnswers || storedResults?.correctAnswers || 0
  const finalIncorrectAnswers = incorrectAnswers || storedResults?.incorrectAnswers || 0

  // Animaciones de entrada
  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 6,
          tension: 40,
          useNativeDriver: true,
        }),
      ]),
      Animated.spring(bounceAnim, {
        toValue: 1,
        friction: 4,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start()
  }, [])

  // Calcular estadísticas mejoradas
  const calculateStats = () => {
    // Si tenemos scores de IA, usarlos para cálculos más precisos
    if (finalAiScores && finalAiScores.length > 0) {
      const totalAIScore = finalAiScores.reduce((sum, score) => sum + score, 0)
      const averageAIScore = totalAIScore / finalAiScores.length
      const maxPossibleScore = finalAiScores.length * 100 // Asumiendo 100 como score máximo por pregunta
      const percentage = Math.round((totalAIScore / maxPossibleScore) * 100)

      // Calcular tiempo promedio de respuesta
      const totalResponseTime = finalResponseTimes.reduce((sum, time) => sum + time, 0)
      const averageResponseTime = totalResponseTime / finalResponseTimes.length

      // Calcular porcentaje de respuestas correctas
      const totalQuestions = finalCorrectAnswers + finalIncorrectAnswers
      const correctPercentage = totalQuestions > 0 ? Math.round((finalCorrectAnswers / totalQuestions) * 100) : 0

      return {
        totalScore: totalAIScore,
        averageScore: Math.round(averageAIScore),
        percentage: percentage,
        correctPercentage: correctPercentage,
        questionsAnswered: finalAiScores.length,
        correctAnswers: finalCorrectAnswers,
        incorrectAnswers: finalIncorrectAnswers,
        isAIScored: true,
        totalResponseTime: totalResponseTime,
        averageResponseTime: Math.round(averageResponseTime / 1000), // convertir a segundos
        fastestResponse: Math.min(...finalResponseTimes) / 1000,
        slowestResponse: Math.max(...finalResponseTimes) / 1000,
      }
    } else {
      // Fallback al sistema tradicional
      const percentage = finalTotalMissions > 0 ? Math.round((finalScore / finalTotalMissions) * 100) : 0
      const correctPercentage =
        finalTotalMissions > 0 ? Math.round((finalCorrectAnswers / finalTotalMissions) * 100) : 0

      // Calcular tiempo promedio de respuesta si está disponible
      let timeStats = {}
      if (finalResponseTimes && finalResponseTimes.length > 0) {
        const totalResponseTime = finalResponseTimes.reduce((sum, time) => sum + time, 0)
        timeStats = {
          totalResponseTime: totalResponseTime,
          averageResponseTime: Math.round(totalResponseTime / finalResponseTimes.length / 1000),
          fastestResponse: Math.min(...finalResponseTimes) / 1000,
          slowestResponse: Math.max(...finalResponseTimes) / 1000,
        }
      }

      return {
        totalScore: finalScore,
        averageScore: finalTotalMissions > 0 ? Math.round((finalScore / finalTotalMissions) * 100) : 0,
        percentage: percentage,
        correctPercentage: correctPercentage,
        questionsAnswered: finalTotalMissions,
        correctAnswers: finalCorrectAnswers,
        incorrectAnswers: finalIncorrectAnswers,
        isAIScored: false,
        ...timeStats,
      }
    }
  }

  const stats = calculateStats()

  // Determinar el mensaje según el rendimiento
  const getMessage = () => {
    if (stats.correctPercentage >= 90) return "¡Rendimiento Excepcional!"
    if (stats.correctPercentage >= 80) return "¡Excelente trabajo!"
    if (stats.correctPercentage >= 70) return "¡Muy buen trabajo!"
    if (stats.correctPercentage >= 60) return "¡Buen trabajo!"
    if (stats.correctPercentage >= 50) return "¡Puedes mejorar!"
    if (stats.correctPercentage >= 30) return "¡Sigue practicando!"
    return "¡No te rindas, inténtalo de nuevo!"
  }

  // Determinar el color según el rendimiento
  const getPerformanceColor = () => {
    if (stats.correctPercentage >= 80) return "#4CAF50" // Verde
    if (stats.correctPercentage >= 60) return "#FF9800" // Naranja
    if (stats.correctPercentage >= 40) return "#FFC107" // Amarillo
    return "#F44336" // Rojo
  }

  // Determinar el emoji según el rendimiento
  const getPerformanceEmoji = () => {
    if (stats.correctPercentage >= 90) return "🏆"
    if (stats.correctPercentage >= 80) return "🌟"
    if (stats.correctPercentage >= 70) return "👏"
    if (stats.correctPercentage >= 60) return "👍"
    if (stats.correctPercentage >= 50) return "💪"
    return "🎯"
  }

  // Función corregida para navegar al dashboard
  const handleGoToDashboard = () => {
    removeSavedCharacterImage()

    try {
      // Método 1: Usar reset para volver al estado inicial de navegación
      // Este método es el más robusto para navegar entre navegadores anidados
      navigation.reset({
        index: 0,
        routes: [{ name: "MainTabs" }],
      })

      console.log("✅ Navegación exitosa al dashboard de estudiantes")
    } catch (error) {
      console.error("❌ Error al navegar al dashboard:", error)

      // Método 2 (alternativo): Intentar navegar con rutas anidadas
      try {
        navigation.navigate("MainTabs", { screen: "StudentDashboard" })
        console.log("✅ Navegación alternativa exitosa")
      } catch (fallbackError) {
        console.error("❌ Error en navegación alternativa:", fallbackError)

        // Método 3 (último recurso): Intentar a través del navegador padre
        try {
          const parent = navigation.getParent()
          if (parent) {
            parent.navigate("MainTabs")
            console.log("✅ Navegación a través del padre exitosa")
          }
        } catch (parentError) {
          console.error("❌ Error en todos los métodos de navegación:", parentError)
          alert("No se pudo navegar al dashboard. Por favor, inténtalo de nuevo.")
        }
      }
    }
  }

  const handleRetry = () => {
    navigation.navigate("Quiz")
  }

  const handleViewDetails = () => {
    setShowDetails(!showDetails)
  }

  // Formatear tiempo para mostrar
  const formatTime = (timeInSeconds) => {
    if (timeInSeconds < 60) {
      return `${timeInSeconds.toFixed(1)} seg`
    } else {
      const minutes = Math.floor(timeInSeconds / 60)
      const seconds = Math.round(timeInSeconds % 60)
      return `${minutes}m ${seconds}s`
    }
  }

  return (
    <ScrollView
      style={[
        styles.scrollContainer,
        { backgroundColor: characterName === "Qhapaq" ? "#8B4513" : characterName === "Amaru" ? "#2E8B57" : "#4B0082" },
      ]}
    >
      <View style={styles.container}>
        <Animated.View style={[styles.content, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>
          {/* Imagen del personaje */}
          <Animated.View style={[styles.characterContainer, { transform: [{ scale: bounceAnim }] }]}>
            <Image
              source={characterCelebrationImages[characterName]}
              style={styles.characterImage}
              resizeMode="contain"
            />
          </Animated.View>

          {/* Título con emoji */}
          <Text style={styles.title}>
            {getPerformanceEmoji()} Resultados {getPerformanceEmoji()}
          </Text>

          {/* Contenedor principal de resultados */}
          <View style={styles.resultContainer}>
            {/* Puntuación principal */}
            <View style={styles.mainScoreContainer}>
              <Text style={[styles.percentageText, { color: getPerformanceColor() }]}>{stats.correctPercentage}%</Text>
              <Text style={styles.messageText}>{getMessage()}</Text>
            </View>

            {/* Estadísticas de respuestas correctas/incorrectas */}
            <View style={styles.answersStatsContainer}>
              <Text style={styles.answersStatsTitle}>📊 Resumen de Respuestas</Text>

              <View style={styles.answersStatsGrid}>
                <View style={styles.answerStatItem}>
                  <View style={[styles.answerStatIcon, { backgroundColor: "#4CAF50" }]}>
                    <Text style={styles.answerStatIconText}>✓</Text>
                  </View>
                  <Text style={styles.answerStatLabel}>Correctas</Text>
                  <Text style={[styles.answerStatValue, { color: "#4CAF50" }]}>{stats.correctAnswers}</Text>
                </View>

                <View style={styles.answerStatItem}>
                  <View style={[styles.answerStatIcon, { backgroundColor: "#F44336" }]}>
                    <Text style={styles.answerStatIconText}>✗</Text>
                  </View>
                  <Text style={styles.answerStatLabel}>Incorrectas</Text>
                  <Text style={[styles.answerStatValue, { color: "#F44336" }]}>{stats.incorrectAnswers}</Text>
                </View>

                <View style={styles.answerStatItem}>
                  <View style={[styles.answerStatIcon, { backgroundColor: "#2196F3" }]}>
                    <Text style={styles.answerStatIconText}>#</Text>
                  </View>
                  <Text style={styles.answerStatLabel}>Total</Text>
                  <Text style={[styles.answerStatValue, { color: "#2196F3" }]}>{stats.questionsAnswered}</Text>
                </View>

                <View style={styles.answerStatItem}>
                  <View style={[styles.answerStatIcon, { backgroundColor: "#FF9800" }]}>
                    <Text style={styles.answerStatIconText}>%</Text>
                  </View>
                  <Text style={styles.answerStatLabel}>Aciertos</Text>
                  <Text style={[styles.answerStatValue, { color: "#FF9800" }]}>{stats.correctPercentage}%</Text>
                </View>
              </View>
            </View>

            {/* Estadísticas detalladas */}
            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Preguntas</Text>
                <Text style={styles.statValue}>{stats.questionsAnswered}</Text>
              </View>

              <View style={styles.statItem}>
                <Text style={styles.statLabel}>{stats.isAIScored ? "Score Total" : "Correctas"}</Text>
                <Text style={styles.statValue}>{stats.totalScore}</Text>
              </View>

              <View style={styles.statItem}>
                <Text style={styles.statLabel}>{stats.isAIScored ? "Promedio" : "Porcentaje"}</Text>
                <Text style={styles.statValue}>{stats.isAIScored ? stats.averageScore : `${stats.percentage}%`}</Text>
              </View>
            </View>

            {/* Estadísticas de tiempo */}
            {stats.averageResponseTime && (
              <View style={styles.timeStatsContainer}>
                <Text style={styles.timeStatsTitle}>⏱️ Estadísticas de Tiempo</Text>

                <View style={styles.timeStatsGrid}>
                  <View style={styles.timeStatItem}>
                    <Text style={styles.timeStatLabel}>Tiempo Promedio</Text>
                    <Text style={styles.timeStatValue}>{formatTime(stats.averageResponseTime)}</Text>
                  </View>

                  <View style={styles.timeStatItem}>
                    <Text style={styles.timeStatLabel}>Respuesta más Rápida</Text>
                    <Text style={styles.timeStatValue}>{formatTime(stats.fastestResponse)}</Text>
                  </View>

                  <View style={styles.timeStatItem}>
                    <Text style={styles.timeStatLabel}>Respuesta más Lenta</Text>
                    <Text style={styles.timeStatValue}>{formatTime(stats.slowestResponse)}</Text>
                  </View>

                  <View style={styles.timeStatItem}>
                    <Text style={styles.timeStatLabel}>Tiempo Total</Text>
                    <Text style={styles.timeStatValue}>{formatTime(stats.totalResponseTime / 1000)}</Text>
                  </View>
                </View>
              </View>
            )}

            {/* Información adicional si es score de IA */}
            {stats.isAIScored && (
              <View style={styles.aiInfoContainer}>
                <Text style={styles.aiInfoText}>✨ Evaluado con Inteligencia Artificial</Text>
                <Text style={styles.aiInfoSubtext}>Puntuación basada en la calidad y precisión de tus respuestas</Text>
              </View>
            )}

            {/* Información del personaje */}
            <View style={styles.characterInfoContainer}>
              <Text style={styles.characterInfoText}>Aventura completada con {characterName}</Text>
            </View>
          </View>

          {/* Detalles de respuestas */}
          {showDetails && finalQuestionResults && finalQuestionResults.length > 0 && (
            <View style={styles.detailedResultsContainer}>
              <Text style={styles.detailedResultsTitle}>📝 Detalles de Respuestas</Text>

              {finalQuestionResults.map((result, index) => (
                <View key={index} style={styles.questionResultItem}>
                  <View style={styles.questionResultHeader}>
                    <Text style={styles.questionResultTitle}>Pregunta {index + 1}</Text>
                    <View style={styles.questionResultScoreContainer}>
                      <Text style={[styles.questionResultScore, { color: result.isCorrect ? "#4CAF50" : "#F44336" }]}>
                        {result.isCorrect ? "✓ Correcta" : "✗ Incorrecta"}
                      </Text>
                      <Text style={styles.questionResultAiScore}>Score: {result.aiScore}</Text>
                    </View>
                  </View>

                  <View style={styles.questionResultDetails}>
                    <Text style={styles.questionResultLabel}>Tiempo: </Text>
                    <Text style={styles.questionResultValue}>{formatTime(result.responseTime / 1000)}</Text>
                  </View>

                  {result.feedback && (
                    <View style={styles.feedbackContainer}>
                      <Text style={styles.feedbackLabel}>Feedback:</Text>
                      <Text style={styles.feedbackText}>{result.feedback}</Text>
                    </View>
                  )}
                </View>
              ))}
            </View>
          )}

          {/* Botones de acción */}
          <View style={styles.buttonContainer}>
            {finalQuestionResults && finalQuestionResults.length > 0 && (
              <TouchableOpacity style={[styles.button, styles.detailsButton]} onPress={handleViewDetails}>
                <Text style={styles.buttonText}>{showDetails ? "🔍 Ocultar Detalles" : "📊 Ver Detalles"}</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity style={[styles.button, styles.retryButton]} onPress={handleRetry}>
              <Text style={styles.buttonText}>🔄 Intentar de Nuevo</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.button, styles.homeButton]} onPress={handleGoToDashboard}>
              <Text style={styles.buttonText}>🏠 Ir al Dashboard</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  scrollContainer: {
    flex: 1,
  },
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    paddingBottom: 40,
  },
  content: {
    width: "100%",
    alignItems: "center",
  },
  characterContainer: {
    marginTop: 20,
    marginBottom: 20,
  },
  characterImage: {
    width: width * 0.3,
    height: width * 0.3,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 30,
    color: "#FFF",
    textAlign: "center",
    textShadowColor: "rgba(0, 0, 0, 0.5)",
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
  },
  resultContainer: {
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    borderRadius: 20,
    padding: 25,
    width: "100%",
    alignItems: "center",
    marginBottom: 30,
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.05)",
  },
  mainScoreContainer: {
    alignItems: "center",
    marginBottom: 25,
  },
  percentageText: {
    fontSize: 48,
    fontWeight: "bold",
    marginBottom: 10,
  },
  messageText: {
    fontSize: 20,
    color: "#333",
    textAlign: "center",
    fontWeight: "600",
  },
  answersStatsContainer: {
    backgroundColor: "#F8F9FA",
    borderRadius: 12,
    padding: 15,
    marginBottom: 20,
    width: "100%",
  },
  answersStatsTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 15,
    textAlign: "center",
  },
  answersStatsGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    flexWrap: "wrap",
  },
  answerStatItem: {
    width: "22%",
    alignItems: "center",
    marginBottom: 10,
  },
  answerStatIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  answerStatIconText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
  answerStatLabel: {
    fontSize: 12,
    color: "#666",
    marginBottom: 4,
    textAlign: "center",
  },
  answerStatValue: {
    fontSize: 16,
    fontWeight: "bold",
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "100%",
    marginBottom: 20,
    paddingVertical: 15,
    backgroundColor: "#F8F9FA",
    borderRadius: 12,
  },
  statItem: {
    alignItems: "center",
    flex: 1,
  },
  statLabel: {
    fontSize: 12,
    color: "#666",
    marginBottom: 5,
    fontWeight: "500",
  },
  statValue: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  timeStatsContainer: {
    backgroundColor: "#F0F8FF",
    borderRadius: 12,
    padding: 15,
    marginBottom: 20,
    width: "100%",
  },
  timeStatsTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#0277BD",
    marginBottom: 12,
    textAlign: "center",
  },
  timeStatsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  timeStatItem: {
    width: "48%",
    backgroundColor: "#E1F5FE",
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
    alignItems: "center",
  },
  timeStatLabel: {
    fontSize: 12,
    color: "#01579B",
    marginBottom: 4,
    textAlign: "center",
  },
  timeStatValue: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#0288D1",
  },
  aiInfoContainer: {
    backgroundColor: "#E3F2FD",
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    width: "100%",
    alignItems: "center",
  },
  aiInfoText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1976D2",
    marginBottom: 5,
  },
  aiInfoSubtext: {
    fontSize: 12,
    color: "#1565C0",
    textAlign: "center",
  },
  characterInfoContainer: {
    backgroundColor: "#F3E5F5",
    borderRadius: 8,
    padding: 10,
    width: "100%",
    alignItems: "center",
  },
  characterInfoText: {
    fontSize: 14,
    color: "#7B1FA2",
    fontWeight: "500",
  },
  detailedResultsContainer: {
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    borderRadius: 20,
    padding: 20,
    width: "100%",
    marginBottom: 30,
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  detailedResultsTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 15,
    textAlign: "center",
  },
  questionResultItem: {
    backgroundColor: "#F5F5F5",
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
  },
  questionResultHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
    paddingBottom: 8,
  },
  questionResultTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  questionResultScoreContainer: {
    alignItems: "flex-end",
  },
  questionResultScore: {
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 2,
  },
  questionResultAiScore: {
    fontSize: 12,
    color: "#666",
  },
  questionResultDetails: {
    flexDirection: "row",
    marginBottom: 8,
  },
  questionResultLabel: {
    fontSize: 14,
    color: "#666",
    fontWeight: "500",
  },
  questionResultValue: {
    fontSize: 14,
    color: "#333",
  },
  feedbackContainer: {
    backgroundColor: "#FFFDE7",
    borderRadius: 8,
    padding: 10,
    marginTop: 5,
  },
  feedbackLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "#5D4037",
    marginBottom: 5,
  },
  feedbackText: {
    fontSize: 13,
    color: "#5D4037",
    fontStyle: "italic",
  },
  buttonContainer: {
    width: "100%",
    alignItems: "center",
  },
  button: {
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 25,
    marginBottom: 12,
    width: "85%",
    alignItems: "center",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    flexDirection: "row",
    justifyContent: "center",
  },
  detailsButton: {
    backgroundColor: "#9C27B0",
  },
  retryButton: {
    backgroundColor: "#4CAF50",
  },
  homeButton: {
    backgroundColor: "#2196F3",
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
    marginLeft: 8,
  },
})

export default ResultsScreen
