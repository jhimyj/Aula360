"use client"

import type React from "react"
import { useState, useEffect } from "react"
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
  StatusBar,
} from "react-native"
import { useNavigation, useRoute } from "@react-navigation/native"
import { Ionicons } from "@expo/vector-icons"
import AsyncStorage from "@react-native-async-storage/async-storage"

interface RouteParams {
  roomId: string
  studentId: string
  studentName: string
}

interface QuestionData {
  difficulty: string
  room_id: string
  score: number
  text: string
  id: string
  type: string
  config: {
    options?: string[]
  }
  tags?: string[]
  created_at: string
  updated_at: string
}

interface ResponseData {
  updated_at: string
  created_at: string
  response_ia: {
    feedback: string
    score: number
  }
  response_student: string[]
  question_id: string
  room_id_student_id: string
  question_data: QuestionData
}

interface ResponsesResponse {
  success: boolean
  code: string
  message: string
  data: ResponseData[]
  request_id: string
}

const StudentResponsesScreen: React.FC = () => {
  const navigation = useNavigation()
  const route = useRoute()
  const { roomId, studentId, studentName } = route.params as RouteParams

  const [responses, setResponses] = useState<ResponseData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchResponses()
  }, [])

  const fetchResponses = async () => {
    try {
      setLoading(true)
      setError(null)

      const token = await AsyncStorage.getItem("userToken")
      if (!token) {
        throw new Error("No se encontró el token de autenticación")
      }

      const url = `https://6axx5kevpc.execute-api.us-east-1.amazonaws.com/dev/responses/rooms/${roomId}/students/${studentId}`
      console.log("📡 Obteniendo respuestas:", url)

      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`)
      }

      const data: ResponsesResponse = await response.json()
      console.log("✅ Respuestas obtenidas:", data)

      if (data.success && data.data) {
        setResponses(data.data)
      } else {
        throw new Error(data.message || "Error al obtener respuestas")
      }
    } catch (error: any) {
      console.error("❌ Error obteniendo respuestas:", error)
      setError(error.message)
      Alert.alert("Error", `No se pudieron cargar las respuestas: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty.toUpperCase()) {
      case "EASY":
        return "#4CAF50"
      case "MEDIUM":
        return "#FF9800"
      case "HARD":
        return "#F44336"
      default:
        return "#9E9E9E"
    }
  }

  const getDifficultyText = (difficulty: string) => {
    switch (difficulty.toUpperCase()) {
      case "EASY":
        return "Fácil"
      case "MEDIUM":
        return "Media"
      case "HARD":
        return "Difícil"
      default:
        return difficulty
    }
  }

  const getScoreColor = (score: number, maxScore: number) => {
    const percentage = (score / maxScore) * 100
    if (percentage >= 80) return "#4CAF50"
    if (percentage >= 60) return "#8BC34A"
    if (percentage >= 40) return "#FFC107"
    if (percentage >= 20) return "#FF9800"
    return "#F44336"
  }

  const getQuestionTypeText = (type: string) => {
    switch (type) {
      case "MULTIPLE_CHOICE_SINGLE":
        return "Opción única"
      case "MULTIPLE_CHOICE_MULTIPLE":
        return "Opción múltiple"
      case "OPEN_ENDED":
        return "Respuesta abierta"
      default:
        return type
    }
  }

  const renderResponseItem = ({ item, index }: { item: ResponseData; index: number }) => {
    const { question_data, response_student, response_ia } = item
    const scorePercentage = Math.round((response_ia.score / question_data.score) * 100)
    const scoreColor = getScoreColor(response_ia.score, question_data.score)

    return (
      <View style={styles.responseContainer}>
        {/* Pregunta */}
        <View style={styles.questionContainer}>
          <View style={styles.questionHeader}>
            <View style={[styles.difficultyBadge, { backgroundColor: getDifficultyColor(question_data.difficulty) }]}>
              <Text style={styles.difficultyText}>{getDifficultyText(question_data.difficulty)}</Text>
            </View>
            <Text style={styles.questionType}>{getQuestionTypeText(question_data.type)}</Text>
            <Text style={styles.questionScore}>{question_data.score} pts</Text>
          </View>

          <Text style={styles.questionText}>{question_data.text}</Text>

          {question_data.config.options && (
            <View style={styles.optionsContainer}>
              {question_data.config.options.map((option, optionIndex) => (
                <View
                  key={optionIndex}
                  style={[styles.optionItem, response_student.includes(option) && styles.selectedOptionItem]}
                >
                  <Text style={[styles.optionText, response_student.includes(option) && styles.selectedOptionText]}>
                    {String.fromCharCode(65 + optionIndex)}. {option}
                  </Text>
                </View>
              ))}
            </View>
          )}

          {question_data.tags && question_data.tags.length > 0 && (
            <View style={styles.tagsContainer}>
              {question_data.tags.map((tag, tagIndex) => (
                <View key={tagIndex} style={styles.tagBadge}>
                  <Text style={styles.tagText}>{tag}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Respuesta del estudiante */}
        <View style={styles.studentResponseContainer}>
          <View style={styles.studentResponseHeader}>
            <View style={styles.studentAvatar}>
              <Text style={styles.studentAvatarText}>{studentName.charAt(0).toUpperCase()}</Text>
            </View>
            <View style={styles.studentResponseInfo}>
              <Text style={styles.studentResponseName}>{studentName}</Text>
              <Text style={styles.studentResponseTime}>{formatDate(item.created_at)}</Text>
            </View>
          </View>

          <View style={styles.studentResponseContent}>
            {response_student.map((resp, respIndex) => (
              <Text key={respIndex} style={styles.studentResponseText}>
                {resp}
              </Text>
            ))}
          </View>
        </View>

        {/* Feedback de la IA */}
        <View style={styles.iaFeedbackContainer}>
          <View style={styles.iaFeedbackHeader}>
            <View style={styles.iaAvatar}>
              <Ionicons name="school" size={20} color="#FFFFFF" />
            </View>
            <View style={styles.iaFeedbackInfo}>
              <Text style={styles.iaFeedbackTitle}>Feedback del Profesor IA</Text>
              <View style={styles.scoreContainer}>
                <View style={[styles.scoreBar, { backgroundColor: "#E0E0E0" }]}>
                  <View style={[styles.scoreBarFill, { width: `${scorePercentage}%`, backgroundColor: scoreColor }]} />
                </View>
                <Text style={[styles.scoreText, { color: scoreColor }]}>
                  {response_ia.score} / {question_data.score} pts ({scorePercentage}%)
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.iaFeedbackContent}>
            <Text style={styles.iaFeedbackText}>{response_ia.feedback}</Text>
          </View>
        </View>
      </View>
    )
  }

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="chatbubbles-outline" size={64} color="#CCCCCC" />
      <Text style={styles.emptyStateTitle}>No hay respuestas</Text>
      <Text style={styles.emptyStateText}>Este estudiante aún no ha respondido ninguna pregunta.</Text>
    </View>
  )

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8F9FA" />

      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Respuestas de {studentName}</Text>
          <Text style={styles.headerSubtitle}>{responses.length} respuesta(s)</Text>
        </View>
        <TouchableOpacity style={styles.refreshButton} onPress={fetchResponses}>
          <Ionicons name="refresh" size={24} color="#4361EE" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4361EE" />
          <Text style={styles.loadingText}>Cargando respuestas...</Text>
        </View>
      ) : (
        <FlatList
          data={responses}
          renderItem={renderResponseItem}
          keyExtractor={(item) => item.question_id}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={renderEmptyState}
        />
      )}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FA",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5E5",
  },
  backButton: {
    padding: 8,
  },
  headerContent: {
    flex: 1,
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
  },
  headerSubtitle: {
    fontSize: 14,
    color: "#666",
    marginTop: 2,
  },
  refreshButton: {
    padding: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#666",
  },
  listContainer: {
    padding: 16,
  },
  responseContainer: {
    marginBottom: 24,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  questionContainer: {
    padding: 16,
    backgroundColor: "#F0F4FF",
    borderBottomWidth: 1,
    borderBottomColor: "#E3E8FF",
  },
  questionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  difficultyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
  },
  difficultyText: {
    fontSize: 12,
    fontWeight: "500",
    color: "#FFFFFF",
  },
  questionType: {
    fontSize: 12,
    color: "#4361EE",
    backgroundColor: "#E3E8FF",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
  },
  questionScore: {
    fontSize: 12,
    fontWeight: "600",
    color: "#333",
    marginLeft: "auto",
  },
  questionText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#333",
    marginBottom: 12,
    lineHeight: 22,
  },
  optionsContainer: {
    marginTop: 8,
  },
  optionItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  selectedOptionItem: {
    backgroundColor: "#E3F2FD",
    borderColor: "#2196F3",
  },
  optionText: {
    fontSize: 14,
    color: "#333",
  },
  selectedOptionText: {
    fontWeight: "500",
    color: "#2196F3",
  },
  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 12,
  },
  tagBadge: {
    backgroundColor: "#E3E8FF",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
    marginBottom: 8,
  },
  tagText: {
    fontSize: 12,
    color: "#4361EE",
  },
  studentResponseContainer: {
    padding: 16,
    backgroundColor: "#FFFFFF",
  },
  studentResponseHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  studentAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#4361EE",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  studentAvatarText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  studentResponseInfo: {
    flex: 1,
  },
  studentResponseName: {
    fontSize: 16,
    fontWeight: "500",
    color: "#333",
  },
  studentResponseTime: {
    fontSize: 12,
    color: "#999",
    marginTop: 2,
  },
  studentResponseContent: {
    backgroundColor: "#F0F4FF",
    borderRadius: 12,
    padding: 12,
  },
  studentResponseText: {
    fontSize: 14,
    color: "#333",
    lineHeight: 20,
  },
  iaFeedbackContainer: {
    padding: 16,
    backgroundColor: "#FAFAFA",
    borderTopWidth: 1,
    borderTopColor: "#E0E0E0",
  },
  iaFeedbackHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  iaAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#4CAF50",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  iaFeedbackInfo: {
    flex: 1,
  },
  iaFeedbackTitle: {
    fontSize: 16,
    fontWeight: "500",
    color: "#333",
    marginBottom: 4,
  },
  scoreContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  scoreBar: {
    height: 8,
    borderRadius: 4,
    width: 100,
    marginRight: 8,
    overflow: "hidden",
  },
  scoreBarFill: {
    height: "100%",
    borderRadius: 4,
  },
  scoreText: {
    fontSize: 12,
    fontWeight: "500",
  },
  iaFeedbackContent: {
    backgroundColor: "#F5F5F5",
    borderRadius: 12,
    padding: 12,
  },
  iaFeedbackText: {
    fontSize: 14,
    color: "#333",
    lineHeight: 20,
    fontStyle: "italic",
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    lineHeight: 20,
  },
})

export default StudentResponsesScreen
