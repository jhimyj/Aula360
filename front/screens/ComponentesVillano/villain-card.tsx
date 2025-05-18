"use client"

import { useState } from "react"
import { View, Text, Image, StyleSheet, TouchableOpacity, Dimensions, Animated } from "react-native"
import { LinearGradient } from "expo-linear-gradient"
import { Feather } from "@expo/vector-icons"

const { width } = Dimensions.get("window")

export default function VillainCard({ villain, onPress, onMorePress, onSelect }) {
  const { name, image, description, power, danger, reach } = villain
  const [showDescription, setShowDescription] = useState(false)
  const [animation] = useState(new Animated.Value(0))

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
    outputRange: [0, 100],
  })

  return (
    <TouchableOpacity style={styles.container} activeOpacity={0.9} onPress={onPress}>
      <LinearGradient
        colors={["#1A365D", "#2A4365"]}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.name}>{name}</Text>
          </View>

          <View style={styles.mainContent}>
            <View style={styles.imageContainer}>
              <Image source={image} style={styles.image} />
              <View style={styles.glow} />
            </View>

            <View style={styles.infoContainer}>
              <View style={styles.statsContainer}>
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>PODER</Text>
                  <View style={styles.statBar}>
                    <View style={[styles.statFill, { width: `${power}%` }]} />
                  </View>
                </View>

                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>PELIGRO</Text>
                  <View style={styles.statBar}>
                    <View style={[styles.statFill, { width: `${danger}%` }]} />
                  </View>
                </View>

                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>ALCANCE</Text>
                  <View style={styles.statBar}>
                    <View style={[styles.statFill, { width: `${reach}%` }]} />
                  </View>
                </View>
              </View>

              <TouchableOpacity style={styles.viewMoreButton} onPress={toggleDescription} activeOpacity={0.7}>
                <Text style={styles.viewMoreText}>{showDescription ? "OCULTAR PERFIL" : "VER PERFIL"}</Text>
                <Feather name={showDescription ? "chevron-up" : "chevron-down"} size={16} color="#A3BFFA" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Descripción expandible */}
          <Animated.View style={[styles.descriptionContainer, { height: descriptionHeight }]}>
            {showDescription && <Text style={styles.description}>{description}</Text>}
          </Animated.View>

          {/* Botón de selección */}
          <TouchableOpacity 
            style={styles.selectButton} 
            onPress={onSelect}
            activeOpacity={0.7}
          >
            <LinearGradient
              colors={["#4FD1C5", "#38B2AC"]}
              style={styles.selectGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Feather name="check-circle" size={18} color="#0F2A5F" style={styles.selectIcon} />
              <Text style={styles.selectText}>SELECCIONAR VILLANO</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  container: {
    width: width * 0.85,
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
    fontSize: 26,
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
  imageContainer: {
    width: "40%",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  image: {
    width: "100%",
    height: 150,
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
    width: "60%",
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
    fontSize: 12,
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
    fontSize: 11,
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
    fontSize: 13,
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
    color: "#0F2A5F",
    fontWeight: "bold",
    fontSize: 14,
    letterSpacing: 0.5,
  },
})
