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

    // Funciones de escalado responsivo MEJORADAS
    wp: (percentage: number) => (width * percentage) / 100,
    hp: (percentage: number) => (height * percentage) / 100,
    fontSize: (size: number) => {
      if (width >= 1024) return Math.min(size * 0.9, size) // Tablets grandes - más pequeño
      if (width >= 768) return Math.min(size * 0.95, size) // Tablets medianos - un poco más pequeño
      return Math.round(size * (width / 375)) // Teléfonos - escala normal
    },
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

  // ORDENAR Y LIMITAR A LAS 3 SALAS MÁS RECIENTES
  const getRecentRooms = (roomsArray) => {
    if (!roomsArray || roomsArray.length === 0) return []

    // Ordenar por fecha de creación (más reciente primero)
    const sortedRooms = [...roomsArray].sort((a, b) => {
      // Asumiendo que las salas tienen una propiedad 'createdAt' o 'dateCreated'
      // Si no existe, usar 'id' como fallback (asumiendo que IDs más altos = más recientes)
      const dateA = a.createdAt || a.dateCreated || a.created_at || a.id
      const dateB = b.createdAt || b.dateCreated || b.created_at || b.id

      // Si son fechas, convertir a timestamp para comparar
      const timestampA =
        dateA instanceof Date ? dateA.getTime() : typeof dateA === "string" ? new Date(dateA).getTime() : dateA
      const timestampB =
        dateB instanceof Date ? dateB.getTime() : typeof dateB === "string" ? new Date(dateB).getTime() : dateB

      return timestampB - timestampA // Orden descendente (más reciente primero)
    })

    // Tomar solo las 3 más recientes
    return sortedRooms.slice(0, 3)
  }

  const recentRooms = getRecentRooms(rooms)

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

      {/* MOSTRAR SOLO LAS 3 SALAS MÁS RECIENTES */}
      {recentRooms.map((room, index) => (
        <RoomCard
          key={room.id}
          room={room}
          onViewMore={onViewMore}
          onEdit={onEdit}
          onDelete={onDelete}
          onViewQuestions={onViewQuestions}
          onUploadEvaluation={onUploadEvaluation}
          dimensions={dimensions}
          isLatest={index === 0} // La primera es la más reciente
        />
      ))}

      {/* INDICADOR SI HAY MÁS SALAS */}
      {rooms.length > 3 && (
        <View style={responsiveStyles.moreRoomsIndicator}>
          <Text style={responsiveStyles.moreRoomsText}>+{rooms.length - 3} salas más</Text>
        </View>
      )}
    </View>
  )
}

// Función para crear estilos responsivos MEJORADA
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
      fontSize: fontSize(isTablet ? 18 : 18), // Mismo tamaño para tablets y móviles
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
      fontSize: fontSize(isTablet ? 14 : 14), // Mismo tamaño para tablets y móviles
      fontFamily: "Poppins_500Medium",
      color: "#4361EE",
      marginRight: spacing(4),
    },
    moreRoomsIndicator: {
      alignItems: "center",
      paddingVertical: spacing(12),
      marginTop: spacing(8),
    },
    moreRoomsText: {
      fontSize: fontSize(12),
      fontFamily: "Poppins_400Regular",
      color: "#666",
      fontStyle: "italic",
    },
  })
}
