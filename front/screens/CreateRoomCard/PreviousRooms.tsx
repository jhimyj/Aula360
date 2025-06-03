"use client"

import React from "react"
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from "react-native"
import { Feather } from "@expo/vector-icons"
import RoomCard from "../CreateRoomCard/RoomCard"

// Hook para dimensiones responsivas
const useResponsiveDimensions = () => {
  const [dimensions, setDimensions] = React.useState(Dimensions.get("window"))

  React.useEffect(() => {
    const subscription = Dimensions.addEventListener("change", ({ window }) => {
      setDimensions(window)
    })

    return () => subscription?.remove()
  }, [])

  const { width, height } = dimensions

  return {
    width,
    height,
    isTablet: width >= 768,
    isLandscape: width > height,
    isSmallScreen: width < 350,
    scale: width / 375, // Base scale factor (iPhone 6/7/8 width)

    // Funciones de escalado responsivo
    wp: (percentage: number) => (width * percentage) / 100,
    hp: (percentage: number) => (height * percentage) / 100,
    fontSize: (size: number) => Math.round(size * (width / 375)),
    spacing: (size: number) => Math.round(size * (width / 375)),
  }
}

export default function PreviousRooms({
  rooms,
  onViewAll,
  showViewAll = true,
  onViewMore,
  onEdit,
  onDelete,
  onViewQuestions,
  onUploadEvaluation,
}) {
  const dimensions = useResponsiveDimensions()
  const responsiveStyles = createResponsiveStyles(dimensions)

  // Si no hay salas, no mostrar nada
  if (!rooms || rooms.length === 0) {
    return null
  }

  return (
    <View style={responsiveStyles.previousRoomsSection}>
      <View style={responsiveStyles.sectionHeader}>
        <Text style={responsiveStyles.sectionTitle}>Salas previas</Text>
        {showViewAll && (
          <TouchableOpacity style={responsiveStyles.viewAllButton} onPress={onViewAll} activeOpacity={0.7}>
            <Text style={responsiveStyles.viewAllText}>Ver todas</Text>
            <Feather name="chevron-right" size={dimensions.fontSize(16)} color="#4361EE" />
          </TouchableOpacity>
        )}
      </View>

      {rooms.map((room) => (
        <RoomCard
          key={room.id}
          room={room}
          onViewMore={onViewMore}
          onEdit={onEdit}
          onDelete={onDelete}
          onViewQuestions={onViewQuestions}
          onUploadEvaluation={onUploadEvaluation}
          dimensions={dimensions}
        />
      ))}
    </View>
  )
}

// Función para crear estilos responsivos
const createResponsiveStyles = (dimensions) => {
  const { width, isTablet, isSmallScreen, fontSize, spacing } = dimensions

  return StyleSheet.create({
    previousRoomsSection: {
      marginBottom: spacing(20),
    },
    sectionHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: spacing(16),
      paddingHorizontal: spacing(isSmallScreen ? 2 : 4),
    },
    sectionTitle: {
      fontSize: fontSize(isTablet ? 20 : 18),
      fontFamily: "Poppins_600SemiBold",
      color: "#333",
    },
    viewAllButton: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: spacing(4),
      paddingHorizontal: spacing(8),
      borderRadius: spacing(8),
      backgroundColor: "rgba(67, 97, 238, 0.1)",
    },
    viewAllText: {
      fontSize: fontSize(isTablet ? 16 : 14),
      fontFamily: "Poppins_500Medium",
      color: "#4361EE",
      marginRight: spacing(4),
    },
  })
}
