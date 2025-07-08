"use client"
import { useEffect, useState } from "react"
import { View, Image, ImageBackground, StyleSheet, Dimensions, Animated } from "react-native"

// Tipo para imágenes (puede ser require local o URL)
type ImageSource = number | { uri: string }

type TransitionScreenProps = {
  backgroundImage: ImageSource
  image: ImageSource
  title: string
  description: string
  missionNumber: number
  onFinishTransition: () => void
  transitionDuration?: number // en milisegundos
}

const { width, height } = Dimensions.get("window")

export const TransitionScreen = ({
  backgroundImage,
  image,
  title,
  description,
  missionNumber,
  onFinishTransition,
  transitionDuration = 3000, // 3 segundos por defecto
}: TransitionScreenProps) => {
  const [fadeInAnim] = useState(new Animated.Value(0))
  const [fadeOutAnim] = useState(new Animated.Value(1))
  const [titleAnim] = useState(new Animated.Value(-50))
  const [imageAnim] = useState(new Animated.Value(50))
  const [progressWidth] = useState(new Animated.Value(0))

  useEffect(() => {
    // Verificar que todas las propiedades necesarias estén definidas
    if (!backgroundImage || !image || !title || !description) {
      console.error("TransitionScreen: Faltan propiedades requeridas")
      // Continuar automáticamente si faltan propiedades
      onFinishTransition()
      return
    }

    // Secuencia de animación
    Animated.sequence([
      // Fade in y animaciones de entrada
      Animated.parallel([
        Animated.timing(fadeInAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.spring(titleAnim, {
          toValue: 0,
          friction: 6,
          tension: 40,
          useNativeDriver: true,
        }),
        Animated.spring(imageAnim, {
          toValue: 0,
          friction: 6,
          tension: 40,
          useNativeDriver: true,
        }),
      ]),

      // Esperar un momento
      Animated.delay(transitionDuration - 1000),

      // Fade out
      Animated.timing(fadeOutAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // Cuando termine la animación, llamar al callback
      onFinishTransition()
    })

    // Animación de la barra de progreso
    Animated.timing(progressWidth, {
      toValue: width * 0.85,
      duration: transitionDuration,
      useNativeDriver: false,
    }).start()
  }, [])

  return (
    <ImageBackground source={backgroundImage} style={styles.background} resizeMode="cover">
      <Animated.View
        style={[
          styles.container,
          {
            opacity: Animated.multiply(fadeInAnim, fadeOutAnim),
          },
        ]}
      >
        <Animated.Text
          style={[
            styles.missionNumber,
            {
              transform: [{ translateY: titleAnim }],
            },
          ]}
        >
          Misión {missionNumber}
        </Animated.Text>

        <Animated.Text
          style={[
            styles.title,
            {
              transform: [{ translateY: titleAnim }],
            },
          ]}
        >
          {title}
        </Animated.Text>

        <Animated.View
          style={[
            styles.imageContainer,
            {
              transform: [{ translateY: imageAnim }],
            },
          ]}
        >
          <Image source={image} style={styles.image} resizeMode="contain" />
        </Animated.View>

        <Animated.Text
          style={[
            styles.description,
            {
              transform: [{ translateY: imageAnim }],
            },
          ]}
        >
          {description}
        </Animated.Text>

        <View style={styles.progressBarContainer}>
          <Animated.View style={[styles.progressBar, { width: progressWidth }]} />
        </View>
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
  missionNumber: {
    fontSize: 18,
    color: "#FFF",
    fontWeight: "bold",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    paddingHorizontal: 15,
    paddingVertical: 5,
    borderRadius: 20,
    marginBottom: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#FFF",
    marginBottom: 20,
    textAlign: "center",
    textShadowColor: "rgba(0, 0, 0, 0.5)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
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
  description: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: "center",
    color: "#FFF",
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    borderRadius: 10,
    padding: 15,
    width: width * 0.85,
    marginBottom: 30,
    textShadowColor: "rgba(0, 0, 0, 0.5)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  progressBarContainer: {
    width: width * 0.85,
    height: 6,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    borderRadius: 3,
    overflow: "hidden",
    position: "absolute",
    bottom: 30,
  },
  progressBar: {
    height: "100%",
    backgroundColor: "#4CAF50",
  },
})
