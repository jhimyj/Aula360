"use client"
import { View, StyleSheet, Modal, Dimensions } from "react-native"
import MissionInfo from "../mission-info/mission-info"

/**
 * Componente MissionScreen
 *
 * Pantalla que muestra la información de la misión en un modal.
 * Se puede usar como componente independiente o integrado en otra pantalla.
 */
interface MissionScreenProps {
  visible: boolean
  onClose: () => void
  onStartMission: () => void
}

const MissionScreen = ({ visible, onClose, onStartMission }: MissionScreenProps) => {
  // Obtener dimensiones de la pantalla para diseño responsivo
  const { width, height } = Dimensions.get("window")
  const isTablet = width > 768

  return (
    <Modal visible={visible} transparent={true} animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalBackground}>
        <View
          style={[
            styles.modalContainer,
            {
              width: isTablet ? "70%" : "90%",
              height: isTablet ? "80%" : "85%",
            },
          ]}
        >
          <MissionInfo
            onStartMission={() => {
              onClose()
              onStartMission()
            }}
            onClose={onClose}
          />
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  modalBackground: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 15,
  },
})

export default MissionScreen
