"use client"
import { View, Text, StyleSheet, TouchableOpacity } from "react-native"

const ResultsScreen = ({ route, navigation }) => {
  // Obtener los parámetros de la ruta
  const { score, totalMissions } = route.params || { score: 0, totalMissions: 0 }

  // Calcular el porcentaje de aciertos
  const percentage = Math.round((score / totalMissions) * 100)

  // Determinar el mensaje según el porcentaje
  const getMessage = () => {
    if (percentage >= 80) return "¡Excelente trabajo!"
    if (percentage >= 60) return "¡Buen trabajo!"
    if (percentage >= 40) return "¡Puedes mejorar!"
    return "¡Sigue intentando!"
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Resultados</Text>

      <View style={styles.resultContainer}>
        <Text style={styles.scoreText}>
          Puntuación: {score}/{totalMissions}
        </Text>
        <Text style={styles.percentageText}>{percentage}%</Text>
        <Text style={styles.messageText}>{getMessage()}</Text>
      </View>

      <TouchableOpacity style={styles.button} onPress={() => navigation.navigate("Home")}>
        <Text style={styles.buttonText}>Volver al Inicio</Text>
      </TouchableOpacity>

      <TouchableOpacity style={[styles.button, styles.retryButton]} onPress={() => navigation.navigate("Quiz")}>
        <Text style={styles.buttonText}>Intentar de Nuevo</Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
    backgroundColor: "#f5f5f5",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 30,
    color: "#333",
  },
  resultContainer: {
    backgroundColor: "white",
    borderRadius: 15,
    padding: 20,
    width: "100%",
    alignItems: "center",
    marginBottom: 30,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  scoreText: {
    fontSize: 22,
    marginBottom: 10,
    color: "#333",
  },
  percentageText: {
    fontSize: 40,
    fontWeight: "bold",
    color: "#4CAF50",
    marginBottom: 15,
  },
  messageText: {
    fontSize: 18,
    color: "#555",
    textAlign: "center",
  },
  button: {
    backgroundColor: "#2196F3",
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 25,
    marginBottom: 15,
    width: "80%",
    alignItems: "center",
  },
  retryButton: {
    backgroundColor: "#4CAF50",
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
})

export default ResultsScreen
