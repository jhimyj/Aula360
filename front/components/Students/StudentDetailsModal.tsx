import type React from "react"
import { View, Text, Modal, StyleSheet, TouchableOpacity, ScrollView } from "react-native"
import { Ionicons } from "@expo/vector-icons"

interface StudentDetailsModalProps {
  visible: boolean
  onClose: () => void
  onViewResponses: () => void
  student: {
    id: string
    username: string
    status: string
    score_student: number
    score_villain: number
    created_at: string
    updated_at: string
  } | null
  formatDate: (date: string) => string
  getStatusColor: (status: string) => string
  getStatusText: (status: string) => string
}

const StudentDetailsModal: React.FC<StudentDetailsModalProps> = ({
  visible,
  onClose,
  onViewResponses,
  student,
  formatDate,
  getStatusColor,
  getStatusText,
}) => {
  if (!student) return null

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContainer, { borderLeftColor: getStatusColor(student.status), borderLeftWidth: 5 }]}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Detalles del Estudiante</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.studentProfile}>
              <View style={[styles.avatarContainer, { backgroundColor: getStatusColor(student.status) + "20" }]}>
                <Text style={[styles.avatarText, { color: getStatusColor(student.status) }]}>
                  {student.username.charAt(0).toUpperCase()}
                </Text>
              </View>
              <View style={styles.profileInfo}>
                <Text style={styles.studentName}>{student.username}</Text>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(student.status) }]}>
                  <Text style={styles.statusText}>{getStatusText(student.status)}</Text>
                </View>
              </View>
            </View>

            <View style={styles.detailsSection}>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>ID del Estudiante:</Text>
                <Text style={styles.detailValue}>{student.id}</Text>
              </View>

              <View style={styles.scoresContainer}>
                <View style={styles.scoreCard}>
                  <Ionicons name="trophy" size={24} color="#4CAF50" />
                  <Text style={styles.scoreValue}>{student.score_student}</Text>
                  <Text style={styles.scoreLabel}>Puntos Estudiante</Text>
                </View>
                <View style={styles.scoreCard}>
                  <Ionicons name="skull" size={24} color="#F44336" />
                  <Text style={styles.scoreValue}>{student.score_villain}</Text>
                  <Text style={styles.scoreLabel}>Puntos Villano</Text>
                </View>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Fecha de Creación:</Text>
                <Text style={styles.detailValue}>{formatDate(student.created_at)}</Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Última Actualización:</Text>
                <Text style={styles.detailValue}>{formatDate(student.updated_at)}</Text>
              </View>
            </View>
          </ScrollView>

          <View style={styles.modalFooter}>
            <TouchableOpacity style={styles.viewResponsesButton} onPress={onViewResponses}>
              <Ionicons name="chatbubbles" size={18} color="#FFFFFF" />
              <Text style={styles.viewResponsesText}>Ver Respuestas</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    width: "100%",
    maxWidth: 500,
    maxHeight: "80%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 10,
    overflow: "hidden",
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
    fontWeight: "600",
    color: "#333",
  },
  closeButton: {
    padding: 4,
  },
  modalContent: {
    padding: 20,
    maxHeight: 400,
  },
  studentProfile: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  avatarContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  avatarText: {
    fontSize: 24,
    fontWeight: "700",
  },
  profileInfo: {
    flex: 1,
  },
  studentName: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: "flex-start",
  },
  statusText: {
    fontSize: 12,
    fontWeight: "500",
    color: "#FFFFFF",
  },
  detailsSection: {
    backgroundColor: "#F8F9FA",
    borderRadius: 12,
    padding: 16,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  detailLabel: {
    fontSize: 14,
    color: "#666",
    flex: 1,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: "500",
    color: "#333",
    flex: 2,
    textAlign: "right",
  },
  scoresContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: 16,
  },
  scoreCard: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    padding: 12,
    alignItems: "center",
    marginHorizontal: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  scoreValue: {
    fontSize: 20,
    fontWeight: "700",
    color: "#333",
    marginVertical: 4,
  },
  scoreLabel: {
    fontSize: 12,
    color: "#666",
    textAlign: "center",
  },
  modalFooter: {
    borderTopWidth: 1,
    borderTopColor: "#E0E0E0",
    padding: 16,
    alignItems: "center",
  },
  viewResponsesButton: {
    flexDirection: "row",
    backgroundColor: "#4361EE",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
  },
  viewResponsesText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
    marginLeft: 8,
  },
})

export default StudentDetailsModal
