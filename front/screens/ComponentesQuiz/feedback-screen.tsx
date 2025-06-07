"use client"
import { useEffect, useState } from "react"
import {
  View,
  Text,
  Image,
  ImageBackground,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Animated,
  ScrollView,
  SafeAreaView,
  Platform,
} from "react-native"

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
  userAnswer?: string
  isOpenEnded?: boolean
  aiScore?: number // Nuevo: score del endpoint de IA
  onContinue: () => void
}

const { width, height } = Dimensions.get("window")
const isTablet = width >= 768;

export const FeedbackScreen = ({
  isCorrect,
  correctImage,
  incorrectImage,
  correctBackground,
  incorrectBackground,
  correctDescription,
  incorrectDescription,
  userAnswer,
  isOpenEnded = false,
  aiScore,
  onContinue,
}: FeedbackScreenProps) => {
  const [fadeAnim] = useState(new Animated.Value(0))
  const [scaleAnim] = useState(new Animated.Value(0.8))
  const [dimensions, setDimensions] = useState(Dimensions.get('window'))

  // Actualizar dimensiones cuando cambia la orientación
  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setDimensions(window);
    });
    
    return () => {
      if (subscription?.remove) {
        subscription.remove();
      }
    };
  }, []);

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

  // Título dinámico basado en el score de IA si está disponible
  let title = isOpenEnded ? "¡Respuesta Enviada!" : isCorrect ? "¡Correcto!" : "Incorrecto"
  if (aiScore !== undefined) {
    if (aiScore >= 200) title = "¡Excelente!"
    else if (aiScore >= 100) title = "¡Bien!"
    else if (aiScore > 0) title = "¡Puedes mejorar!"
    else title = "Incorrecto"
  }

  const titleColor = isOpenEnded ? "#4CAF50" : isCorrect ? "#4CAF50" : "#F44336"
  const buttonColor = isOpenEnded ? "#4CAF50" : isCorrect ? "#4CAF50" : "#F44336"

  return (
    <ImageBackground source={backgroundImage} style={styles.background} resizeMode="cover">
      <SafeAreaView style={styles.safeArea}>
        <ScrollView 
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={true}
          persistentScrollbar={true}
          indicatorStyle="white"
          bounces={true}
        >
          <Animated.View style={[styles.container, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>
            <Text style={[
              styles.title, 
              { color: titleColor },
              isTablet && styles.tabletTitle
            ]}>
              {title}
            </Text>

            {/* Mostrar score de IA si está disponible */}
            {aiScore !== undefined && (
              <View style={[
                styles.scoreContainer,
                isTablet && styles.tabletScoreContainer
              ]}>
                <Text style={[
                  styles.scoreText,
                  isTablet && styles.tabletScoreText
                ]}>
                  Puntuación: {aiScore}
                </Text>
              </View>
            )}

            <View style={[
              styles.imageContainer,
              isTablet && styles.tabletImageContainer
            ]}>
              <Image source={image} style={styles.image} resizeMode="contain" />
            </View>

            <View style={[
              styles.descriptionContainer,
              isTablet && styles.tabletDescriptionContainer
            ]}>
              <ScrollView 
                style={styles.descriptionScrollView}
                contentContainerStyle={styles.descriptionScrollContent}
                showsVerticalScrollIndicator={true}
                persistentScrollbar={true}
                indicatorStyle="black"
                nestedScrollEnabled={true}
              >
                <Text style={[
                  styles.description,
                  isTablet && styles.tabletDescription
                ]}>
                  {description}
                </Text>

                {/* Mostrar la respuesta del usuario si es una pregunta abierta */}
                {isOpenEnded && userAnswer && (
                  <View style={styles.userAnswerContainer}>
                    <Text style={[
                      styles.userAnswerLabel,
                      isTablet && styles.tabletUserAnswerLabel
                    ]}>
                      Tu respuesta:
                    </Text>
                    <ScrollView 
                      style={styles.userAnswerScrollView}
                      contentContainerStyle={styles.userAnswerScrollContent}
                      showsVerticalScrollIndicator={true}
                      persistentScrollbar={true}
                      indicatorStyle="black"
                      nestedScrollEnabled={true}
                    >
                      <Text style={[
                        styles.userAnswerText,
                        isTablet && styles.tabletUserAnswerText
                      ]}>
                        {userAnswer}
                      </Text>
                    </ScrollView>
                  </View>
                )}
              </ScrollView>
            </View>

            <TouchableOpacity 
              style={[
                styles.continueButton, 
                { backgroundColor: buttonColor },
                isTablet && styles.tabletContinueButton
              ]} 
              onPress={onContinue}
            >
              <Text style={[
                styles.continueButtonText,
                isTablet && styles.tabletContinueButtonText
              ]}>
                Continuar
              </Text>
            </TouchableOpacity>
          </Animated.View>
        </ScrollView>
      </SafeAreaView>
    </ImageBackground>
  )
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    width: "100%",
  },
  safeArea: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  container: {
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
    width: "100%",
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    marginBottom: 20,
    textShadowColor: "rgba(0, 0, 0, 0.2)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  tabletTitle: {
    fontSize: 42,
    marginBottom: 25,
  },
  scoreContainer: {
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    borderRadius: 10,
    padding: 10,
    marginBottom: 15,
  },
  tabletScoreContainer: {
    padding: 15,
    borderRadius: 15,
    marginBottom: 20,
  },
  scoreText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#4CAF50",
    textAlign: "center",
  },
  tabletScoreText: {
    fontSize: 22,
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
  tabletImageContainer: {
    width: width * 0.6,
    height: height * 0.35,
    borderRadius: 20,
    padding: 15,
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
    maxHeight: height * 0.4, // Limitar altura máxima
  },
  tabletDescriptionContainer: {
    width: width * 0.75,
    borderRadius: 20,
    padding: 25,
    maxHeight: height * 0.45,
  },
  descriptionScrollView: {
    width: '100%',
  },
  descriptionScrollContent: {
    paddingBottom: 10,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: "center",
    color: "#333",
  },
  tabletDescription: {
    fontSize: 20,
    lineHeight: 28,
  },
  userAnswerContainer: {
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: "#DDD",
    width: '100%',
  },
  userAnswerLabel: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#555",
    marginBottom: 5,
  },
  tabletUserAnswerLabel: {
    fontSize: 18,
    marginBottom: 8,
  },
  userAnswerScrollView: {
    maxHeight: 150,
  },
  userAnswerScrollContent: {
    paddingBottom: 10,
  },
  userAnswerText: {
    fontSize: 14,
    color: "#333",
    fontStyle: "italic",
  },
  tabletUserAnswerText: {
    fontSize: 18,
  },
  continueButton: {
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 25,
  },
  tabletContinueButton: {
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 30,
  },
  continueButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  tabletContinueButtonText: {
    fontSize: 20,
  },
})