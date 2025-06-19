"use client"

import { useState, useEffect, useRef } from "react"
import {
  StyleSheet,
  Animated,
  View,
  Text,
  Dimensions,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
} from "react-native"
import { TextInput, Card, Paragraph, useTheme } from "react-native-paper"
import { Ionicons } from "@expo/vector-icons"
import { LinearGradient } from "expo-linear-gradient"
import { useRoomForm } from "./hooks/useRoomForm"

// Hook mejorado para dimensiones responsivas
const useResponsiveDimensions = () => {
  const [dimensions, setDimensions] = useState(Dimensions.get("window"))
  const [keyboardHeight, setKeyboardHeight] = useState(0)

  useEffect(() => {
    const dimensionsSubscription = Dimensions.addEventListener("change", ({ window }) => {
      setDimensions(window)
    })

    const keyboardWillShowListener = Keyboard.addListener("keyboardWillShow", (e) => {
      setKeyboardHeight(e.endCoordinates.height)
    })

    const keyboardDidShowListener = Keyboard.addListener("keyboardDidShow", (e) => {
      setKeyboardHeight(e.endCoordinates.height)
    })

    const keyboardWillHideListener = Keyboard.addListener("keyboardWillHide", () => {
      setKeyboardHeight(0)
    })

    const keyboardDidHideListener = Keyboard.addListener("keyboardDidHide", () => {
      setKeyboardHeight(0)
    })

    return () => {
      dimensionsSubscription?.remove()
      keyboardWillShowListener?.remove()
      keyboardDidShowListener?.remove()
      keyboardWillHideListener?.remove()
      keyboardDidHideListener?.remove()
    }
  }, [])

  const { width, height } = dimensions

  // SISTEMA DE ESCALADO MEJORADO - MÁS GRANDE PARA TABLETS
  const getScaleFactor = () => {
    if (width >= 1024) return 1.1 // Tablets grandes - MÁS GRANDE
    if (width >= 768) return 1.05 // Tablets medianas - MÁS GRANDE
    if (width >= 600) return 1.0 // Tablets pequeñas
    if (width >= 414) return 0.95 // Teléfonos grandes
    if (width >= 375) return 0.9 // Teléfonos medianos
    return 0.85 // Teléfonos pequeños
  }

  const scaleFactor = getScaleFactor()

  return {
    width,
    height,
    keyboardHeight,
    isKeyboardVisible: keyboardHeight > 0,
    isTablet: width >= 768,
    isLandscape: width > height,
    isSmallScreen: width < 350,
    scaleFactor,
    // FUNCIÓN DE FONT SIZE MÁS GENEROSA PARA TABLETS
    fontSize: (baseSize) => {
      const scaled = Math.round(baseSize * scaleFactor)
      // Límites más generosos para tablets
      if (width >= 1024) {
        return Math.min(scaled, baseSize * 1.6) // Hasta 60% más grande en tablets grandes
      } else if (width >= 768) {
        return Math.min(scaled, baseSize * 1.4) // Hasta 40% más grande en tablets medianos
      }
      return scaled
    },
    spacing: (size) => Math.round(size * scaleFactor),
    wp: (percentage) => (width * percentage) / 100,
    hp: (percentage) => (height * percentage) / 100,
  }
}

// Esquema de validación
const validationSchema = {
  roomName: { minlength: 1, maxlength: 100, label: "Nombre de la Sala" },
  course: { minlength: 2, maxlength: 100, label: "Curso" },
  topic: { minlength: 2, maxlength: 100, label: "Tema" },
  description: { minlength: 4, maxlength: 100, label: "Descripción" },
}

export const SalasForm = () => {
  const dimensions = useResponsiveDimensions()
  const responsiveStyles = createResponsiveStyles(dimensions)
  const scrollViewRef = useRef(null)

  const {
    roomName,
    description,
    course,
    topic,
    loading,
    errors,
    setRoomName,
    setDescription,
    setCourse,
    setTopic,
    buttonScale,
    formOpacity,
    formTranslateY,
    handlePressIn,
    handlePressOut,
    handleSubmit,
  } = useRoomForm()

  const [characterCounts, setCharacterCounts] = useState({
    roomName: roomName?.length || 0,
    course: course?.length || 0,
    topic: topic?.length || 0,
    description: description?.length || 0,
  })

  const [focusedField, setFocusedField] = useState(null)

  const paperTheme = useTheme()

  useEffect(() => {
    setCharacterCounts({
      roomName: roomName?.length || 0,
      course: course?.length || 0,
      topic: topic?.length || 0,
      description: description?.length || 0,
    })
  }, [roomName, course, topic, description])

  const getFieldValidation = (field, value) => {
    const rules = validationSchema[field]
    const length = value?.length || 0
    const trimmedLength = value?.trim().length || 0

    return {
      length,
      trimmedLength,
      minLength: rules.minlength,
      maxLength: rules.maxlength,
      isValid: trimmedLength >= rules.minlength && trimmedLength <= rules.maxlength,
      needsMoreChars: trimmedLength < rules.minlength && trimmedLength > 0,
      tooManyChars: length > rules.maxlength,
    }
  }

  const CharacterCounter = ({ field, value }) => {
    const validation = getFieldValidation(field, value)
    const rules = validationSchema[field]

    return (
      <View style={responsiveStyles.characterCounterContainer}>
        <View style={responsiveStyles.counterRow}>
          <Text
            style={[
              responsiveStyles.counterText,
              validation.tooManyChars && responsiveStyles.counterError,
              validation.isValid && responsiveStyles.counterValid,
            ]}
          >
            {validation.length}/{rules.maxlength}
          </Text>
          {validation.isValid && <Ionicons name="checkmark-circle" size={dimensions.fontSize(14)} color="#2ED573" />}
        </View>
        {validation.needsMoreChars && (
          <Text style={responsiveStyles.minCharText}>
            Mínimo {rules.minlength} {rules.minlength === 1 ? "carácter" : "caracteres"}
          </Text>
        )}
      </View>
    )
  }

  const handleFieldFocus = (field) => {
    setFocusedField(field)
    if (field === "description" && scrollViewRef.current) {
      setTimeout(() => {
        scrollViewRef.current.scrollToEnd({ animated: true })
      }, 300)
    }
  }

  // MANEJO MEJORADO DE TEXTO PARA EVITAR PROBLEMAS EN ANDROID
  const handleTextChange = (setter, text) => {
    setter(text)
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={responsiveStyles.keyboardAvoidingView}
      keyboardVerticalOffset={Platform.OS === "ios" ? 100 : 20}
    >
      <ScrollView
        ref={scrollViewRef}
        contentContainerStyle={responsiveStyles.scrollViewContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        removeClippedSubviews={false}
        scrollEventThrottle={16}
      >
        <Animated.View
          style={[
            responsiveStyles.formContainer,
            {
              opacity: formOpacity,
              transform: [{ translateY: formTranslateY }],
            },
          ]}
        >
          <Card style={responsiveStyles.card}>
            <Card.Content style={responsiveStyles.cardContent}>
              <View style={responsiveStyles.cardHeader}>
                <LinearGradient
                  colors={["#5F27CD", "#7B68EE"]}
                  style={responsiveStyles.headerGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <Ionicons name="home" size={dimensions.fontSize(dimensions.isTablet ? 24 : 20)} color="#FFFFFF" />
                  <Text style={responsiveStyles.cardTitle}>Nueva Sala de Estudio</Text>
                </LinearGradient>
              </View>

              <Paragraph style={responsiveStyles.cardSubtitle}>
                Complete los detalles para crear una nueva sala de estudio
              </Paragraph>

              {/* Room Name Input - LABEL SIEMPRE ARRIBA */}
              <View style={responsiveStyles.inputWrapper}>
                <TextInput
                  label="Nombre de la Sala"
                  value={roomName || " "} // 🔥 TRUCO: Espacio para mantener label arriba
                  onChangeText={(text) => handleTextChange(setRoomName, text.trim())}
                  mode="outlined"
                  left={
                    <TextInput.Icon icon="home-outline" size={dimensions.fontSize(dimensions.isTablet ? 22 : 18)} />
                  }
                  style={responsiveStyles.input}
                  contentStyle={responsiveStyles.inputContent}
                  error={!!errors.roomName}
                  onFocus={() => handleFieldFocus("roomName")}
                  onBlur={() => setFocusedField(null)}
                  maxLength={validationSchema.roomName.maxlength}
                  placeholder="Ingrese el nombre de la sala"
                  placeholderTextColor="#999"
                  // 🔥 PROPS PARA MANTENER LABEL ARRIBA SIEMPRE
                  dense={false}
                />
                <CharacterCounter field="roomName" value={roomName} />
                {errors.roomName ? <Text style={responsiveStyles.errorText}>{errors.roomName}</Text> : null}
              </View>

              {/* Course Input - LABEL SIEMPRE ARRIBA */}
              <View style={responsiveStyles.inputWrapper}>
                <TextInput
                  label="Curso"
                  value={course || " "} // 🔥 TRUCO: Espacio para mantener label arriba
                  onChangeText={(text) => handleTextChange(setCourse, text.trim())}
                  mode="outlined"
                  left={
                    <TextInput.Icon icon="book-outline" size={dimensions.fontSize(dimensions.isTablet ? 22 : 18)} />
                  }
                  style={responsiveStyles.input}
                  contentStyle={responsiveStyles.inputContent}
                  error={!!errors.course}
                  onFocus={() => handleFieldFocus("course")}
                  onBlur={() => setFocusedField(null)}
                  maxLength={validationSchema.course.maxlength}
                  placeholder="Ingrese el curso"
                  placeholderTextColor="#999"
                  // 🔥 PROPS PARA MANTENER LABEL ARRIBA SIEMPRE
                  dense={false}
                />
                <CharacterCounter field="course" value={course} />
                {errors.course ? <Text style={responsiveStyles.errorText}>{errors.course}</Text> : null}
              </View>

              {/* Topic Input - LABEL SIEMPRE ARRIBA */}
              <View style={responsiveStyles.inputWrapper}>
                <TextInput
                  label="Tema"
                  value={topic || " "} // 🔥 TRUCO: Espacio para mantener label arriba
                  onChangeText={(text) => handleTextChange(setTopic, text.trim())}
                  mode="outlined"
                  left={
                    <TextInput.Icon icon="bookmark-outline" size={dimensions.fontSize(dimensions.isTablet ? 22 : 18)} />
                  }
                  style={responsiveStyles.input}
                  contentStyle={responsiveStyles.inputContent}
                  error={!!errors.topic}
                  onFocus={() => handleFieldFocus("topic")}
                  onBlur={() => setFocusedField(null)}
                  maxLength={validationSchema.topic.maxlength}
                  placeholder="Ingrese el tema"
                  placeholderTextColor="#999"
                  // 🔥 PROPS PARA MANTENER LABEL ARRIBA SIEMPRE
                  dense={false}
                />
                <CharacterCounter field="topic" value={topic} />
                {errors.topic ? <Text style={responsiveStyles.errorText}>{errors.topic}</Text> : null}
              </View>

              {/* Description Input - LABEL SIEMPRE ARRIBA */}
              <View style={responsiveStyles.inputWrapper}>
                <TextInput
                  label="Descripción"
                  value={description || " "} // 🔥 TRUCO: Espacio para mantener label arriba
                  onChangeText={(text) => handleTextChange(setDescription, text.trim())}
                  mode="outlined"
                  left={
                    <TextInput.Icon
                      icon="file-document-outline"
                      size={dimensions.fontSize(dimensions.isTablet ? 22 : 18)}
                    />
                  }
                  style={[responsiveStyles.input, responsiveStyles.multilineInput]}
                  contentStyle={responsiveStyles.inputContent}
                  multiline
                  numberOfLines={dimensions.isTablet ? 4 : 3}
                  error={!!errors.description}
                  onFocus={() => handleFieldFocus("description")}
                  onBlur={() => setFocusedField(null)}
                  maxLength={validationSchema.description.maxlength}
                  placeholder="Ingrese una descripción detallada"
                  placeholderTextColor="#999"
                  // 🔥 PROPS PARA MANTENER LABEL ARRIBA SIEMPRE
                  dense={false}
                />
                <CharacterCounter field="description" value={description} />
                {errors.description ? <Text style={responsiveStyles.errorText}>{errors.description}</Text> : null}
              </View>
            </Card.Content>
          </Card>

          {/* Submit Button */}
          <Animated.View style={[responsiveStyles.buttonContainer, { transform: [{ scale: buttonScale }] }]}>
            <TouchableOpacity
              onPress={handleSubmit}
              onPressIn={handlePressIn}
              onPressOut={handlePressOut}
              disabled={loading}
              activeOpacity={0.8}
              style={responsiveStyles.buttonWrapper}
            >
              <LinearGradient
                colors={loading ? ["#A4B0BE", "#A4B0BE"] : ["#5F27CD", "#7B68EE"]}
                style={responsiveStyles.buttonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                {loading ? (
                  <View style={responsiveStyles.loadingContainer}>
                    <Ionicons name="refresh" size={dimensions.fontSize(18)} color="#FFFFFF" />
                    <Text style={responsiveStyles.buttonText}>Creando...</Text>
                  </View>
                ) : (
                  <View style={responsiveStyles.buttonContent}>
                    <Ionicons
                      name="add-circle"
                      size={dimensions.fontSize(dimensions.isTablet ? 22 : 18)}
                      color="#FFFFFF"
                    />
                    <Text style={responsiveStyles.buttonText}>Crear Sala</Text>
                  </View>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>

          {/* Espacio adicional para el teclado */}
          {dimensions.isKeyboardVisible && <View style={{ height: dimensions.keyboardHeight * 0.2 }} />}
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

// Función para crear estilos responsivos MEJORADA
const createResponsiveStyles = (dimensions) => {
  const { width, height, isTablet, isSmallScreen, fontSize, spacing, wp, hp, isKeyboardVisible } = dimensions

  return StyleSheet.create({
    keyboardAvoidingView: {
      flex: 1,
      width: "100%",
      backgroundColor: "#F5F7FA",
    },
    scrollViewContent: {
      flexGrow: 1,
      paddingBottom: isKeyboardVisible ? hp(3) : spacing(20),
      minHeight: height,
    },
    formContainer: {
      width: "100%",
      alignItems: "center",
      paddingHorizontal: spacing(isTablet ? 24 : 16),
      paddingTop: spacing(isTablet ? 32 : 20),
      paddingBottom: spacing(24),
    },
    card: {
      width: "100%",
      maxWidth: isTablet ? (width >= 1024 ? 800 : 700) : "100%", // MÁS ANCHO PARA TABLETS
      marginBottom: spacing(20),
      elevation: 8,
      borderRadius: spacing(16),
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 12,
      backgroundColor: "#FFFFFF",
    },
    cardContent: {
      padding: spacing(isTablet ? (width >= 1024 ? 32 : 28) : 16), // MÁS PADDING PARA TABLETS
    },
    cardHeader: {
      marginBottom: spacing(20),
      borderRadius: spacing(12),
      overflow: "hidden",
    },
    headerGradient: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: spacing(isTablet ? (width >= 1024 ? 24 : 20) : 16), // MÁS PADDING VERTICAL
      paddingHorizontal: spacing(20),
      gap: spacing(12),
    },
    cardTitle: {
      fontSize: fontSize(isTablet ? 18 : 16),
      fontWeight: "bold",
      color: "#FFFFFF",
    },
    cardSubtitle: {
      marginBottom: spacing(20),
      color: "#757575",
      fontSize: fontSize(isTablet ? 14 : 13),
      textAlign: "center",
      lineHeight: fontSize(isTablet ? 20 : 18),
    },
    inputWrapper: {
      marginBottom: spacing(16),
      width: "100%",
    },
    input: {
      marginBottom: spacing(8),
      backgroundColor: "#FFFFFF",
    },
    inputContent: {
      fontSize: fontSize(isTablet ? 14 : 13),
      color: "#333333",
    },
    multilineInput: {
      minHeight: spacing(isTablet ? 120 : 100),
    },
    characterCounterContainer: {
      paddingHorizontal: spacing(4),
      marginBottom: spacing(4),
    },
    counterRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    counterText: {
      fontSize: fontSize(11),
      color: "#95A5A6",
      fontWeight: "500",
    },
    counterError: {
      color: "#FF4757",
    },
    counterValid: {
      color: "#2ED573",
    },
    minCharText: {
      fontSize: fontSize(10),
      color: "#F39C12",
      fontStyle: "italic",
      marginTop: spacing(2),
    },
    errorText: {
      color: "#D32F2F",
      fontSize: fontSize(11),
      marginTop: spacing(4),
      marginLeft: spacing(8),
    },
    buttonContainer: {
      width: "100%",
      alignItems: "center",
      marginTop: spacing(8),
    },
    buttonWrapper: {
      width: wp(isTablet ? 60 : isSmallScreen ? 90 : 80),
      maxWidth: isTablet ? 400 : "100%",
      borderRadius: spacing(16),
      overflow: "hidden",
      shadowColor: "#5F27CD",
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.3,
      shadowRadius: 16,
      elevation: 8,
    },
    buttonGradient: {
      paddingVertical: spacing(isTablet ? 18 : 16),
      paddingHorizontal: spacing(32),
      alignItems: "center",
      justifyContent: "center",
      minHeight: spacing(isTablet ? 60 : 56),
    },
    buttonContent: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing(8),
    },
    loadingContainer: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing(8),
    },
    buttonText: {
      fontSize: fontSize(isTablet ? 16 : 15),
      fontWeight: "bold",
      color: "#FFFFFF",
    },
  })
}
