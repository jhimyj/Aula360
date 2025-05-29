"use client"
import { View, Text, StyleSheet, TouchableOpacity, Animated, Dimensions, ScrollView, useWindowDimensions } from "react-native"
import { useState, useEffect } from "react"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { removeSavedCharacterImage } from "../../screens/ComponentesHero/saveCharacterImage"

type CharacterName = "Qhapaq" | "Amaru" | "Killa"

const characterCelebrationImages: Record<CharacterName, any> = {
  Qhapaq: require("../../assets/images/chaman.png"),
  Amaru: require("../../assets/Personajes/Amaru1.png"),
  Killa: require("../../assets/Personajes/Guerrera.png"),
}

const ResultsScreen = ({ route, navigation }) => {
  // Obtener los parámetros de la ruta
  const { score, totalMissions } = route.params || { score: 0, totalMissions: 0 }
  
  // Use window dimensions for responsive layout
  const { width, height } = useWindowDimensions()
  const isTablet = width >= 768 // Common breakpoint for tablets
  
  const [characterName, setCharacterName] = useState<CharacterName>("Qhapaq")
  const [fadeAnim] = useState(new Animated.Value(0))
  const [scaleAnim] = useState(new Animated.Value(0.8))

  // 🔍 DEPURACIÓN: Mostrar valores recibidos
  console.log("🔍 VALORES RECIBIDOS EN RESULTS SCREEN:")
  console.log("- score:", score)
  console.log("- totalMissions:", totalMissions)
  console.log("- Dispositivo:", isTablet ? "Tablet" : "Teléfono")

  // 🛠️ CORREGIR CÁLCULOS: Asegurarse de que el score no sea mayor que el total de preguntas
  // Si score > totalMissions, probablemente sea un score de IA y no un contador de respuestas correctas
  const correctAnswers = score > totalMissions ? Math.min(totalMissions, Math.round(score / 100)) : score
  const percentage = totalMissions > 0 ? Math.min(100, Math.round((correctAnswers / totalMissions) * 100)) : 0
  const incorrectAnswers = totalMissions - correctAnswers

  // 🔍 DEPURACIÓN: Mostrar valores calculados
  console.log("📊 VALORES CALCULADOS:")
  console.log("- correctAnswers:", correctAnswers)
  console.log("- percentage:", percentage)
  console.log("- incorrectAnswers:", incorrectAnswers)

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
    ]).start()
  }, [])

  // Determinar el mensaje según el porcentaje
  const getMessage = () => {
    if (percentage >= 90) return "¡Rendimiento Excepcional!"
    if (percentage >= 80) return "¡Excelente trabajo!"
    if (percentage >= 70) return "¡Muy buen trabajo!"
    if (percentage >= 60) return "¡Buen trabajo!"
    if (percentage >= 50) return "¡Puedes mejorar!"
    if (percentage >= 30) return "¡Sigue practicando!"
    return "¡No te rindas, inténtalo de nuevo!"
  }

  // Determinar el color según el rendimiento
  const getPerformanceColor = () => {
    if (percentage >= 80) return "#4CAF50" // Verde
    if (percentage >= 60) return "#FF9800" // Naranja
    if (percentage >= 40) return "#FFC107" // Amarillo
    return "#F44336" // Rojo
  }

  // Determinar el emoji según el rendimiento
  const getPerformanceEmoji = () => {
    if (percentage >= 90) return "🏆"
    if (percentage >= 80) return "🌟"
    if (percentage >= 70) return "👏"
    if (percentage >= 60) return "👍"
    if (percentage >= 50) return "💪"
    return "🎯"
  }

  // Obtener color de fondo según personaje
  const getBackgroundColor = () => {
    switch (characterName) {
      case "Qhapaq":
        return "#8B4513" // Marrón tierra
      case "Amaru":
        return "#2E8B57" // Verde serpiente
      case "Killa":
        return "#4B0082" // Púrpura lunar
      default:
        return "#8B4513"
    }
  }

  const handleLogout = () => {
    removeSavedCharacterImage()
    navigation.navigate("StudentDashboard")
  }

  const handleRetry = () => {
    navigation.navigate("Quiz")
  }
  console.log("📌 Rutas disponibles:", navigation.getState().routeNames)

  // 🎮 Renderizar desglose de preguntas
  const renderQuestionBreakdown = () => {
    // Crear un array con el estado de cada pregunta (correcta o incorrecta)
    // Esto es una simulación - en una implementación real, necesitarías los datos reales
    const questionResults = Array(totalMissions)
      .fill(0)
      .map((_, index) => index < correctAnswers)

    // Calcular el número de columnas basado en el ancho del dispositivo
    const numColumns = isTablet ? 10 : 5

    // Agrupar los resultados en filas para una mejor visualización
    const rows = []
    for (let i = 0; i < questionResults.length; i += numColumns) {
      rows.push(questionResults.slice(i, i + numColumns))
    }

    return (
      <View style={styles.questionBreakdownContainer}>
        <Text style={styles.questionBreakdownTitle}>Desglose de Preguntas</Text>
        {rows.map((row, rowIndex) => (
          <View key={rowIndex} style={styles.questionIconsRow}>
            {row.map((isCorrect, colIndex) => {
              const questionIndex = rowIndex * numColumns + colIndex
              return (
                <View key={colIndex} style={styles.questionIconWrapper}>
                  <View
                    style={[
                      styles.questionIcon,
                      {
                        backgroundColor: isCorrect ? "#4CAF50" : "#F44336",
                        width: isTablet ? 40 : 32,
                        height: isTablet ? 40 : 32,
                        borderRadius: isTablet ? 20 : 16,
                      },
                    ]}
                  >
                    <Text style={[styles.questionIconText, { fontSize: isTablet ? 16 : 14 }]}>
                      {questionIndex + 1}
                    </Text>
                  </View>
                  <Text style={styles.questionIconStatus}>{isCorrect ? "✓" : "✗"}</Text>
                </View>
              )
            })}
          </View>
        ))}
      </View>
    )
  }

  return (
    <View style={[styles.container, { backgroundColor: getBackgroundColor() }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { 
            paddingHorizontal: isTablet ? 40 : 20,
            minHeight: height 
          }
        ]}
        showsVerticalScrollIndicator={false}
        bounces={true}
      >
        <Animated.View 
          style={[
            styles.content, 
            { 
              opacity: fadeAnim, 
              transform: [{ scale: scaleAnim }],
              maxWidth: isTablet ? 600 : 400,
            }
          ]}
        >
          {/* Título con emoji - Más compacto */}
          <Text style={[styles.title, { fontSize: isTablet ? 28 : 24 }]}>
            {getPerformanceEmoji()} Resultados {getPerformanceEmoji()}
          </Text>

          {/* Contenedor principal de resultados */}
          <View style={[styles.resultContainer, { padding: isTablet ? 25 : 20 }]}>
            {/* Puntuación principal */}
            <View style={styles.mainScoreContainer}>
              <Text 
                style={[
                  styles.percentageText, 
                  { 
                    color: getPerformanceColor(),
                    fontSize: isTablet ? 52 : 42 
                  }
                ]}
              >
                {percentage}%
              </Text>
              <Text style={[styles.messageText, { fontSize: isTablet ? 22 : 18 }]}>
                {getMessage()}
              </Text>
            </View>

            {/* Estadísticas detalladas */}
            <View style={[styles.statsContainer, { paddingVertical: isTablet ? 15 : 12 }]}>
              <View style={styles.statItem}>
                <Text style={[styles.statLabel, { fontSize: isTablet ? 14 : 12 }]}>Total</Text>
                <Text style={[styles.statValue, { fontSize: isTablet ? 26 : 22 }]}>{totalMissions}</Text>
                <Text style={[styles.statSubtext, { fontSize: isTablet ? 12 : 10 }]}>preguntas</Text>
              </View>

              <View style={styles.statItem}>
                <Text style={[styles.statLabel, { fontSize: isTablet ? 14 : 12 }]}>Correctas</Text>
                <Text 
                  style={[
                    styles.statValue, 
                    { 
                      color: "#4CAF50",
                      fontSize: isTablet ? 26 : 22 
                    }
                  ]}
                >
                  {correctAnswers}
                </Text>
                <Text style={[styles.statSubtext, { fontSize: isTablet ? 12 : 10 }]}>respuestas</Text>
              </View>

              <View style={styles.statItem}>
                <Text style={[styles.statLabel, { fontSize: isTablet ? 14 : 12 }]}>Incorrectas</Text>
                <Text 
                  style={[
                    styles.statValue, 
                    { 
                      color: "#F44336",
                      fontSize: isTablet ? 26 : 22 
                    }
                  ]}
                >
                  {incorrectAnswers}
                </Text>
                <Text style={[styles.statSubtext, { fontSize: isTablet ? 12 : 10 }]}>respuestas</Text>
              </View>
            </View>

            {/* Barra de progreso visual */}
            <View style={styles.progressContainer}>
              <Text style={[styles.progressLabel, { fontSize: isTablet ? 16 : 14 }]}>Progreso</Text>
              <View style={[styles.progressBarBackground, { height: isTablet ? 12 : 10 }]}>
                <View
                  style={[
                    styles.progressBarFill,
                    {
                      width: `${percentage}%`,
                      backgroundColor: getPerformanceColor(),
                      borderRadius: isTablet ? 6 : 5,
                    },
                  ]}
                />
              </View>
              <Text style={[styles.progressText, { fontSize: isTablet ? 14 : 12 }]}>
                {correctAnswers} de {totalMissions} correctas
              </Text>
            </View>

            {/* 🆕 Desglose visual de preguntas */}
            {renderQuestionBreakdown()}

            {/* Información del personaje */}
            <View style={[styles.characterInfoContainer, { padding: isTablet ? 15 : 12 }]}>
              <Text style={[styles.characterInfoText, { fontSize: isTablet ? 18 : 15 }]}>
                🎮 Aventura completada con {characterName}
              </Text>
              <Text style={[styles.characterInfoSubtext, { fontSize: isTablet ? 14 : 11 }]}>
                ¡Has demostrado tus conocimientos!
              </Text>
            </View>
          </View>

          {/* Botones de acción */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity 
              style={[
                styles.button, 
                styles.retryButton,
                { 
                  paddingVertical: isTablet ? 15 : 12,
                  paddingHorizontal: isTablet ? 35 : 25,
                  width: isTablet ? "70%" : "85%",
                }
              ]} 
              onPress={handleRetry}
            >
              <Text style={[styles.buttonText, { fontSize: isTablet ? 18 : 15 }]}>
                🔄 Intentar de Nuevo
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[
                styles.button, 
                styles.homeButton,
                { 
                  paddingVertical: isTablet ? 15 : 12,
                  paddingHorizontal: isTablet ? 35 : 25,
                  width: isTablet ? "70%" : "85%",
                }
              ]} 
              onPress={handleLogout}
            >
              <Text style={[styles.buttonText, { fontSize: isTablet ? 18 : 15 }]}>
                🏠 Volver al Inicio
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 20,
  },
  content: {
    width: "100%",
    alignItems: "center",
  },
  title: {
    fontWeight: "bold",
    marginBottom: 20,
    color: "#FFF",
    textAlign: "center",
    textShadowColor: "rgba(0, 0, 0, 0.5)",
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
  },
  resultContainer: {
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    borderRadius: 20,
    width: "100%",
    alignItems: "center",
    marginBottom: 20,
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  mainScoreContainer: {
    alignItems: "center",
    marginBottom: 20,
  },
  percentageText: {
    fontWeight: "bold",
    marginBottom: 8,
  },
  messageText: {
    color: "#333",
    textAlign: "center",
    fontWeight: "600",
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "100%",
    marginBottom: 20,
    backgroundColor: "#F8F9FA",
    borderRadius: 12,
  },
  statItem: {
    alignItems: "center",
    flex: 1,
  },
  statLabel: {
    color: "#666",
    marginBottom: 4,
    fontWeight: "500",
  },
  statValue: {
    fontWeight: "bold",
    color: "#333",
  },
  statSubtext: {
    color: "#999",
    marginTop: 2,
  },
  progressContainer: {
    width: "100%",
    marginBottom: 16,
  },
  progressLabel: {
    fontWeight: "600",
    color: "#333",
    marginBottom: 6,
    textAlign: "center",
  },
  progressBarBackground: {
    width: "100%",
    backgroundColor: "#E0E0E0",
    borderRadius: 5,
    overflow: "hidden",
    marginBottom: 6,
  },
  progressBarFill: {
    height: "100%",
    minWidth: "2%", // Mínimo visible
  },
  progressText: {
    color: "#666",
    textAlign: "center",
  },
  questionBreakdownContainer: {
    width: "100%",
    marginBottom: 16,
    backgroundColor: "#F5F5F5",
    borderRadius: 12,
    padding: 12,
  },
  questionBreakdownTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 10,
    textAlign: "center",
  },
  questionIconsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 8,
  },
  questionIconsRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 8,
  },
  questionIconWrapper: {
    alignItems: "center",
    marginHorizontal: 4,
  },
  questionIcon: {
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 3,
  },
  questionIconText: {
    color: "white",
    fontWeight: "bold",
  },
  questionIconStatus: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#333",
  },
  characterInfoContainer: {
    backgroundColor: "#F3E5F5",
    borderRadius: 12,
    width: "100%",
    alignItems: "center",
  },
  characterInfoText: {
    color: "#7B1FA2",
    fontWeight: "600",
    marginBottom: 3,
  },
  characterInfoSubtext: {
    color: "#9C27B0",
    fontStyle: "italic",
  },
  buttonContainer: {
    width: "100%",
    alignItems: "center",
    paddingBottom: 20,
  },
  button: {
    borderRadius: 25,
    marginBottom: 10,
    alignItems: "center",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  retryButton: {
    backgroundColor: "#4CAF50",
  },
  homeButton: {
    backgroundColor: "#2196F3",
  },
  buttonText: {
    color: "white",
    fontWeight: "bold",
  },
})

export default ResultsScreen