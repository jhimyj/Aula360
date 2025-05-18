import type React from "react"
import { View, Text, StyleSheet } from "react-native"

interface ProfileHeaderProps {
  username: string
}

const ProfileHeader: React.FC<ProfileHeaderProps> = ({ username }) => {
  // Crear una forma de mostrar las iniciales del usuario o algún ícono en lugar de la imagen
  const initials = username.split(" ").map((name) => name[0]).join(""); // Obtener las iniciales del usuario

  return (
    <View style={styles.container}>
      <View style={styles.profileContainer}>
        {/* Usamos un texto como las iniciales del usuario */}
        <View style={styles.profileIcon}>
          <Text style={styles.profileIconText}>{initials}</Text>
        </View>
        <Text style={styles.username}>{username}</Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    flexDirection: "row",
    justifyContent: "flex-start",
    alignItems: "center",
    position: "absolute",
    top: 0,
    left: 0,
    zIndex: 10,
  },
  profileContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  profileIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#FFD700", // Color dorado para el fondo de las iniciales
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
  profileIconText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  username: {
    color: "#FFD700",
    fontWeight: "bold",
  },
})

export default ProfileHeader
