"use client"
import { View, Text, StyleSheet, TouchableOpacity, Image, Animated, Dimensions } from "react-native"
import { useState, useEffect } from "react"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { removeSavedCharacterImage } from "../../screens/ComponentesHero/saveCharacterImage"

type CharacterName = "Qhapaq" | "Amaru" | "Killa"

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
  const { score, totalMissions, aiScores, detailedResults } = route.params || {
    score: 0,
    totalMissions: 0,
    aiScores: [],
    detailedResults: [],
  }

  const [characterName, setCharacterName] = useState<CharacterName>("Qhapaq")
  const [fadeAnim] = useState(new Animated.Value(0))
  const [scaleAnim] = useState(new Animated.Value(0.8))
  const [bounceAnim] = useState(new Animated.Value(0))

  // Cargar información del personaje
  useEffect(() => {
    const loadCharacterInfo = async () => {
      try {
        const savedCharacter = await AsyncStorage.getItem("selectedCharacterName")
        if (savedCharacter) {
          setCharacterName(savedCharacter as CharacterName)
        }
      } catch (error) {
        console.error("Error cargando personaje:", error)
      }
    }
    loadCharacterInfo()
  }, [])

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
    if (aiScores && aiScores.length > 0) {
      const totalAIScore = aiScores.reduce((sum, score) => sum + score, 0)
      const averageAIScore = totalAIScore / aiScores.length
      const maxPossibleScore = aiScores.length * 200 // Asumiendo 200 como score máximo por pregunta
      const percentage = Math.round((totalAIScore / maxPossibleScore) * 100)

      return {
        totalScore: totalAIScore,
        averageScore: Math.round(averageAIScore),
        percentage: percentage,
        questionsAnswered: aiScores.length,
        isAIScored: true,
      }
    } else {
      // Fallback al sistema tradicional
      const percentage = totalMissions > 0 ? Math.round((score / totalMissions) * 100) : 0
      return {
        totalScore: score,
        averageScore: totalMissions > 0 ? Math.round((score / totalMissions) * 100) : 0,
        percentage: percentage,
        questionsAnswered: totalMissions,
        isAIScored: false,
      }
    }
  }

  const stats = calculateStats()

  // Determinar el mensaje según el rendimiento
  const getMessage = () => {
    if (stats.percentage >= 90) return "¡Rendimiento Excepcional!"
    if (stats.percentage >= 80) return "¡Excelente trabao!"
    if (stats.percentage >= 70) return "¡Muy buen trabajo!"
    if (stats.percentage >= 60) return "¡Buen trabajo!"
    if (stats.percentage >= 50) return "¡Puedes mejorar!"
    if (stats.percentage >= 30) return "¡Sigue practicando!"
    return "¡No te rindas, inténtalo de nuevo!"
  }

  // Determinar el color según el rendimiento
  const getPerformanceColor = () => {
    if (stats.percentage >= 80) return "#4CAF50" // Verde
    if (stats.percentage >= 60) return "#FF9800" // Naranja
    if (stats.percentage >= 40) return "#FFC107" // Amarillo
    return "#F44336" // Rojo
  }

  // Determinar el emoji según el rendimiento
  const getPerformanceEmoji = () => {
    if (stats.percentage >= 90) return "🏆"
    if (stats.percentage >= 80) return "🌟"
    if (stats.percentage >= 70) return "👏"
    if (stats.percentage >= 60) return "👍"
    if (stats.percentage >= 50) return "💪"
    return "🎯"
  }

  const handleLogout = () => {
    removeSavedCharacterImage()
    navigation.navigate("StudentDashboard")
  }

  const handleRetry = () => {
    navigation.navigate("Quiz")
  }

  const handleViewDetails = () => {
    // Mostrar detalles de las respuestas si están disponibles
    if (detailedResults && detailedResults.length > 0) {
      // Aquí podrías navegar a una pantalla de detalles
      console.log("Detalles de resultados:", detailedResults)
    }
  }

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: characterName === "Qhapaq" ? "#8B4513" : characterName === "Amaru" ? "#2E8B57" : "#4B0082" },
      ]}
    >
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
            <Text style={[styles.percentageText, { color: getPerformanceColor() }]}>{stats.percentage}%</Text>
            <Text style={styles.messageText}>{getMessage()}</Text>
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

        {/* Botones de acción */}
        <View style={styles.buttonContainer}>
          {detailedResults && detailedResults.length > 0 && (
            <TouchableOpacity style={[styles.button, styles.detailsButton]} onPress={handleViewDetails}>
              <Text style={styles.buttonText}>📊 Ver Detalles</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity style={[styles.button, styles.retryButton]} onPress={handleRetry}>
            <Text style={styles.buttonText}>🔄 Intentar de Nuevo</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.button, styles.homeButton]} onPress={handleLogout}>
            <Text style={styles.buttonText}>🏠 Volver al Inicio</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  content: {
    width: "100%",
    alignItems: "center",
  },
  characterContainer: {
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
  },
})

export default ResultsScreen
