"use client"

import type React from "react"
import { useRef, useEffect, useState } from "react"
import { View, Text, StyleSheet, TouchableOpacity, Animated, Dimensions, Easing } from "react-native"
import { LinearGradient } from "expo-linear-gradient"
import { Feather } from "@expo/vector-icons"
import { BlurView } from "expo-blur"
import type { Character } from "./types"
import CharacterDetailsDialog from "./CharacterDetailsDialog"

const { width, height } = Dimensions.get("window")

interface CharacterDisplayProps {
  character: Character
  imageSize?: {
    width: number
    height: number
  }
  onSelect?: () => void
}

const CharacterDisplay: React.FC<CharacterDisplayProps> = ({ character, imageSize, onSelect = () => {} }) => {
  const [showDetailsDialog, setShowDetailsDialog] = useState(false)
  const floatAnim = useRef(new Animated.Value(0)).current
  const rotateAnim = useRef(new Animated.Value(0)).current
  const glowAnim = useRef(new Animated.Value(0)).current
  const scaleAnim = useRef(new Animated.Value(0.95)).current
  const buttonScaleAnim = useRef(new Animated.Value(1)).current
  const particleAnim = useRef(new Animated.Value(0)).current

  useEffect(() => {
    // Initial entrance animation
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 8,
      tension: 40,
      useNativeDriver: true,
    }).start()

    // Floating animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: 1,
          duration: 2000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 2000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    ).start()

    // Rotation animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 4000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(rotateAnim, {
          toValue: 0,
          duration: 4000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    ).start()

    // Glow animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: false,
        }),
        Animated.timing(glowAnim, {
          toValue: 0.3,
          duration: 1500,
          useNativeDriver: false,
        }),
      ]),
    ).start()

    // Particle animation
    Animated.loop(
      Animated.timing(particleAnim, {
        toValue: 1,
        duration: 3000,
        useNativeDriver: true,
      }),
    ).start()
  }, [])

  const handlePressIn = () => {
    Animated.spring(buttonScaleAnim, {
      toValue: 0.95,
      friction: 5,
      tension: 40,
      useNativeDriver: true,
    }).start()
  }

  const handlePressOut = () => {
    Animated.spring(buttonScaleAnim, {
      toValue: 1,
      friction: 3,
      tension: 40,
      useNativeDriver: true,
    }).start()
  }

  const translateY = floatAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -15],
  })

  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["-2deg", "2deg"],
  })

  const particleTranslateY = particleAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -height * 0.2],
  })

  const particleOpacity = particleAnim.interpolate({
    inputRange: [0, 0.7, 1],
    outputRange: [0, 0.8, 0],
  })

  const backgroundColors = character.background || ["#6A3093", "#A044FF"]
  const rarityBorderColor =
    character.rarity === "legendary"
      ? "#FFD700"
      : character.rarity === "epic"
        ? "#9B59B6"
        : character.rarity === "rare"
          ? "#3498DB"
          : "#7F8C8D"

  return (
    <View style={styles.container}>
      <LinearGradient colors={backgroundColors} style={styles.background} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
        {/* Particle effects */}
        {[...Array(8)].map((_, i) => (
          <Animated.View
            key={i}
            style={[
              styles.particle,
              {
                left: `${10 + i * 10}%`,
                width: 4 + (i % 3) * 2,
                height: 4 + (i % 3) * 2,
                opacity: particleOpacity,
                transform: [{ translateY: particleTranslateY }, { scale: 0.5 + (i % 5) * 0.2 }],
              },
            ]}
          />
        ))}

        <View style={styles.header}>
          <TouchableOpacity style={styles.seeMoreButton} onPress={() => setShowDetailsDialog(true)} activeOpacity={0.7}>
            <Feather name="info" size={14} color="#FFFFFF" style={styles.infoIcon} />
            <Text style={styles.seeMoreText}>See More</Text>
          </TouchableOpacity>
          <View style={styles.rarityBadge}>
            <Text style={styles.rarityText}>{character.rarity || "COMÚN"}</Text>
          </View>
        </View>

        <View style={styles.characterContainer}>
          <Animated.View
            style={[
              styles.glowEffect,
              {
                opacity: glowAnim,
                backgroundColor: backgroundColors[0],
              },
            ]}
          />

          <View style={[styles.characterFrame, { borderColor: rarityBorderColor }]}>
            <Animated.Image
              source={character.image}
              style={[
                styles.characterImage,
                imageSize && {
                  width: imageSize.width,
                  height: imageSize.height,
                },
                {
                  transform: [{ translateY }, { rotate }, { scale: scaleAnim }],
                },
              ]}
            />
          </View>

          {/* Element icon or special effect */}
          {character.element && (
            <View style={styles.elementBadge}>
              <Feather
                name={
                  character.element === "fire"
                    ? "flame"
                    : character.element === "water"
                      ? "droplet"
                      : character.element === "earth"
                        ? "shield"
                        : character.element === "air"
                          ? "wind"
                          : "zap"
                }
                size={16}
                color="#FFFFFF"
              />
            </View>
          )}
        </View>

        <BlurView intensity={20} style={styles.statsBlurContainer} tint="dark">
          <Text style={styles.characterName}>{character.name || "Héroe"}</Text>
          <Text style={styles.characterClass}>{character.class || "Aventurero"}</Text>

          <View style={styles.statsGrid}>
            <StatBar label="FUE" value={character.stats?.strength || 75} color="#FF5252" icon="award" />
            <StatBar label="SAB" value={character.stats?.wisdom || 80} color="#40C4FF" icon="book" />
            <StatBar label="AGI" value={character.stats?.agility || 85} color="#69F0AE" icon="wind" />
            <StatBar label="DEF" value={character.stats?.defense || 70} color="#FFAB40" icon="shield" />
          </View>

          {character.abilities && (
            <View style={styles.abilitiesContainer}>
              {character.abilities.map((ability, index) => (
                <View key={index} style={styles.abilityBadge}>
                  <Feather name="zap" size={12} color="#FFD700" />
                  <Text style={styles.abilityText}>{ability}</Text>
                </View>
              ))}
            </View>
          )}
        </BlurView>

        <TouchableOpacity
          style={styles.selectButtonContainer}
          activeOpacity={0.9}
          onPress={onSelect}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
        >
          <Animated.View style={{ transform: [{ scale: buttonScaleAnim }], width: "100%" }}>
            <LinearGradient
              colors={["#FFD700", "#FFA500"]}
              style={styles.gradientButton}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Feather name="check-circle" size={21} color="#4A2C00" style={styles.buttonIcon} />
              <Text style={styles.selectButtonText}>SELECCIONAR</Text>
            </LinearGradient>
          </Animated.View>
        </TouchableOpacity>

        {/* Character Details Dialog */}
        <CharacterDetailsDialog
          character={character}
          visible={showDetailsDialog}
          onClose={() => setShowDetailsDialog(false)}
        />
      </LinearGradient>
    </View>
  )
}

// StatBar helper component
const StatBar = ({ label, value, color, icon }) => {
  return (
    <View style={styles.statBarContainer}>
      <View style={styles.labelContainer}>
        <Feather name={icon} size={14} color={color} />
        <Text style={styles.statLabel}>{label}</Text>
      </View>
      <View style={styles.barContainer}>
        <View
          style={[
            styles.barFill,
            {
              width: `${value}%`,
              backgroundColor: color,
            },
          ]}
        >
          <View style={styles.barGlow} />
        </View>
      </View>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
    borderRadius: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 10,
  },
  background: {
    flex: 1,
    width: "100%",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 20,
    paddingBottom: 20,
    borderRadius: 24,
  },
  header: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  seeMoreButton: {
    backgroundColor: "rgba(0,0,0,0.6)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    flexDirection: "row",
    alignItems: "center",
  },
  infoIcon: {
    marginRight: 5,
  },
  seeMoreText: {
    color: "#FFFFFF",
    fontWeight: "bold",
    fontSize: 12,
  },
  rarityBadge: {
    backgroundColor: "rgba(0,0,0,0.6)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "rgba(255,215,0,0.3)",
  },
  rarityText: {
    color: "#FFD700",
    fontWeight: "bold",
    fontSize: 12,
    textTransform: "uppercase",
  },
  characterContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
    width: "100%",
  },
  characterFrame: {
    borderWidth: 3,
    borderColor: "#FFD700",
    borderRadius: 150,
    padding: 5,
    backgroundColor: "rgba(0,0,0,0.3)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 10,
  },
  glowEffect: {
    position: "absolute",
    width: 220,
    height: 220,
    borderRadius: 110,
    opacity: 0.5,
    transform: [{ scale: 1.5 }],
    zIndex: 0,
  },
  characterImage: {
    width: width * 0.5,
    height: height * 0.35,
    resizeMode: "contain",
    zIndex: 1,
  },
  elementBadge: {
    position: "absolute",
    bottom: 10,
    right: width * 0.25,
    backgroundColor: "rgba(0,0,0,0.7)",
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.3)",
    zIndex: 3,
  },
  statsBlurContainer: {
    width: "90%",
    borderRadius: 20,
    padding: 12, // Reducido de 15
    marginBottom: 10, // Reducido de 15
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  characterName: {
    color: "#FFFFFF",
    fontWeight: "bold",
    fontSize: 24, // Reducido de 28
    textAlign: "center",
    marginBottom: 2, // Reducido de 5
    textShadowColor: "rgba(0,0,0,0.5)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  characterClass: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 14, // Reducido de 16
    textAlign: "center",
    marginBottom: 10, // Reducido de 15
    fontStyle: "italic",
  },
  statsGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10, // Reducido de 15
  },
  statBarContainer: {
    width: "23%",
    marginBottom: 0, // Añadido para reducir espacio
  },
  labelContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  statLabel: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "bold",
    marginLeft: 4,
  },
  barContainer: {
    height: 8,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 4,
    overflow: "hidden",
    marginBottom: 2,
  },
  barFill: {
    height: "100%",
    borderRadius: 4,
    position: "relative",
  },
  barGlow: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: "50%",
    backgroundColor: "rgba(255,255,255,0.4)",
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
  },
  statValue: {
    color: "#FFFFFF",
    fontSize: 12,
    textAlign: "right",
    fontWeight: "bold",
  },
  abilitiesContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    marginTop: 5,
  },
  abilityBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
    paddingHorizontal: 10, // Reducido de 12
    paddingVertical: 4, // Reducido de 6
    borderRadius: 15,
    marginHorizontal: 3, // Reducido de 5
    marginBottom: 3, // Reducido de 5
    borderWidth: 1,
    borderColor: "rgba(255,215,0,0.3)",
  },
  abilityText: {
    color: "#FFFFFF",
    marginLeft: 5,
    fontSize: 12,
  },
  selectButtonContainer: {
    width: "80%",
    height: 45, // Reducido de 50
    borderRadius: 22.5, // Ajustado a la mitad de la altura
    overflow: "hidden",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    marginLeft: -40,
    shadowRadius: 5,
    marginTop: 5, // Añadido para reducir espacio
  },
  gradientButton: {
    width: "100%",
    height: "100%",
    flexDirection: "row",
    justifyContent: "flex-start",
    alignItems: "center",
    borderRadius: 25,
  },
  buttonIcon: {
    marginRight: 8,
  },
  selectButtonText: {
    color: "#4A2C00",
    fontWeight: "bold",
    fontSize: 18,
    letterSpacing: 1,
  },
  particle: {
    position: "absolute",
    backgroundColor: "#FFFFFF",
    borderRadius: 50,
    zIndex: 1,
  },
})

export default CharacterDisplay
