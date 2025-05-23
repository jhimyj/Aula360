"use client"
import { StyleSheet, Modal } from "react-native"
import MissionInfo from "../mission-info/mission-info"

/**
 * Componente MissionScreen
 *
 * Pantalla que muestra la información de la misión en pantalla completa.
 * Se puede usar como componente independiente o integrado en otra pantalla.
 */
interface MissionScreenProps {
  visible: boolean
  onClose: () => void
  onStartMission: () => void
}

const MissionScreen = ({ visible, onClose, onStartMission }: MissionScreenProps) => {
  return (
    <Modal
      visible={visible}
      transparent={false}
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent={true}
      presentationStyle="fullScreen"
    >
      <MissionInfo
        onStartMission={() => {
          onClose()
          onStartMission()
        }}
        onClose={onClose}
      />
    </Modal>
  )
}

const styles = StyleSheet.create({
  // Removed all styles that were constraining the size
})

export default MissionScreen
