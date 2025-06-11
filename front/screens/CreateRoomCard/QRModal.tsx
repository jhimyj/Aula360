import React from "react"
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Dimensions,
  Platform,
} from "react-native"
import { Feather } from "@expo/vector-icons"
import QRCode from "react-native-qrcode-svg"

const { width } = Dimensions.get("window")

export default function QRModal({
  visible,
  onClose,
  room,
  onSaveQR,
  onShareQR,
  onShareText,
  qrLoading,
  qrViewRef,
  getLiaLogoBase64,
}) {
  const qrSize = width * 0.6
  const qrValue = `lia://join?code=${room.short_code || room.id}&name=${encodeURIComponent(room.name)}`
  const logoBase64 = getLiaLogoBase64()

  return (
    <Modal visible={visible} transparent={true} animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Código QR de la Sala</Text>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Feather name="x" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          <View style={styles.qrContainer} ref={qrViewRef}>
            <View style={styles.qrCard}>
              <View style={styles.qrHeader}>
                <Text style={styles.qrRoomName}>{room.name}</Text>
                {room.course && <Text style={styles.qrRoomCourse}>{room.course}</Text>}
              </View>

              <View style={styles.qrCodeContainer}>
                {qrLoading ? (
                  <ActivityIndicator size="large" color="#4361EE" />
                ) : (
                  <QRCode
                    value={qrValue}
                    size={qrSize}
                    color="#000"
                    backgroundColor="#fff"
                    logo={{ uri: logoBase64 }}
                    logoSize={qrSize * 0.2}
                    logoBackgroundColor="white"
                    logoBorderRadius={8}
                  />
                )}
              </View>

              <View style={styles.qrFooter}>
                <Text style={styles.qrFooterText}>Escanea para unirte a la sala</Text>
                <Text style={styles.qrCode}>{room.short_code || room.id}</Text>
              </View>
            </View>
          </View>

          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.actionButton, styles.saveButton]}
              onPress={onSaveQR}
              disabled={qrLoading}
            >
              {qrLoading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Feather name="download" size={18} color="#fff" style={styles.actionIcon} />
                  <Text style={styles.actionButtonText}>Guardar</Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, styles.shareButton]}
              onPress={onShareQR}
              disabled={qrLoading}
            >
              {qrLoading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Feather name="share-2" size={18} color="#fff" style={styles.actionIcon} />
                  <Text style={styles.actionButtonText}>Compartir QR</Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, styles.shareTextButton]}
              onPress={onShareText}
              disabled={qrLoading}
            >
              <Feather name="message-square" size={18} color="#fff" style={styles.actionIcon} />
              <Text style={styles.actionButtonText}>Compartir Texto</Text>
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
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 16,
    width: "100%",
    maxWidth: 500,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: "Poppins_600SemiBold",
    color: "#333",
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F5F5F5",
    alignItems: "center",
    justifyContent: "center",
  },
  qrContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 16,
  },
  qrCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E5E5",
    width: "100%",
  },
  qrHeader: {
    alignItems: "center",
    marginBottom: 16,
  },
  qrRoomName: {
    fontSize: 18,
    fontFamily: "Poppins_600SemiBold",
    color: "#333",
    textAlign: "center",
  },
  qrRoomCourse: {
    fontSize: 14,
    fontFamily: "Poppins_500Medium",
    color: "#4361EE",
    marginTop: 4,
    textAlign: "center",
  },
  qrCodeContainer: {
    padding: 16,
    backgroundColor: "#fff",
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
    minHeight: width * 0.6,
    minWidth: width * 0.6,
  },
  qrFooter: {
    alignItems: "center",
  },
  qrFooterText: {
    fontSize: 14,
    fontFamily: "Poppins_400Regular",
    color: "#666",
    marginBottom: 8,
    textAlign: "center",
  },
  qrCode: {
    fontSize: 16,
    fontFamily: "Poppins_600SemiBold",
    color: "#4361EE",
    textAlign: "center",
  },
  actionButtons: {
    flexDirection: "column",
    gap: 12,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  saveButton: {
    backgroundColor: "#4CAF50",
  },
  shareButton: {
    backgroundColor: "#4361EE",
  },
  shareTextButton: {
    backgroundColor: "#FF9800",
  },
  actionIcon: {
    marginRight: 8,
  },
  actionButtonText: {
    color: "#fff",
    fontSize: 14,
    fontFamily: "Poppins_500Medium",
  },
})
