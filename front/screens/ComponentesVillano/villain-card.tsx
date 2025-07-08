"use client"

import { useState } from "react"
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Animated,
  Platform,
  ActivityIndicator,
} from "react-native"
import { LinearGradient } from "expo-linear-gradient"
import { Feather } from "@expo/vector-icons"
import VillainDetails from "./VillainDetails"

const { width, height } = Dimensions.get("window")

// 🔧 FUNCIÓN RESPONSIVA PARA VILLAIN CARD
const getResponsiveCardSize = () => {
  const screenSize = Math.sqrt(width * width + height * height) / (Platform.OS === "ios" ? 163 : 160)
  const isTablet = screenSize >= 7
  const isLandscape = width > height
  const isSmallPhone = width < 350

  let cardWidth = width * 0.85
  let imageHeight = 150
  let fontSize = {
    name: 26,
    statLabel: 12,
    description: 13,
    selectText: 14,
    viewMoreText: 11,
  }

  if (isTablet) {
    cardWidth = width * 0.7
    imageHeight = 200
    fontSize = {
      name: 32,
      statLabel: 14,
      description: 15,
      selectText: 16,
      viewMoreText: 13,
    }
  } else if (isLandscape) {
    cardWidth = width * 0.6
    imageHeight = 120
    fontSize = {
      name: 22,
      statLabel: 11,
      description: 12,
      selectText: 13,
      viewMoreText: 10,
    }
  } else if (isSmallPhone) {
    cardWidth = width * 0.9
    imageHeight = 130
    fontSize = {
      name: 22,
      statLabel: 11,
      description: 12,
      selectText: 13,
      viewMoreText: 10,
    }
  }

  return { cardWidth, imageHeight, fontSize, isTablet, isLandscape, isSmallPhone }
}

export default function VillainCard({
  villain,
  onPress,
  onMorePress,
  onSelect,
  isSelected = false,
  isLoading = false,
}) {
  const { name, image, description, power, danger, reach } = villain
  const [showDescription, setShowDescription] = useState(false)
  const [animation] = useState(new Animated.Value(0))

  const { cardWidth, imageHeight, fontSize, isTablet, isLandscape } = getResponsiveCardSize()

  const toggleDescription = () => {
    const toValue = showDescription ? 0 : 1

    Animated.timing(animation, {
      toValue,
      duration: 300,
      useNativeDriver: false,
    }).start()

    setShowDescription(!showDescription)
  }

  const descriptionHeight = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, isTablet ? 120 : isLandscape ? 80 : 100],
  })

  // 🔧 OBTENER COLORES Y TEXTO DEL BOTÓN SEGÚN ESTADO
  const getButtonConfig = () => {
    if (isSelected) {
      return {
        colors: ["#3B82F6", "#1D4ED8"], // Azul para iniciar misión
        text: "¡INICIAR MISIÓN!",
        icon: "play-circle",
      }
    } else {
      return {
        colors: ["#4FD1C5", "#38B2AC"], // Verde para seleccionar
        text: "SELECCIONAR VILLANO",
        icon: "check-circle",
      }
    }
  }

  const buttonConfig = getButtonConfig()

  return (
    <TouchableOpacity style={[styles.container, { width: cardWidth }]} activeOpacity={0.9} onPress={onPress}>
      <LinearGradient
        colors={["#1A365D", "#2A4365"]}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={[styles.name, { fontSize: fontSize.name }]}>{name}</Text>
          </View>

          <View style={[styles.mainContent, isLandscape && styles.mainContentLandscape]}>
            <View style={[styles.imageContainer, { width: isLandscape ? "35%" : "40%" }]}>
              <Image source={image} style={[styles.image, { height: imageHeight }]} />
              <View style={styles.glow} />
            </View>

            <View style={[styles.infoContainer, { width: isLandscape ? "65%" : "60%" }]}>
              <View style={styles.statsContainer}>
                <View style={styles.statItem}>
                  <Text style={[styles.statLabel, { fontSize: fontSize.statLabel }]}>PODER</Text>
                  <View style={styles.statBar}>
                    <View style={[styles.statFill, { width: `${power}%` }]} />
                  </View>
                </View>

                <View style={styles.statItem}>
                  <Text style={[styles.statLabel, { fontSize: fontSize.statLabel }]}>PELIGRO</Text>
                  <View style={styles.statBar}>
                    <View style={[styles.statFill, { width: `${danger}%` }]} />
                  </View>
                </View>

                <View style={styles.statItem}>
                  <Text style={[styles.statLabel, { fontSize: fontSize.statLabel }]}>ALCANCE</Text>
                  <View style={styles.statBar}>
                    <View style={[styles.statFill, { width: `${reach}%` }]} />
                  </View>
                </View>
              </View>

              <TouchableOpacity style={styles.viewMoreButton} onPress={toggleDescription} activeOpacity={0.7}>
                <Text style={[styles.viewMoreText, { fontSize: fontSize.viewMoreText }]}>
                  {showDescription ? "OCULTAR PERFIL" : "VER PERFIL"}
                </Text>
                <Feather name={showDescription ? "chevron-up" : "chevron-down"} size={16} color="#A3BFFA" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Descripción expandible */}
          <Animated.View style={[styles.descriptionContainer, { height: descriptionHeight }]}>
            {showDescription && (
              <Text style={[styles.description, { fontSize: fontSize.description }]}>{description}</Text>
            )}
          </Animated.View>

          {/* 🔧 BOTÓN DINÁMICO QUE CAMBIA SEGÚN EL ESTADO */}
          <TouchableOpacity style={styles.selectButton} onPress={onSelect} activeOpacity={0.7} disabled={isLoading}>
            <LinearGradient
              colors={buttonConfig.colors}
              style={styles.selectGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              {isLoading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <>
                  <Feather
                    name={buttonConfig.icon}
                    size={18}
                    color={isSelected ? "#FFFFFF" : "#0F2A5F"}
                    style={styles.selectIcon}
                  />
                  <Text
                    style={[
                      styles.selectText,
                      {
                        fontSize: fontSize.selectText,
                        color: isSelected ? "#FFFFFF" : "#0F2A5F",
                      },
                    ]}
                  >
                    {buttonConfig.text}
                  </Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>

          <VillainDetails character={villain} visible={showDescription} onClose={toggleDescription} />
        </View>
      </LinearGradient>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    overflow: "hidden",
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  gradient: {
    borderRadius: 16,
    padding: 2,
  },
  content: {
    backgroundColor: "#0F2A5F",
    borderRadius: 14,
    overflow: "hidden",
    padding: 16,
  },
  header: {
    alignItems: "center",
    marginBottom: 12,
  },
  name: {
    fontWeight: "bold",
    color: "#FFFFFF",
    textShadowColor: "rgba(0, 0, 0, 0.5)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  mainContent: {
    flexDirection: "row",
    marginBottom: 12,
  },
  mainContentLandscape: {
    alignItems: "center",
  },
  imageContainer: {
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  image: {
    width: "100%",
    resizeMode: "contain",
  },
  glow: {
    position: "absolute",
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "rgba(66, 153, 225, 0.15)",
    bottom: 20,
    zIndex: -1,
  },
  infoContainer: {
    paddingLeft: 16,
    justifyContent: "space-between",
  },
  statsContainer: {
    marginBottom: 12,
  },
  statItem: {
    marginBottom: 8,
  },
  statLabel: {
    fontWeight: "600",
    color: "#A3BFFA",
    marginBottom: 4,
  },
  statBar: {
    height: 6,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 3,
    overflow: "hidden",
  },
  statFill: {
    height: "100%",
    backgroundColor: "#4FD1C5",
    borderRadius: 3,
  },
  viewMoreButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0, 0, 0, 0.2)",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 12,
    alignSelf: "center",
  },
  viewMoreText: {
    fontWeight: "600",
    color: "#A3BFFA",
    marginRight: 4,
  },
  descriptionContainer: {
    backgroundColor: "rgba(0, 0, 0, 0.2)",
    borderRadius: 10,
    padding: 10,
    marginBottom: 12,
    overflow: "hidden",
  },
  description: {
    color: "#E2E8F0",
    lineHeight: 18,
  },
  selectButton: {
    width: "100%",
    height: 44,
    borderRadius: 22,
    overflow: "hidden",
    marginTop: 10,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  selectGradient: {
    width: "100%",
    height: "100%",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  selectIcon: {
    marginRight: 8,
  },
  selectText: {
    fontWeight: "bold",
    letterSpacing: 0.5,
  },
})
