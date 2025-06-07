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
  Platform,
} from "react-native"
import { LinearGradient } from "expo-linear-gradient"
import { Audio } from "expo-av"
import { useIsFocused } from "@react-navigation/native"
import AsyncStorage from "@react-native-async-storage/async-storage"

import BackButton from "../ComponentesVillano/UI/back-button"
import VillainCarousel from "../ComponentesVillano/villain-carousel"
import VillainCard from "../ComponentesVillano/villain-card"

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
  const isFocused = useIsFocused()
  const soundRef = useRef<Audio.Sound | null>(null)
  const [dimensions, setDimensions] = useState<ScaledSize>(Dimensions.get("window"))

  const [selectedVillain, setSelectedVillain] = useState(0)
  const [animateCard, setAnimateCard] = useState(false)
  const [isPlaying, setIsPlaying] = useState(true)
  const [selectedVillainSaved, setSelectedVillainSaved] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  // Detect screen size changes
  useEffect(() => {
    const subscription = Dimensions.addEventListener("change", ({ window }) => {
      setDimensions(window)
    })

    return () => subscription.remove()
  }, [])

  // 🔧 CÁLCULOS RESPONSIVOS MEJORADOS
  const deviceInfo = useCallback(() => {
    const { width, height } = dimensions
    const aspectRatio = width / height
    const isLandscape = width > height

    // Detectar tipo de dispositivo basado en múltiples factores
    const screenSize = Math.sqrt(width * width + height * height) / (Platform.OS === "ios" ? 163 : 160)
    const isTablet = screenSize >= 7
    const isSmallPhone = width < 350 || height < 600
    const isLargePhone = width > 400 && !isTablet

    return {
      width,
      height,
      isTablet,
      isLandscape,
      isSmallPhone,
      isLargePhone,
      aspectRatio,
      screenSize,
    }
  }, [dimensions])

  // 🔧 FUNCIÓN DE TAMAÑO RESPONSIVO MEJORADA
  const getResponsiveSize = useCallback(
    (baseSize: number, options = {}) => {
      const device = deviceInfo()
      const {
        tabletMultiplier = 1.4,
        landscapeMultiplier = 0.8,
        smallPhoneMultiplier = 0.85,
        largePhoneMultiplier = 1.1,
      } = options

      let size = baseSize

      if (device.isTablet) {
        size *= tabletMultiplier
      } else if (device.isLargePhone) {
        size *= largePhoneMultiplier
      } else if (device.isSmallPhone) {
        size *= smallPhoneMultiplier
      }

      if (device.isLandscape) {
        size *= landscapeMultiplier
      }

      return Math.round(size)
    },
    [deviceInfo],
  )

  // 🔧 CÁLCULOS DE LAYOUT RESPONSIVOS
  const getLayoutDimensions = useCallback(() => {
    const device = deviceInfo()
    const { width, height } = device

    // Padding responsivo
    const horizontalPadding = device.isTablet ? width * 0.08 : device.isSmallPhone ? width * 0.04 : width * 0.05

    // Alturas de secciones responsivas
    const headerHeight = device.isTablet ? height * 0.08 : device.isLandscape ? height * 0.12 : height * 0.07

    const carouselHeight = device.isTablet ? height * 0.35 : device.isLandscape ? height * 0.45 : height * 0.28

    // Espacio disponible para la card - Ahora más grande ya que no tenemos botón inferior
    const availableCardHeight = height - headerHeight - carouselHeight - horizontalPadding * 2

    return {
      horizontalPadding,
      headerHeight,
      carouselHeight,
      availableCardHeight,
    }
  }, [deviceInfo])

  // ------------------ Audio helpers ------------------------
  const playBackgroundSound = useCallback(async () => {
    if (soundRef.current) return

    try {
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
    } catch (error) {
      console.error("Error al cargar audio:", error)
    }
  }, [])

  const stopSound = useCallback(async () => {
    if (!soundRef.current) return
    try {
      await soundRef.current.stopAsync()
      await soundRef.current.unloadAsync()
      soundRef.current = null
      setIsPlaying(false)
    } catch (error) {
      console.error("Error al detener audio:", error)
    }
  }, [])

  // ------------------ Control de foco ----------------------
  useEffect(() => {
    if (isFocused) playBackgroundSound()
    else stopSound()

    return () => stopSound()
  }, [isFocused, playBackgroundSound, stopSound])

  // ----------- Resto de lógica de componente ---------------
  useEffect(() => {
    setAnimateCard(true)
    const t = setTimeout(() => setAnimateCard(false), 300)
    return () => clearTimeout(t)
  }, [selectedVillain])

  // 🔧 LIMPIAR ESTADO AL ENTRAR A LA PANTALLA
  useEffect(() => {
    const initializeScreen = async () => {
      try {
        // 🔧 LIMPIAR ESTADO DE SELECCIÓN PREVIA
        console.log("🧹 Limpiando estado de selección previa...")
        await AsyncStorage.removeItem("selectedVillain")
        await AsyncStorage.removeItem("selectedVillainName")
        await AsyncStorage.removeItem("selectedVillainId")
        await AsyncStorage.removeItem("villainSelectionComplete")

        // 🔧 ASEGURAR QUE SIEMPRE EMPIECE CON "SELECCIONAR VILLANO"
        setSelectedVillainSaved(false)
        setSelectedVillain(0) // Empezar siempre con el primer villano

        console.log("✅ Estado inicial limpio - Botón mostrará 'SELECCIONAR VILLANO'")
      } catch (error) {
        console.error("Error al limpiar estado inicial:", error)
      }
    }

    initializeScreen()
  }, []) // Solo se ejecuta una vez al montar el componente

  const handleBack = () => {
    navigation?.goBack?.()
  }

  // 🔧 FUNCIÓN ORIGINAL DEL CARRUSEL - SIN CAMBIOS
  const handleVillainSelect = (index) => {
    setSelectedVillain(index)
    // 🔧 ASEGURAR QUE AL CAMBIAR VILLANO, EL BOTÓN VUELVA A "SELECCIONAR"
    setSelectedVillainSaved(false)
  }

  // 🎯 FUNCIÓN ACTUALIZADA PARA NAVEGAR A MISSIONGAMESCREEN
  const handleStartMission = async () => {
    try {
      setIsLoading(true)

      await AsyncStorage.multiSet([
        ["gameMode", "mission"],
        ["battleReady", "true"],
        ["missionStarted", "true"],
        ["gameState", "starting_mission"],
      ])

      console.log("🎮 Iniciando misión con villano:", villains[selectedVillain].name)
      console.log("🚀 Navegando a MissionGameScreen...")

      // Pequeño retraso para mostrar el estado de carga
      await new Promise((resolve) => setTimeout(resolve, 800))

      navigation?.navigate?.("MissionGameScreen")
      console.log("✅ Navegación a MissionGameScreen ejecutada")
    } catch (error) {
      console.error("❌ Error al iniciar misión:", error)
      Alert.alert("Error", "No se pudo iniciar la misión", [
        { text: "Reintentar", onPress: handleStartMission },
        { text: "Cancelar", style: "cancel" },
      ])
    } finally {
      setIsLoading(false)
    }
  }

  // 🎯 FUNCIÓN MEJORADA PARA GUARDAR VILLANO
  const handleSelectVillain = async () => {
    try {
      setIsLoading(true)
      const villain = villains[selectedVillain]

      const villainInfo = {
        id: villain.id,
        name: villain.name,
        description: villain.description,
        power: villain.power,
        danger: villain.danger,
        reach: villain.reach,
        image: villain.image,
        selectedAt: new Date().toISOString(),
      }

      await AsyncStorage.multiSet([
        ["selectedVillain", JSON.stringify(villainInfo)],
        ["selectedVillainName", villain.name],
        ["selectedVillainId", villain.id.toString()],
        ["villainSelectionComplete", "true"],
      ])

      // Pequeño retraso para mostrar el estado de carga
      await new Promise((resolve) => setTimeout(resolve, 600))

      console.log(`✅ Villano ${villain.name} guardado completamente en AsyncStorage`)

      // 🔧 CAMBIAR ESTADO A "INICIAR MISIÓN"
      setSelectedVillainSaved(true)

      Alert.alert(
        "Villano seleccionado",
        `Has seleccionado a ${villain.name} como tu oponente.\n\n¡Prepárate para la misión!`,
        [{ text: "¡A la batalla!", style: "default" }],
      )
    } catch (error) {
      console.error("❌ Error al guardar el villano:", error)
      Alert.alert("Error", "No se pudo guardar el villano seleccionado", [
        { text: "Intentar de nuevo", onPress: handleSelectVillain },
        { text: "Cancelar", style: "cancel" },
      ])
    } finally {
      setIsLoading(false)
    }
  }

  // 🎯 FUNCIÓN PARA MANEJAR LA ACCIÓN DEL BOTÓN PRINCIPAL
  const handleMainButtonAction = async () => {
    // Si ya hay un villano seleccionado, iniciamos la misión
    if (selectedVillainSaved) {
      await handleStartMission()
    }
    // Si no hay villano seleccionado, lo seleccionamos
    else {
      await handleSelectVillain()
    }
  }

  // 🔧 OBTENER DIMENSIONES DE LAYOUT
  const layout = getLayoutDimensions()
  const device = deviceInfo()

  // -------------------- UI --------------------------------
  return (
    <SafeAreaView style={styles.safeArea}>
      <RNStatusBar barStyle="light-content" backgroundColor="#051438" />
      <LinearGradient colors={["#051438", "#0A2463", "#1E3A8A"]} style={styles.gradient}>
        <View style={[styles.container, { paddingHorizontal: layout.horizontalPadding }]}>
          {/* 🔧 HEADER RESPONSIVO */}
          <View style={[styles.header, { height: layout.headerHeight }]}>
            <BackButton onPress={handleBack} />
            <Text
              style={[
                styles.title,
                {
                  fontSize: getResponsiveSize(device.isLandscape ? 18 : 22, {
                    tabletMultiplier: 1.3,
                    smallPhoneMultiplier: 0.9,
                  }),
                },
              ]}
            >
              SELECCIÓN DE VILLANO
            </Text>
            <View
              style={[
                styles.placeholder,
                {
                  width: getResponsiveSize(40),
                  height: getResponsiveSize(40),
                },
              ]}
            />
          </View>

          {/* 🔧 CARRUSEL RESPONSIVO */}
          <View
            style={[
              styles.carouselSection,
              {
                height: layout.carouselHeight,
                marginVertical: getResponsiveSize(device.isLandscape ? 8 : 12),
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
                      width: device.width * (device.isTablet ? 0.65 : device.isLandscape ? 0.5 : 0.6),
                      height: layout.carouselHeight * 0.85,
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
                          width: getResponsiveSize(device.isLandscape ? 100 : 120, {
                            tabletMultiplier: 1.5,
                            smallPhoneMultiplier: 0.8,
                          }),
                          height: getResponsiveSize(device.isLandscape ? 100 : 120, {
                            tabletMultiplier: 1.5,
                            smallPhoneMultiplier: 0.8,
                          }),
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
                    <Text
                      style={[
                        styles.villainName,
                        {
                          fontSize: getResponsiveSize(device.isLandscape ? 14 : 16, {
                            tabletMultiplier: 1.3,
                            smallPhoneMultiplier: 0.9,
                          }),
                        },
                      ]}
                    >
                      {villain.name}
                    </Text>
                  </View>
                </View>
              ))}
            </VillainCarousel>
          </View>

          {/* 🔧 TARJETA RESPONSIVA CON BOTÓN DINÁMICO */}
          <View
            style={[
              styles.cardSection,
              {
                height: layout.availableCardHeight,
                marginVertical: getResponsiveSize(device.isLandscape ? 8 : 12),
              },
            ]}
          >
            <VillainCard
              villain={villains[selectedVillain]}
              onPress={() => {}}
              onMorePress={() => {}}
              onSelect={handleMainButtonAction}
              isSelected={selectedVillainSaved}
              isLoading={isLoading}
            />
          </View>
        </View>
      </LinearGradient>
    </SafeAreaView>
  )
}

// 🔧 ESTILOS RESPONSIVOS MEJORADOS
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  container: {
    flex: 1,
    justifyContent: "space-between",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: Platform.OS === "android" ? 10 : 0,
  },
  title: {
    fontWeight: "800",
    color: "#FFFFFF",
    textAlign: "center",
    letterSpacing: 1,
    textShadowColor: "rgba(0, 0, 0, 0.5)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
    flex: 1,
  },
  placeholder: {
    // Placeholder para mantener el balance del header
  },
  carouselSection: {
    justifyContent: "center",
    alignItems: "center",
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
    justifyContent: "flex-start",
    alignItems: "center",
    flex: 1,
  },
})
