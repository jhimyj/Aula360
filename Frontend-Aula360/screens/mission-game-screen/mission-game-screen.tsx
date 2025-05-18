"use client"

import { useState, useEffect } from "react"
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, StatusBar } from "react-native"
import { LinearGradient } from "expo-linear-gradient"
import { Feather } from "@expo/vector-icons"
import AsyncStorage from "@react-native-async-storage/async-storage"

/**
 * Pantalla básica que se muestra cuando se inicia una misión
 */
const MissionGameScreen = ({ navigation }) => {
  const [characterName, setCharacterName] = useState("Héroe")
  const [backgroundColor, setBackgroundColor] = useState(["#FF6B00", "#FF9500"])

  // Cargar el nombre del personaje al iniciar
  useEffect(() => {
    const loadCharacterName = async () => {
      try {
        const savedName = await AsyncStorage.getItem("selectedCharacterName")
        if (savedName) {
          setCharacterName(savedName)

          // Establecer colores según el personaje
          switch (savedName) {
            case "Qhapaq":
              setBackgroundColor(["#8E44AD", "#9B59B6"])
              break
            case "Amaru":
              setBackgroundColor(["#E74C3C", "#C0392B"])
              break
            case "Killa":
              setBackgroundColor(["#3498DB", "#2980B9"])
              break
            default:
              setBackgroundColor(["#FF6B00", "#FF9500"])
          }
        }
      } catch (error) {
        console.error("Error al cargar el nombre del personaje:", error)
      }
    }

    loadCharacterName()
  }, [])

  // Volver a la pantalla anterior
  const handleBack = () => {
    if (navigation && navigation.goBack) {
      navigation.goBack()
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient colors={backgroundColor} style={styles.background}>
        {/* Encabezado */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <Feather name="arrow-left" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>MISIÓN EN PROGRESO</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Contenido principal */}
        <View style={styles.content}>
          <View style={styles.messageContainer}>
            <Feather name="play-circle" size={80} color="#FFFFFF" style={styles.icon} />
            <Text style={styles.characterName}>{characterName}</Text>
            <Text style={styles.message}>¡Ha comenzado su misión!</Text>
            <Text style={styles.submessage}>Esta pantalla es un placeholder para el juego real</Text>
          </View>

          {/* Botones de acción */}
          <View style={styles.buttonsContainer}>
            <TouchableOpacity style={styles.actionButton} onPress={handleBack}>
              <LinearGradient colors={["rgba(255,255,255,0.3)", "rgba(255,255,255,0.1)"]} style={styles.buttonGradient}>
                <Feather name="home" size={24} color="#FFFFFF" style={styles.buttonIcon} />
                <Text style={styles.buttonText}>VOLVER</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  background: {
    flex: 1,
    width: "100%",
    height: "100%",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.2)",
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#FFFFFF",
    textShadowColor: "rgba(0,0,0,0.5)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  messageContainer: {
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.3)",
    padding: 30,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    width: "90%",
  },
  icon: {
    marginBottom: 20,
  },
  characterName: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 10,
    textShadowColor: "rgba(0,0,0,0.5)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  message: {
    fontSize: 24,
    color: "#FFFFFF",
    textAlign: "center",
    marginBottom: 20,
    textShadowColor: "rgba(0,0,0,0.5)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  submessage: {
    fontSize: 16,
    color: "rgba(255,255,255,0.7)",
    textAlign: "center",
    fontStyle: "italic",
  },
  buttonsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 40,
    width: "100%",
  },
  actionButton: {
    width: 150,
    height: 50,
    borderRadius: 25,
    overflow: "hidden",
    marginHorizontal: 10,
  },
  buttonGradient: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  buttonIcon: {
    marginRight: 8,
  },
  buttonText: {
    color: "#FFFFFF",
    fontWeight: "bold",
    fontSize: 16,
  },
})

export default MissionGameScreen
