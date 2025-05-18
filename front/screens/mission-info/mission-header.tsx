import { View, Text, TouchableOpacity, StyleSheet } from "react-native"
import { Feather } from "@expo/vector-icons"

/**
 * Componente MissionHeader
 *
 * Encabezado para la pantalla de información de misión.
 * Muestra el título y un botón para cerrar.
 */
interface MissionHeaderProps {
  title: string
  onClose: () => void
  accentColor?: string // Nueva propiedad para el color de acento
}

const MissionHeader = ({ title, onClose, accentColor = "#333" }: MissionHeaderProps) => {
  return (
    <View style={styles.header}>
      <Text style={[styles.title, { color: accentColor }]}>{title}</Text>
      <TouchableOpacity style={styles.closeButton} onPress={onClose}>
        <Feather name="x" size={24} color={accentColor} />
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#EEEEEE",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333333",
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#F5F5F5",
    justifyContent: "center",
    alignItems: "center",
  },
})

export default MissionHeader
