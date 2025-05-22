"use client"
import { useEffect, useState } from "react"
import { View, Text, Image, ImageBackground, StyleSheet, Dimensions, TouchableOpacity, Animated } from "react-native"

// Tipo para imágenes (puede ser require local o URL)
type ImageSource = number | { uri: string }

type FeedbackScreenProps = {
  isCorrect: boolean
  correctImage: ImageSource
  incorrectImage: ImageSource
  correctBackground: ImageSource
  incorrectBackground: ImageSource
  correctDescription: string
  incorrectDescription: string
  onContinue: () => void
}

const { width, height } = Dimensions.get("window")

export const FeedbackScreen = ({
  isCorrect,
  correctImage,
  incorrectImage,
  correctBackground,
  incorrectBackground,
  correctDescription,
  incorrectDescription,
  onContinue,
}: FeedbackScreenProps) => {
  const [fadeAnim] = useState(new Animated.Value(0))
  const [scaleAnim] = useState(new Animated.Value(0.8))

  useEffect(() => {
    // Animación de entrada
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start()
  }, [])

  // Verificar que todas las propiedades necesarias estén definidas
  if (
    !correctImage ||
    !incorrectImage ||
    !correctBackground ||
    !incorrectBackground ||
    !correctDescription ||
    !incorrectDescription
  ) {
    console.error("FeedbackScreen: Faltan propiedades requeridas")
    // Continuar automáticamente si faltan propiedades
    setTimeout(onContinue, 100)
    return null
  }

  // Seleccionar contenido basado en si la respuesta es correcta o incorrecta
  const backgroundImage = isCorrect ? correctBackground : incorrectBackground
  const image = isCorrect ? correctImage : incorrectImage
  const description = isCorrect ? correctDescription : incorrectDescription
  const title = isCorrect ? "¡Correcto!" : "Incorrecto"
  const titleColor = isCorrect ? "#4CAF50" : "#F44336"
  const buttonColor = isCorrect ? "#4CAF50" : "#F44336"

  return (
    <ImageBackground source={backgroundImage} style={styles.background} resizeMode="cover">
      <Animated.View style={[styles.container, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>
        <Text style={[styles.title, { color: titleColor }]}>{title}</Text>

        <View style={styles.imageContainer}>
          <Image source={image} style={styles.image} resizeMode="contain" />
        </View>

        <View style={styles.descriptionContainer}>
          <Text style={styles.description}>{description}</Text>
        </View>

        <TouchableOpacity style={[styles.continueButton, { backgroundColor: buttonColor }]} onPress={onContinue}>
          <Text style={styles.continueButtonText}>Continuar</Text>
        </TouchableOpacity>
      </Animated.View>
    </ImageBackground>
  )
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    width: "100%",
  },
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    marginBottom: 20,
    textShadowColor: "rgba(0, 0, 0, 0.2)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  imageContainer: {
    width: width * 0.7,
    height: height * 0.3,
    marginBottom: 20,
    borderRadius: 15,
    overflow: "hidden",
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    padding: 10,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  image: {
    width: "100%",
    height: "100%",
  },
  descriptionContainer: {
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    borderRadius: 15,
    padding: 20,
    width: width * 0.85,
    marginBottom: 30,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: "center",
    color: "#333",
  },
  continueButton: {
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 25,
  },
  continueButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
})
