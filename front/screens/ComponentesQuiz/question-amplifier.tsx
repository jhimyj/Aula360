"use client"

import type React from "react"
import { useState } from "react"
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  ScrollView,
  StyleSheet,
  Dimensions,
  StatusBar,
  SafeAreaView,
} from "react-native"
import { Ionicons } from "@expo/vector-icons"

const { width: screenWidth, height: screenHeight } = Dimensions.get("window")

type QuestionType = "MULTIPLE_CHOICE_SINGLE" | "MULTIPLE_CHOICE_MULTIPLE" | "OPEN_ENDED"

type Question = {
  id: string
  text: string
  questionType: QuestionType
  options?: { id: string; text: string; isCorrect: boolean }[]
  difficulty?: "EASY" | "MEDIUM" | "HARD"
  tags?: string[]
  score?: number
  missionNumber: number
  amplifier: {
    enabled: boolean
    threshold: number
    modalTitle: string
    modalDescription: string
  }
}

interface QuestionAmplifierProps {
  question: Question
  isVisible: boolean
}

const QuestionAmplifier: React.FC<QuestionAmplifierProps> = ({ question, isVisible }) => {
  const [modalVisible, setModalVisible] = useState(false)

  if (!isVisible || !question.amplifier.enabled) {
    return null
  }

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

  const getTypeIcon = (type: QuestionType) => {
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

  const getTypeLabel = (type: QuestionType) => {
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

  return (
    <>
      {/* Botón flotante */}
      <TouchableOpacity style={styles.floatingButton} onPress={() => setModalVisible(true)} activeOpacity={0.8}>
        <Ionicons name="search" size={24} color="white" />
      </TouchableOpacity>

      {/* Modal amplificador */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
        statusBarTranslucent={true}
      >
        <View style={styles.modalOverlay}>
          <StatusBar backgroundColor="rgba(0,0,0,0.7)" barStyle="light-content" />
          <SafeAreaView style={styles.modalContainer}>
            <View style={styles.modalContent}>
              {/* Header del modal */}
              <View style={styles.modalHeader}>
                <View style={styles.headerTop}>
                  <Text style={styles.modalTitle}>{question.amplifier.modalTitle}</Text>
                  <TouchableOpacity
                    style={styles.closeButton}
                    onPress={() => setModalVisible(false)}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="close" size={28} color="#374151" />
                  </TouchableOpacity>
                </View>

                <View style={styles.badgeContainer}>
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>Misión {question.missionNumber}</Text>
                  </View>
                  {question.difficulty && (
                    <View
                      style={[styles.difficultyBadge, { backgroundColor: getDifficultyColor(question.difficulty) }]}
                    >
                      <Text style={styles.difficultyText}>{question.difficulty}</Text>
                    </View>
                  )}
                </View>

                <Text style={styles.modalDescription}>{question.amplifier.modalDescription}</Text>
              </View>

              <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {/* Información de la pregunta */}
                <View style={styles.questionInfoCard}>
                  <View style={styles.questionInfoHeader}>
                    <Ionicons name={getTypeIcon(question.questionType)} size={32} color="#3B82F6" />
                    <View style={styles.questionInfoText}>
                      <Text style={styles.questionTypeLabel}>{getTypeLabel(question.questionType)}</Text>
                      <View style={styles.questionMetadata}>
                        {question.score && (
                          <View style={styles.metadataItem}>
                            <Ionicons name="trophy" size={16} color="#6B7280" />
                            <Text style={styles.metadataText}>{question.score} puntos</Text>
                          </View>
                        )}
                        {question.tags && question.tags.length > 0 && (
                          <View style={styles.metadataItem}>
                            <Ionicons name="pricetag" size={16} color="#6B7280" />
                            <Text style={styles.metadataText}>{question.tags.join(", ")}</Text>
                          </View>
                        )}
                      </View>
                    </View>
                  </View>
                </View>

                {/* Pregunta amplificada */}
                <View style={styles.questionCard}>
                  <Text style={styles.questionLabel}>Pregunta:</Text>
                  <Text style={styles.questionText}>{question.text}</Text>
                </View>

                {/* Opciones (si las hay) */}
                {question.options && question.options.length > 0 && (
                  <View style={styles.optionsCard}>
                    <Text style={styles.optionsLabel}>Opciones disponibles:</Text>
                    <View style={styles.optionsList}>
                      {question.options.map((option) => (
                        <View key={option.id} style={styles.optionItem}>
                          <View style={styles.optionId}>
                            <Text style={styles.optionIdText}>{option.id}</Text>
                          </View>
                          <Text style={styles.optionText}>{option.text}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}

                {/* Instrucciones para pregunta abierta */}
                {question.questionType === "OPEN_ENDED" && (
                  <View style={styles.instructionsCard}>
                    <View style={styles.instructionsHeader}>
                      <Ionicons name="bulb" size={24} color="#F59E0B" />
                      <Text style={styles.instructionsTitle}>Instrucciones para respuesta abierta:</Text>
                    </View>
                    <Text style={styles.instructionsText}>
                      Esta es una pregunta de desarrollo. Tómate tu tiempo para reflexionar y proporcionar una respuesta
                      completa y bien estructurada.
                    </Text>
                  </View>
                )}
              </ScrollView>

              {/* Footer del modal */}
              <View style={styles.modalFooter}>
                <TouchableOpacity
                  style={styles.continueButton}
                  onPress={() => setModalVisible(false)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.continueButtonText}>Continuar con la pregunta</Text>
                </TouchableOpacity>
              </View>
            </View>
          </SafeAreaView>
        </View>
      </Modal>
    </>
  )
}

const styles = StyleSheet.create({
  // Botón flotante
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

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    flex: 1,
    width: "100%",
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  modalContent: {
    flex: 1,
    backgroundColor: "white",
    borderRadius: 16,
    maxHeight: screenHeight * 0.9,
    overflow: "hidden",
  },

  // Header
  modalHeader: {
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1F2937",
    flex: 1,
    marginRight: 16,
  },
  closeButton: {
    padding: 4,
  },
  badgeContainer: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 16,
  },
  badge: {
    backgroundColor: "#F3F4F6",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#D1D5DB",
  },
  badgeText: {
    fontSize: 14,
    color: "#374151",
    fontWeight: "500",
  },
  difficultyBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  difficultyText: {
    fontSize: 14,
    color: "white",
    fontWeight: "600",
  },
  modalDescription: {
    fontSize: 18,
    color: "#6B7280",
    lineHeight: 26,
  },

  // Contenido scrolleable
  scrollContent: {
    flex: 1,
    paddingHorizontal: 24,
  },

  // Tarjeta de información
  questionInfoCard: {
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    padding: 20,
    marginVertical: 16,
    borderLeftWidth: 4,
    borderLeftColor: "#3B82F6",
  },
  questionInfoHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 16,
  },
  questionInfoText: {
    flex: 1,
  },
  questionTypeLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 8,
  },
  questionMetadata: {
    gap: 8,
  },
  metadataItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  metadataText: {
    fontSize: 14,
    color: "#6B7280",
  },

  // Tarjeta de pregunta
  questionCard: {
    backgroundColor: "#EFF6FF",
    borderRadius: 12,
    padding: 24,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: "#BFDBFE",
  },
  questionLabel: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1F2937",
    marginBottom: 12,
  },
  questionText: {
    fontSize: 20,
    lineHeight: 30,
    color: "#374151",
    fontWeight: "500",
  },

  // Tarjeta de opciones
  optionsCard: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  optionsLabel: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1F2937",
    marginBottom: 16,
  },
  optionsList: {
    gap: 12,
  },
  optionItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    padding: 16,
    backgroundColor: "#F9FAFB",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  optionId: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#DBEAFE",
    justifyContent: "center",
    alignItems: "center",
  },
  optionIdText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1D4ED8",
  },
  optionText: {
    fontSize: 16,
    lineHeight: 24,
    color: "#374151",
    flex: 1,
  },

  // Tarjeta de instrucciones
  instructionsCard: {
    backgroundColor: "#FFFBEB",
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#FDE68A",
  },
  instructionsHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  instructionsTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#92400E",
  },
  instructionsText: {
    fontSize: 14,
    lineHeight: 20,
    color: "#B45309",
  },

  // Footer
  modalFooter: {
    padding: 24,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  continueButton: {
    backgroundColor: "#2563EB",
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: "center",
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "white",
  },
})

export default QuestionAmplifier
