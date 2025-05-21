import { TouchableOpacity, Text, StyleSheet, type ViewStyle } from "react-native"
import { LinearGradient } from "expo-linear-gradient"

/**
 * Componente MissionButton
 *
 * Botón estilizado con gradiente para acciones de misión.
 */
interface MissionButtonProps {
  title: string
  onPress: () => void
  style?: ViewStyle
  disabled?: boolean
  colors?: string[] // Nueva propiedad para los colores del gradiente
}

const MissionButton = ({
  title,
  onPress,
  style,
  disabled = false,
  colors = ["#FF6B00", "#FF9500"],
}: MissionButtonProps) => {
  return (
    <TouchableOpacity style={[styles.buttonContainer, style]} onPress={onPress} activeOpacity={0.8} disabled={disabled}>
      <LinearGradient
        colors={disabled ? ["#CCCCCC", "#AAAAAA"] : colors}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      >
        <Text style={styles.buttonText}>{title}</Text>
      </LinearGradient>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  buttonContainer: {
    height: 50,
    borderRadius: 25,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  gradient: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
  },
})

export default MissionButton
