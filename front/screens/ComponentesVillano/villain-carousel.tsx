"use client"

import React, { useRef, useState, useEffect } from "react"
import { View, Animated, PanResponder, StyleSheet, Dimensions, TouchableOpacity, Text } from "react-native"
import { Feather } from "@expo/vector-icons"

const { width } = Dimensions.get("window")
const SWIPE_THRESHOLD = 120

export default function VillainCarousel({ children, onVillainSelect, selectedIndex = 0 }) {
  const [currentIndex, setCurrentIndex] = useState(selectedIndex)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const position = useRef(new Animated.Value(0)).current
  const childrenArray = React.Children.toArray(children)
  const childrenCount = childrenArray.length

  /* ────────────────  GESTOS  ──────────────── */
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => !isTransitioning,
      onPanResponderMove: (_, g) => {
        if ((currentIndex === 0 && g.dx > 0) || (currentIndex === childrenCount - 1 && g.dx < 0)) {
          position.setValue(g.dx / 3) // Resistance at edges
        } else {
          position.setValue(g.dx)
        }
      },
      onPanResponderRelease: (_, g) => {
        if (g.dx < -SWIPE_THRESHOLD && currentIndex < childrenCount - 1) {
          animateTransition(1)
        } else if (g.dx > SWIPE_THRESHOLD && currentIndex > 0) {
          animateTransition(-1)
        } else {
          resetPosition()
        }
      },
    }),
  ).current

  /* ────────────────  SINCRONIZACIÓN EXTERNA  ──────────────── */
  useEffect(() => {
    if (selectedIndex !== currentIndex && !isTransitioning) {
      const direction = selectedIndex > currentIndex ? 1 : -1

      // Set transitioning state
      setIsTransitioning(true)

      // Prepare for animation
      position.setValue(-direction * width)

      // Update indices
      setCurrentIndex(selectedIndex)

      // Animate to new position
      Animated.spring(position, {
        toValue: 0,
        tension: 40,
        friction: 8,
        useNativeDriver: true,
      }).start(() => {
        setIsTransitioning(false)
      })
    }
  }, [selectedIndex])

  /* ────────────────  TRANSICIÓN  ──────────────── */
  const animateTransition = (direction) => {
    if (isTransitioning) return

    const newIndex = currentIndex + direction
    if (newIndex < 0 || newIndex >= childrenCount) {
      return resetPosition()
    }

    // Set transitioning state
    setIsTransitioning(true)

    // Notify parent component
    if (onVillainSelect) {
      onVillainSelect(newIndex)
    }

    // Animate slide out
    Animated.timing(position, {
      toValue: -direction * width,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      // Update index after animation
      setCurrentIndex(newIndex)

      // Reset position without animation
      position.setValue(0)

      // End transition state
      setIsTransitioning(false)
    })
  }

  const resetPosition = () => {
    Animated.spring(position, {
      toValue: 0,
      tension: 40,
      friction: 8,
      useNativeDriver: true,
    }).start()
  }

  /* ────────────────  Paginación manual  ──────────────── */
  const goToIndex = (index) => {
    if (index === currentIndex || isTransitioning) return

    const direction = index > currentIndex ? 1 : -1

    // Set transitioning state
    setIsTransitioning(true)

    // Notify parent component
    if (onVillainSelect) {
      onVillainSelect(index)
    }

    // Prepare animation from correct direction
    position.setValue(-direction * width)

    // Update index
    setCurrentIndex(index)

    // Animate to center
    Animated.spring(position, {
      toValue: 0,
      tension: 40,
      friction: 8,
      useNativeDriver: true,
    }).start(() => {
      setIsTransitioning(false)
    })
  }

  /* ────────────────  RENDER  ──────────────── */
  const getCardStyle = () => {
    // Create interpolated values for transform and opacity
    const rotate = position.interpolate({
      inputRange: [-width, 0, width],
      outputRange: ["8deg", "0deg", "-8deg"],
      extrapolate: "clamp",
    })

    return {
      transform: [{ translateX: position }, { rotate }],
    }
  }

  return (
    <View style={styles.container}>
      {/* Indicador de navegación superior */}
      <View style={styles.navigationIndicator}>
        <Text style={styles.navigationText}>
          {currentIndex + 1} / {childrenCount}
        </Text>
      </View>

      {/* Área principal */}
      <View style={styles.carouselArea}>
        <TouchableOpacity
          style={[
            styles.navButton,
            styles.leftButton,
            (currentIndex === 0 || isTransitioning) && styles.disabledButton,
          ]}
          onPress={() => currentIndex > 0 && !isTransitioning && animateTransition(-1)}
          disabled={currentIndex === 0 || isTransitioning}
          activeOpacity={0.7}
        >
          <Feather
            name="chevron-left"
            size={24}
            color={currentIndex === 0 || isTransitioning ? "rgba(255,255,255,0.3)" : "#FFF"}
          />
        </TouchableOpacity>

        <View style={styles.villainContainer}>
          <Animated.View style={[styles.card, getCardStyle()]} {...(isTransitioning ? {} : panResponder.panHandlers)}>
            {childrenArray[currentIndex]}
          </Animated.View>
        </View>

        <TouchableOpacity
          style={[
            styles.navButton,
            styles.rightButton,
            (currentIndex === childrenCount - 1 || isTransitioning) && styles.disabledButton,
          ]}
          onPress={() => currentIndex < childrenCount - 1 && !isTransitioning && animateTransition(1)}
          disabled={currentIndex === childrenCount - 1 || isTransitioning}
          activeOpacity={0.7}
        >
          <Feather
            name="chevron-right"
            size={24}
            color={currentIndex === childrenCount - 1 || isTransitioning ? "rgba(255,255,255,0.3)" : "#FFF"}
          />
        </TouchableOpacity>
      </View>

      {/* Paginación inferior */}
      <View style={styles.pagination}>
        {childrenArray.map((_, i) => (
          <TouchableOpacity
            key={i}
            style={[styles.paginationDot, currentIndex === i && styles.paginationDotActive]}
            onPress={() => goToIndex(i)}
            disabled={isTransitioning}
            activeOpacity={0.7}
          />
        ))}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  navigationIndicator: {
    position: "absolute",
    top: 10,
    backgroundColor: "rgba(0,0,0,0.3)",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    zIndex: 10,
  },
  navigationText: {
    color: "#FFF",
    fontWeight: "600",
    fontSize: 12,
  },
  carouselArea: {
    flex: 1,
    width,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  villainContainer: {
    width: width * 0.7,
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  card: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  navButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(0,0,0,0.3)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
  },
  leftButton: {
    marginRight: 10,
  },
  rightButton: {
    marginLeft: 10,
  },
  disabledButton: {
    opacity: 0.5,
  },
  pagination: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
    height: 20,
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "rgba(255,255,255,0.3)",
    marginHorizontal: 4,
  },
  paginationDotActive: {
    backgroundColor: "#FFF",
    width: 10,
    height: 10,
    borderRadius: 5,
  },
})
