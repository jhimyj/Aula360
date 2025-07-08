"use client"

import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
  Dimensions,
  StatusBar,
  Animated,
} from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { useState, useEffect } from "react"

// Tipos para las propiedades del componente
type OptionType = {
  id: string
  text: string
}

type ReadingModeOverlayProps = {
  visible: boolean
  onClose: () => void
  missionNumber: number
  question: string
  questionType: "MULTIPLE_CHOICE_SINGLE" | "MULTIPLE_CHOICE_MULTIPLE" | "OPEN_ENDED"
  options: OptionType[]
  difficulty?: "EASY" | "MEDIUM" | "HARD"
  tags?: string[]
  score?: number
}

const { width: screenWidth, height: screenHeight } = Dimensions.get("window")

// Funciones de ayuda
const getDifficultyColor = (difficulty?: string) => {
  switch (difficulty) {
    case "EASY":
      return "#10B981"
    case "MEDIUM":
      return "#F59E0B"
    case "HARD":
      return "#EF4444"
    default:
      return "#6B7280"
  }
}

const getTypeIcon = (type: string) => {
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

const getTypeLabel = (type: string) => {
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

export const ReadingModeOverlay = ({
  visible,
  onClose,
  missionNumber,
  question,
  questionType,
  options,
  difficulty,
  tags,
  score,
}: ReadingModeOverlayProps) => {
  const [fadeAnim] = useState(new Animated.Value(0))
  const isOpenEndedQuestion = questionType === "OPEN_ENDED"

  useEffect(() => {
    if (visible) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start()
    } else {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start()
    }
  }, [visible])

  if (!visible) return null

  return (
    <Animated.View style={[styles.overlayContainer, { opacity: fadeAnim }]}>
      <StatusBar backgroundColor="rgba(0,0,0,0.9)" barStyle="light-content" />

      {/* Background oscuro */}
      <TouchableOpacity style={styles.backgroundOverlay} activeOpacity={1} onPress={onClose} />

      {/* Contenedor principal */}
      <View style={styles.contentContainer}>
        {/* Header fijo */}
        <View style={styles.headerContainer}>
          <View style={styles.headerContent}>
            <View style={styles.headerIcon}>
              <Ionicons name="book-outline" size={24} color="#2563EB" />
            </View>
            <View style={styles.headerText}>
              <Text style={styles.headerTitle}>Modo Lectura</Text>
              <Text style={styles.headerSubtitle}>Pregunta {missionNumber}</Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.closeButton}
            onPress={onClose}
            hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
          >
            <Ionicons name="close" size={28} color="#64748B" />
          </TouchableOpacity>
        </View>

        {/* ScrollView que SÍ va a funcionar */}
        <ScrollView
          style={styles.scrollContainer}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={true}
          bounces={true}
          // Props que FUNCIONAN en APK
          keyboardShouldPersistTaps="handled"
          removeClippedSubviews={false}
          scrollEventThrottle={16}
        >
          {/* Indicador de scroll */}
          <View style={styles.scrollIndicator}>
            <Ionicons name="chevron-down" size={18} color="#94A3B8" />
            <Text style={styles.scrollIndicatorText}>Desliza para leer todo el contenido</Text>
          </View>

          {/* Tarjeta principal */}
          <View style={styles.mainCard}>
            {/* Header de la pregunta */}
            <View style={styles.questionHeader}>
              <View style={styles.questionTypeIndicator}>
                <Ionicons name={getTypeIcon(questionType)} size={20} color="#2563EB" />
                <Text style={styles.questionTypeText}>{getTypeLabel(questionType)}</Text>
              </View>

              {difficulty && (
                <View style={[styles.difficultyBadge, { backgroundColor: getDifficultyColor(difficulty) }]}>
                  <Text style={styles.difficultyText}>{difficulty}</Text>
                </View>
              )}
            </View>

            {/* Pregunta */}
            <View style={styles.questionContainer}>
              <Text style={styles.questionText}>{question}</Text>
            </View>

            {/* Opciones */}
            {!isOpenEndedQuestion && options.length > 0 && (
              <View style={styles.optionsSection}>
                <Text style={styles.optionsSectionTitle}>Opciones disponibles:</Text>
                {options.map((option) => (
                  <View key={option.id} style={styles.optionItem}>
                    <View style={styles.optionBullet}>
                      <Text style={styles.optionBulletText}>{option.id}</Text>
                    </View>
                    <Text style={styles.optionText}>{option.text}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Tags */}
            {tags && tags.length > 0 && (
              <View style={styles.tagsSection}>
                <Text style={styles.tagsSectionTitle}>Temas:</Text>
                <View style={styles.tagsContainer}>
                  {tags.map((tag, index) => (
                    <View key={index} style={styles.tagItem}>
                      <Text style={styles.tagText}>{tag}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Info adicional */}
            <View style={styles.infoSection}>
              <View style={styles.infoItem}>
                <Ionicons name="time-outline" size={18} color="#64748B" />
                <Text style={styles.infoText}>Tómate el tiempo necesario para leer</Text>
              </View>

              {score && (
                <View style={styles.infoItem}>
                  <Ionicons name="star-outline" size={18} color="#64748B" />
                  <Text style={styles.infoText}>Puntuación: {score} puntos</Text>
                </View>
              )}
            </View>

            {/* Consejos adicionales */}
            <View style={styles.tipsSection}>
              <Text style={styles.tipsSectionTitle}>💡 Consejos para responder:</Text>
              <Text style={styles.tipsText}>
                • Lee cuidadosamente toda la pregunta{"\n"}• Analiza cada opción disponible{"\n"}• Considera el contexto
                y la dificultad{"\n"}• Tómate el tiempo necesario para pensar{"\n"}• Revisa tu respuesta antes de enviar
              </Text>
            </View>

            {/* Más contenido para garantizar scroll */}
            <View style={styles.extraContent}>
              <Text style={styles.extraContentTitle}>📚 Información adicional</Text>
              <Text style={styles.extraContentText}>
                Esta pregunta forma parte de tu proceso de aprendizaje. Recuerda que cada respuesta es una oportunidad
                para mejorar tus conocimientos y habilidades.
                {"\n\n"}
                Si tienes dudas, tómate el tiempo necesario para analizar cada opción. La comprensión es más importante
                que la velocidad.
                {"\n\n"}
                ¡Confía en tu conocimiento y da lo mejor de ti!
              </Text>
            </View>
          </View>

          {/* Espaciado final para garantizar scroll */}
          <View style={styles.finalSpacing} />
        </ScrollView>

        {/* Footer fijo */}
        <View style={styles.footerContainer}>
          <TouchableOpacity
            style={styles.continueButton}
            onPress={onClose}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="checkmark-circle-outline" size={22} color="white" />
            <Text style={styles.continueButtonText}>Continuar con la pregunta</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  // OVERLAY ABSOLUTO - Sin Modal
  overlayContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 9999,
    elevation: 9999,
  },

  backgroundOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.85)",
  },

  contentContainer: {
    flex: 1,
    marginTop: Platform.OS === "android" ? StatusBar.currentHeight || 0 : 0,
    marginHorizontal: 16,
    marginVertical: 40,
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    elevation: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
  },

  // Header fijo
  headerContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingVertical: 20,
    backgroundColor: "#F8FAFC",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },

  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },

  headerIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#EBF4FF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },

  headerText: {
    flex: 1,
  },

  headerTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#1E293B",
    marginBottom: 2,
  },

  headerSubtitle: {
    fontSize: 15,
    color: "#64748B",
    fontWeight: "500",
  },

  closeButton: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: "#F1F5F9",
    justifyContent: "center",
    alignItems: "center",
  },

  // ScrollView que FUNCIONA
  scrollContainer: {
    flex: 1,
  },

  scrollContent: {
    padding: 24,
    paddingBottom: 40,
  },

  scrollIndicator: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    marginBottom: 20,
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },

  scrollIndicatorText: {
    fontSize: 13,
    color: "#64748B",
    marginLeft: 8,
    fontWeight: "500",
  },

  // Tarjeta principal
  mainCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },

  // Header de pregunta
  questionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },

  questionTypeIndicator: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EBF4FF",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
  },

  questionTypeText: {
    fontSize: 14,
    color: "#2563EB",
    fontWeight: "600",
    marginLeft: 8,
  },

  difficultyBadge: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
  },

  difficultyText: {
    fontSize: 12,
    color: "white",
    fontWeight: "700",
    textTransform: "uppercase",
  },

  // Pregunta
  questionContainer: {
    marginBottom: 28,
  },

  questionText: {
    fontSize: 19,
    lineHeight: 30,
    color: "#1E293B",
    fontWeight: "500",
  },

  // Opciones
  optionsSection: {
    marginBottom: 28,
  },

  optionsSectionTitle: {
    fontSize: 17,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 16,
  },

  optionItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#F8FAFC",
    padding: 18,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginBottom: 12,
  },

  optionBullet: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#2563EB",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
    flexShrink: 0,
  },

  optionBulletText: {
    fontSize: 14,
    fontWeight: "700",
    color: "white",
  },

  optionText: {
    fontSize: 16,
    lineHeight: 24,
    color: "#374151",
    flex: 1,
  },

  // Tags
  tagsSection: {
    marginBottom: 28,
  },

  tagsSectionTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#64748B",
    marginBottom: 12,
  },

  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },

  tagItem: {
    backgroundColor: "#F1F5F9",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },

  tagText: {
    fontSize: 13,
    color: "#475569",
    fontWeight: "500",
  },

  // Info adicional
  infoSection: {
    gap: 14,
    marginBottom: 28,
  },

  infoItem: {
    flexDirection: "row",
    alignItems: "center",
  },

  infoText: {
    fontSize: 15,
    color: "#64748B",
    marginLeft: 10,
    fontWeight: "500",
  },

  // Tips
  tipsSection: {
    backgroundColor: "#F8FAFC",
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginBottom: 28,
  },

  tipsSectionTitle: {
    fontSize: 17,
    fontWeight: "600",
    color: "#1E293B",
    marginBottom: 12,
  },

  tipsText: {
    fontSize: 15,
    lineHeight: 24,
    color: "#64748B",
  },

  // Contenido extra
  extraContent: {
    backgroundColor: "#EBF4FF",
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#DBEAFE",
    marginBottom: 20,
  },

  extraContentTitle: {
    fontSize: 17,
    fontWeight: "600",
    color: "#1E293B",
    marginBottom: 12,
  },

  extraContentText: {
    fontSize: 15,
    lineHeight: 24,
    color: "#64748B",
  },

  finalSpacing: {
    height: 60,
  },

  // Footer fijo
  footerContainer: {
    paddingHorizontal: 24,
    paddingVertical: 20,
    backgroundColor: "#F8FAFC",
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },

  continueButton: {
    flexDirection: "row",
    backgroundColor: "#2563EB",
    paddingVertical: 18,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#2563EB",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },

  continueButtonText: {
    fontSize: 17,
    fontWeight: "600",
    color: "white",
    marginLeft: 10,
  },
})
