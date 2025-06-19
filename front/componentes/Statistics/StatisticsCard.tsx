import { View, Text, StyleSheet } from "react-native"
import { Feather } from "@expo/vector-icons"

export const StatisticsCard = ({ title, value, icon, color }) => {
  return (
    <View style={styles.card}>
      <View style={[styles.iconContainer, { backgroundColor: `${color}20` }]}>
        <Feather name={icon} size={20} color={color} />
      </View>
      <Text style={styles.value}>{value}</Text>
      <Text style={styles.title}>{title}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
    alignItems: "center",
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  value: {
    fontSize: 20,
    fontFamily: "Poppins_700Bold",
    color: "#333",
    marginBottom: 4,
  },
  title: {
    fontSize: 12,
    fontFamily: "Poppins_500Medium",
    color: "#666",
    textAlign: "center",
  },
})
