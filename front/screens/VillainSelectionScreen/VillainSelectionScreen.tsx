"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  Image,
  Dimensions,
  StatusBar as RNStatusBar,
  type ScaledSize,
  Alert,
} from "react-native"
import { LinearGradient } from "expo-linear-gradient"
import { Audio } from "expo-av"
import { useIsFocused } from "@react-navigation/native"
import AsyncStorage from "@react-native-async-storage/async-storage"

import BackButton from "../ComponentesVillano/UI/back-button"
import VillainCarousel from "../ComponentesVillano/villain-carousel"
import VillainCard from "../ComponentesVillano/villain-card"
import ActionButton from "../ComponentesVillano/UI/action-button"

// -------------------- Datos de villanos --------------------
const villains = [
  {
    id: 1,
    name: "Corporatus",
    image: require("../../assets/villanosSelection/Corporatus.png"),
    description:
      "El magnate corrupto que contamina el planeta por beneficio propio. Sus acciones han causado daños irreparables al ecosistema global y ha sobornado a políticos para evitar regulaciones ambientales.",
    power: 80,
    danger: 75,
    reach: 90,
  },
  {
    id: 2,
    name: "Toxicus",
    image: require("../../assets/villanosSelection/El Demonio de la Avidez.png"),
    description:
      "Maestro de los desechos tóxicos y enemigo del medio ambiente. Sus experimentos han contaminado océanos enteros y creado zonas inhabitables en varios continentes.",
    power: 85,
    danger: 90,
    reach: 70,
  },
  {
    id: 3,
    name: "Shadowman",
    image: require("../../assets/villanosSelection/Shadowman.png"),
    description:
      "Manipulador de las sombras que opera desde las tinieblas. Nadie conoce su verdadera identidad ni sus motivaciones, pero su red de espionaje se extiende por todo el mundo.",
    power: 75,
    danger: 95,
    reach: 85,
  },
]

// -------------------- Componente ---------------------------
export default function VillainSelectionScreen({ navigation }) {
  const isFocused = useIsFocused() // ← detecta foco
  const soundRef = useRef<Audio.Sound | null>(null)
  const [dimensions, setDimensions] = useState<ScaledSize>(Dimensions.get("window"))

  const [selectedVillain, setSelectedVillain] = useState(0)
  const [animateCard, setAnimateCard] = useState(false)
  const [isPlaying, setIsPlaying] = useState(true)
  const [selectedVillainSaved, setSelectedVillainSaved] = useState(false)

  // Detect screen size changes
  useEffect(() => {
    const subscription = Dimensions.addEventListener("change", ({ window }) => {
      setDimensions(window)
    })

    return () => subscription.remove()
  }, [])

  // Calculate if device is a tablet based on screen size and pixel density
  const isTablet = useCallback(() => {
    const { width, height } = dimensions
    const screenSize = Math.sqrt(width * width + height * height) / 160
    return screenSize >= 7 // Common threshold for tablets
  }, [dimensions])

  // Get responsive size based on device type
  const getResponsiveSize = (size: number, tabletMultiplier = 1.3) => {
    return isTablet() ? size * tabletMultiplier : size
  }

  // ------------------ Audio helpers ------------------------
  const playBackgroundSound = useCallback(async () => {
    if (soundRef.current) return // ya cargado

    await Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      shouldDuckAndroid: true,
    })

    const { sound } = await Audio.Sound.createAsync(require("../../assets/SonidoJuego/SonidoFondoOriginal.mp3"), {
      isLooping: true,
      volume: 0.5,
      shouldPlay: true,
    })

    soundRef.current = sound
    setIsPlaying(true)
  }, [])

  const stopSound = useCallback(async () => {
    if (!soundRef.current) return
    await soundRef.current.stopAsync()
    await soundRef.current.unloadAsync()
    soundRef.current = null
    setIsPlaying(false)
  }, [])

  // ------------------ Control de foco ----------------------
  useEffect(() => {
    if (isFocused) playBackgroundSound()
    else stopSound()

    return () => stopSound() // limpieza al desmontar
  }, [isFocused, playBackgroundSound, stopSound])

  // ----------- Resto de lógica de componente ---------------
  useEffect(() => {
    setAnimateCard(true)
    const t = setTimeout(() => setAnimateCard(false), 300)
    return () => clearTimeout(t)
  }, [selectedVillain])

  // Cargar el villano seleccionado al iniciar
  useEffect(() => {
    const loadSelectedVillain = async () => {
      try {
        const savedVillain = await AsyncStorage.getItem("selectedVillain")
        if (savedVillain) {
          const villainInfo = JSON.parse(savedVillain)
          // Buscar el villano en la lista por ID
          const villainIndex = villains.findIndex((v) => v.id === villainInfo.id)
          if (villainIndex !== -1) {
            setSelectedVillain(villainIndex)
            setSelectedVillainSaved(true)
          }
        }
      } catch (error) {
        console.error("Error al cargar el villano:", error)
      }
    }

    loadSelectedVillain()
  }, [])

  const handleBack = () => {
    navigation?.goBack?.()
  }

  const handleVillainSelect = (index) => {
    setSelectedVillain(index)
    setSelectedVillainSaved(false) // Resetear el estado de guardado cuando se selecciona otro villano
  }

  const handleStartMission = () => {
    if (selectedVillainSaved) {
      // Si ya hay un villano guardado, ir a la pantalla de batalla
      navigation?.navigate?.("BattleScreen")
    } else {
      // Si no hay villano guardado, mostrar alerta
      Alert.alert("Selecciona un villano", "Debes seleccionar un villano antes de iniciar la misión", [
        { text: "Entendido", style: "default" },
      ])
    }
  }

  const handleMoreInfo = (villainId) => {
    alert(`Más información sobre ${villains.find((v) => v.id === villainId).name}`)
  }

  // Guardar el villano seleccionado en AsyncStorage
  const handleSelectVillain = async () => {
    try {
      const villain = villains[selectedVillain]

      // Crear un objeto con la información necesaria
      const villainInfo = {
        id: villain.id,
        name: villain.name,
        description: villain.description,
        power: villain.power,
        danger: villain.danger,
        reach: villain.reach,
      }

      // Convertir a JSON y guardar
      await AsyncStorage.setItem("selectedVillain", JSON.stringify(villainInfo))

      // Guardar el nombre del villano por separado para facilitar su acceso
      await AsyncStorage.setItem("selectedVillainName", villain.name)

      console.log(`Villano ${villain.name} guardado en AsyncStorage`)

      // Actualizar el estado para mostrar que se ha guardado
      setSelectedVillainSaved(true)

      // Mostrar confirmación al usuario
      Alert.alert("Villano seleccionado", `Has seleccionado a ${villain.name} como tu oponente`, [
        { text: "¡A luchar!", style: "default" },
      ])
    } catch (error) {
      console.error("Error al guardar el villano:", error)
      Alert.alert("Error", "No se pudo guardar el villano seleccionado", [
        { text: "Intentar de nuevo", style: "default" },
      ])
    }
  }

  // -------------------- UI --------------------------------
  return (
    <SafeAreaView style={styles.safeArea}>
      <RNStatusBar barStyle="light-content" backgroundColor="#051438" />
      <LinearGradient colors={["#051438", "#0A2463", "#1E3A8A"]} style={styles.gradient}>
        <View style={styles.container}>
          {/* Header */}
          <View
            style={[
              styles.header,
              isTablet() && {
                height: dimensions.height * 0.08,
                paddingTop: dimensions.height * 0.01,
              },
            ]}
          >
            <BackButton onPress={handleBack} />
            <Text style={[styles.title, { fontSize: getResponsiveSize(22, 1.4) }]}>SELECCIÓN DE VILLANO</Text>
            <View style={[styles.placeholder, isTablet() && { width: 50, height: 50 }]} />
          </View>

          {/* Carrusel */}
          <View
            style={[
              styles.carouselSection,
              {
                height: dimensions.height * (isTablet() ? 0.32 : 0.28),
                marginTop: dimensions.height * (isTablet() ? 0.03 : 0.02),
                marginBottom: dimensions.height * (isTablet() ? 0.03 : 0.02),
              },
            ]}
          >
            <VillainCarousel onVillainSelect={handleVillainSelect} selectedIndex={selectedVillain}>
              {villains.map((villain) => (
                <View
                  key={villain.id}
                  style={[
                    styles.villainPreview,
                    {
                      width: dimensions.width * (isTablet() ? 0.65 : 0.6),
                      height: dimensions.height * (isTablet() ? 0.26 : 0.22),
                      padding: getResponsiveSize(12),
                      borderRadius: getResponsiveSize(16),
                    },
                  ]}
                >
                  <View style={styles.imageWrapper}>
                    <Image
                      source={villain.image}
                      style={[
                        styles.villainImage,
                        {
                          width: getResponsiveSize(120, 1.5),
                          height: getResponsiveSize(120, 1.5),
                        },
                      ]}
                    />
                  </View>
                  <View
                    style={[
                      styles.nameWrapper,
                      {
                        paddingVertical: getResponsiveSize(8),
                        borderRadius: getResponsiveSize(8),
                        marginTop: getResponsiveSize(8),
                      },
                    ]}
                  >
                    <Text style={[styles.villainName, { fontSize: getResponsiveSize(16, 1.3) }]}>{villain.name}</Text>
                  </View>
                </View>
              ))}
            </VillainCarousel>
          </View>

          {/* Tarjeta */}
          <View
            style={[
              styles.cardSection,
              {
                flex: isTablet() ? 1.2 : 1,
                marginTop: dimensions.height * (isTablet() ? 0.02 : 0.01),
                marginBottom: dimensions.height * (isTablet() ? 0.03 : 0.02),
              },
            ]}
          >
            <VillainCard
              villain={villains[selectedVillain]}
              onPress={() => {}}
              onMorePress={() => handleMoreInfo(villains[selectedVillain].id)}
              onSelect={handleSelectVillain}
            />
          </View>

          {/* Botón de acción */}
          <View
            style={[
              styles.actionSection,
              {
                height: dimensions.height * (isTablet() ? 0.12 : 0.1),
                marginBottom: dimensions.height * (isTablet() ? 0.03 : 0.02),
              },
            ]}
          >
            <ActionButton
              title={selectedVillainSaved ? "¡INICIAR BATALLA!" : "SELECCIONA UN VILLANO"}
              onPress={handleStartMission}
              primary={selectedVillainSaved}
              icon={selectedVillainSaved ? "play-circle" : "alert-circle"}
              disabled={!selectedVillainSaved}
            />
          </View>
        </View>
      </LinearGradient>
    </SafeAreaView>
  )
}

// ------------------ Estilos -------------------------------
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  container: {
    flex: 1,
    padding: Dimensions.get("window").width * 0.05,
    justifyContent: "space-between",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: Dimensions.get("window").height * 0.0000000001,
    height: Dimensions.get("window").height * 0.065,
  },
  title: {
    fontWeight: "800",
    color: "#FFFFFF",
    textAlign: "center",
    letterSpacing: 1,
    textShadowColor: "rgba(0, 0, 0, 0.5)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  placeholder: {
    width: 40,
    height: 40,
  },
  carouselSection: {
    marginTop: Dimensions.get("window").height * 0.02,
    marginBottom: Dimensions.get("window").height * 0.02,
  },
  villainPreview: {
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "rgba(0, 0, 0, 0.2)",
  },
  imageWrapper: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
  },
  villainImage: {
    resizeMode: "contain",
  },
  nameWrapper: {
    width: "100%",
    backgroundColor: "rgba(0, 0, 0, 0.4)",
  },
  villainName: {
    color: "#FFFFFF",
    fontWeight: "700",
    textAlign: "center",
    textShadowColor: "rgba(0, 0, 0, 0.5)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  cardSection: {
    flex: 1,
    justifyContent: "flex-start",
    alignItems: "center",
  },
  actionSection: {
    justifyContent: "center",
    alignItems: "center",
  },
})
