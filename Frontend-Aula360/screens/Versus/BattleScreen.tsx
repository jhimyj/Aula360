"use client"

import { useState, useEffect } from "react"
import { View, Image, StyleSheet, Dimensions, ImageBackground, Animated, StatusBar, Platform, Text } from "react-native"
import { LinearGradient } from "expo-linear-gradient"
import AsyncStorage from "@react-native-async-storage/async-storage"

const { width, height } = Dimensions.get("window")

const BattleScreen = () => {
  // Estado para almacenar el nombre del personaje y villano seleccionados
  const [characterName, setCharacterName] = useState<string | null>(null)
  const [villainName, setVillainName] = useState<string | null>(null)

  // Animaciones para la entrada de personajes y efectos
  const [heroAnim] = useState(new Animated.Value(-width))
  const [enemyAnim] = useState(new Animated.Value(width))
  const [vsScale] = useState(new Animated.Value(0))
  const [vsRotate] = useState(new Animated.Value(0))
  const [glowOpacity] = useState(new Animated.Value(0.4))

  // Animaciones para el anuncio "Battle Royale"
  const [battleRoyaleScale] = useState(new Animated.Value(0))
  const [battleRoyaleOpacity] = useState(new Animated.Value(1))
  const [showBattleRoyale, setShowBattleRoyale] = useState(true)

  // Cargar el nombre del personaje y villano seleccionados desde AsyncStorage
  useEffect(() => {
    const loadSelectedCharacterAndVillain = async () => {
      try {
        // Cargar nombre del personaje
        const savedCharacterName = await AsyncStorage.getItem("selectedCharacterName")
        if (savedCharacterName) {
          setCharacterName(savedCharacterName)
          console.log("Nombre del personaje cargado en BattleScreen:", savedCharacterName)
        } else {
          console.log("No hay nombre de personaje guardado en AsyncStorage")
          // Si no hay personaje guardado, usamos uno por defecto
          setCharacterName("Qhapaq")
        }

        // Cargar nombre del villano
        const savedVillainName = await AsyncStorage.getItem("selectedVillainName")
        if (savedVillainName) {
          setVillainName(savedVillainName)
          console.log("Nombre del villano cargado en BattleScreen:", savedVillainName)
        } else {
          console.log("No hay nombre de villano guardado en AsyncStorage")
          // Si no hay villano guardado, usamos uno por defecto
          setVillainName("Corporatus")
        }
      } catch (error) {
        console.error("Error al cargar datos:", error)
      }
    }

    loadSelectedCharacterAndVillain()
  }, [])

  useEffect(() => {
    // Animar el anuncio "Battle Royale" primero
    Animated.sequence([
      // Entrada con zoom del texto Battle Royale
      Animated.timing(battleRoyaleScale, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      // Mantener el texto visible por un momento
      Animated.delay(1000),
      // Desvanecer el texto
      Animated.timing(battleRoyaleOpacity, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // Ocultar el componente Battle Royale después de la animación
      setShowBattleRoyale(false)

      // Iniciar las animaciones de los personajes y el VS
      Animated.parallel([
        Animated.timing(heroAnim, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(enemyAnim, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.sequence([
          Animated.delay(800),
          Animated.spring(vsScale, {
            toValue: 1,
            friction: 3,
            tension: 120,
            useNativeDriver: true,
          }),
        ]),
      ]).start()
    })

    // Animación continua para el efecto de rotación del VS
    Animated.loop(
      Animated.sequence([
        Animated.timing(vsRotate, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(vsRotate, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: true,
        }),
      ]),
    ).start()

    // Animación de brillo pulsante
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowOpacity, {
          toValue: 0.8,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(glowOpacity, {
          toValue: 0.4,
          duration: 1500,
          useNativeDriver: true,
        }),
      ]),
    ).start()
  }, [])

  // Interpolación para la rotación del VS
  const vsRotateInterpolate = vsRotate.interpolate({
    inputRange: [0, 1],
    outputRange: ["-5deg", "5deg"],
  })

  // Función para cargar dinámicamente la imagen del héroe basada en el nombre
  const getHeroImage = () => {
    // Construimos el nombre de la imagen basado en el nombre del personaje y el contexto (batalla)
    if (characterName) {
      // Como no podemos usar rutas dinámicas en require(), usamos un switch
      switch (characterName) {
        case "Qhapaq":
          return require("../../assets/Personajes/Qhapaq-battle.png")
        case "Amaru":
          return require("../../assets/Personajes/Amaru-battle.png")
        case "Killa":
          return require("../../assets/Personajes/Killa-battle.png")
        default:
          return require("../../assets/Personajes/Killa-battle.png")
      }
    }
    // Imagen por defecto si no hay personaje seleccionado
    return require("../../assets/images/villiancharacter1.png")
  }

  // Función para cargar dinámicamente la imagen del villano basada en el nombre
  const getVillainImage = () => {
    if (villainName) {
      // Como no podemos usar rutas dinámicas en require(), usamos un switch
      switch (villainName) {
        case "Corporatus":
          return require("../../assets/villanos/Corporatus.png")
        case "Toxicus":
          return require("../../assets/Personajes/Killa-battle.png")
        case "Shadowman":
          return require("../../assets/Personajes/Killa-battle.png")
        default:
          return require("../../assets/Personajes/Killa-battle.png")
      }
    }
    // Imagen por defecto si no hay villano seleccionado
    return require("../../assets/images/Hero2.png")
  }

  return (
    <View style={styles.mainContainer}>
      <StatusBar hidden />
      <ImageBackground source={require("../../assets/images/backgroundBattle.png")} style={styles.container}>
        {/* Anuncio de "Battle Royale" */}
        {showBattleRoyale && (
          <Animated.View
            style={[
              styles.battleRoyaleContainer,
              {
                opacity: battleRoyaleOpacity,
                transform: [{ scale: battleRoyaleScale }],
              },
            ]}
          >
            <LinearGradient
              colors={["rgba(255, 0, 0, 0.8)", "rgba(255, 165, 0, 0.9)"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.battleRoyaleGradient}
            >
              <Text style={styles.battleRoyaleText}>BATTLE ROYALE</Text>
              {characterName && villainName && (
                <Text style={styles.characterNameText}>
                  {characterName} VS {villainName}
                </Text>
              )}
            </LinearGradient>

            {/* Efectos adicionales para el anuncio */}
            <Animated.View style={styles.battleRoyaleGlow} />
          </Animated.View>
        )}

        {/* Contenedor superior para el héroe */}
        <View style={styles.topContainer}>
          <Animated.View style={[styles.characterContainer, { transform: [{ translateX: heroAnim }] }]}>
            <LinearGradient
              colors={["rgba(255, 140, 0, 0.8)", "rgba(255, 69, 0, 0.7)"]}
              style={styles.heroImageContainer}
            >
              <Animated.View style={[styles.glowEffect, { opacity: glowOpacity }]} />
              <Image source={getHeroImage()} style={styles.heroImage} resizeMode="contain" />
            </LinearGradient>
          </Animated.View>
        </View>

        {/* Contenedor central para el VS */}
        <View style={styles.middleContainer}>
          <Animated.View
            style={[
              styles.vsContainer,
              {
                transform: [{ scale: vsScale }, { rotate: vsRotateInterpolate }],
              },
            ]}
          >
            <Image source={require("../../assets/images/Vsplay.png")} style={styles.vsImage} resizeMode="contain" />
          </Animated.View>
        </View>

        {/* Contenedor inferior para el enemigo */}
        <View style={styles.bottomContainer}>
          <Animated.View style={[styles.characterContainer, { transform: [{ translateX: enemyAnim }] }]}>
            <LinearGradient
              colors={["rgba(255, 140, 0, 0.8)", "rgba(255, 69, 0, 0.7)"]}
              style={styles.enemyImageContainer}
            >
              <Animated.View style={[styles.glowEffect, { opacity: glowOpacity }]} />
              <Image source={getVillainImage()} style={styles.enemyImage} resizeMode="contain" />
            </LinearGradient>
          </Animated.View>
        </View>

        {/* Overlay para dar profundidad */}
        <LinearGradient colors={["rgba(0,0,0,0.4)", "transparent", "rgba(0,0,0,0.4)"]} style={styles.overlay} />
      </ImageBackground>
    </View>
  )
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: "#000",
  },
  container: {
    flex: 1,
    width: "100%",
    height: "100%",
  },
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1,
  },
  topContainer: {
    flex: 2,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: Platform.OS === "ios" ? 50 : 30,
    zIndex: 2,
  },
  middleContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 3,
  },
  bottomContainer: {
    flex: 2,
    justifyContent: "center",
    alignItems: "center",
    paddingBottom: Platform.OS === "ios" ? 50 : 30,
    zIndex: 2,
  },
  characterContainer: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  heroImageContainer: {
    width: width * 0.85,
    height: height * 0.32,
    borderRadius: 180,
    overflow: "hidden",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "rgba(255, 215, 0, 0.7)",
    elevation: 10,
    shadowColor: "#FF8C00",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 15,
  },
  enemyImageContainer: {
    width: width * 0.85,
    height: height * 0.32,
    borderRadius: 180,
    overflow: "hidden",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "rgba(255, 215, 0, 0.7)",
    elevation: 10,
    shadowColor: "#FF8C00",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 15,
  },
  glowEffect: {
    position: "absolute",
    top: -20,
    left: -20,
    right: -20,
    bottom: -20,
    backgroundColor: "#FF8C00",
    borderRadius: 200,
    zIndex: -1,
  },
  heroImage: {
    width: "90%",
    height: "90%",
  },
  enemyImage: {
    width: "90%",
    height: "90%",
  },
  vsContainer: {
    width: 150,
    height: 150,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#FF4500",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 20,
    elevation: 15,
  },
  vsImage: {
    width: "100%",
    height: "100%",
  },
  // Estilos para el anuncio de Battle Royale
  battleRoyaleContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
    backgroundColor: "rgba(0,0,0,0.7)",
  },
  battleRoyaleGradient: {
    paddingHorizontal: 30,
    paddingVertical: 20,
    borderRadius: 15,
    borderWidth: 3,
    borderColor: "#FFD700",
    shadowColor: "#FF4500",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 20,
    elevation: 20,
  },
  battleRoyaleText: {
    fontSize: 42,
    fontWeight: "bold",
    color: "#FFFFFF",
    textAlign: "center",
    textShadowColor: "rgba(0,0,0,0.8)",
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 3,
    letterSpacing: 2,
  },
  characterNameText: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#FFD700",
    textAlign: "center",
    marginTop: 10,
    textShadowColor: "rgba(0,0,0,0.8)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  battleRoyaleGlow: {
    position: "absolute",
    width: width * 1.5,
    height: width * 1.5,
    borderRadius: width * 0.75,
    backgroundColor: "transparent",
    borderWidth: 10,
    borderColor: "rgba(255, 69, 0, 0.3)",
    zIndex: -1,
  },
})

export default BattleScreen
