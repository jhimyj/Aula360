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
import { TextInput, Card, useTheme } from "react-native-paper"
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

  const getScaleFactor = () => {
    if (width >= 1200) return 0.95
    if (width >= 1024) return 1.0
    if (width >= 768) return 1.05
    if (width >= 600) return 1.1
    if (width >= 414) return 1.05
    if (width >= 375) return 1.1
    return 1.15
  }

  const scaleFactor = getScaleFactor()

  const smartFontSize = (baseSize) => {
    const scaled = baseSize * scaleFactor
    if (width >= 1024) {
      return Math.min(Math.max(scaled, baseSize * 0.9), baseSize * 1.4)
    } else if (width >= 768) {
      return Math.min(Math.max(scaled, baseSize * 0.9), baseSize * 1.3)
    } else {
      return Math.min(Math.max(scaled, baseSize * 0.9), baseSize * 1.3)
    }
  }

  const smartSpacing = (baseSize) => {
    const scaled = baseSize * scaleFactor
    if (width >= 1024) {
      return Math.min(Math.max(scaled, baseSize * 0.9), baseSize * 1.3)
    } else if (width >= 768) {
      return Math.min(Math.max(scaled, baseSize * 0.9), baseSize * 1.25)
    } else {
      return Math.min(Math.max(scaled, baseSize * 0.9), baseSize * 1.2)
    }
  }

  return {
    width,
    height,
    keyboardHeight,
    isKeyboardVisible: keyboardHeight > 0,
    isTablet: width >= 768,
    isLargeTablet: width >= 1024,
    isLandscape: width > height,
    isSmallScreen: width < 350,
    scaleFactor,
    fontSize: smartFontSize,
    spacing: smartSpacing,
    wp: (percentage) => (width * percentage) / 100,
    hp: (percentage) => (height * percentage) / 100,
    iconSize: (baseSize) => {
      if (width >= 1024) return Math.min(baseSize * 1.1, baseSize + 4)
      if (width >= 768) return Math.min(baseSize * 1.05, baseSize + 2)
      return baseSize
    },
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
          {validation.isValid && <Ionicons name="checkmark-circle" size={dimensions.iconSize(16)} color="#00D4AA" />}
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
    // 🎯 SCROLL MEJORADO - Permite scroll suave mientras escribes
    if (scrollViewRef.current) {
      setTimeout(() => {
        if (field === "description") {
          scrollViewRef.current.scrollToEnd({ animated: true })
        } else {
          // Para otros campos, scroll moderado
          scrollViewRef.current.scrollTo({ y: 200, animated: true })
        }
      }, 100) // Reducido el timeout para respuesta más rápida
    }
  }

  const handleTextChange = (setter, text) => {
    setter(text)
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined} // 🎯 MEJORADO: Solo padding en iOS
      style={responsiveStyles.keyboardAvoidingView}
      keyboardVerticalOffset={Platform.OS === "ios" ? 60 : 0} // 🎯 REDUCIDO el offset
    >
      <ScrollView
        ref={scrollViewRef}
        contentContainerStyle={responsiveStyles.scrollViewContent}
        showsVerticalScrollIndicator={true} // 🎯 ACTIVADO para mejor UX
        keyboardShouldPersistTaps="handled" // 🎯 MANTIENE el tap handling
        keyboardDismissMode="interactive" // 🎯 NUEVO: Permite dismiss interactivo
        removeClippedSubviews={false}
        scrollEventThrottle={16}
        nestedScrollEnabled={true} // 🎯 NUEVO: Permite scroll anidado
        bounces={true} // 🎯 NUEVO: Permite bounce natural
        overScrollMode="auto" // 🎯 NUEVO: Scroll natural en Android
        automaticallyAdjustContentInsets={false} // 🎯 NUEVO: Control manual de insets
        contentInsetAdjustmentBehavior="automatic" // 🎯 NUEVO: Ajuste automático en iOS
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
          {/* 🎨 HEADER SÚPER BONITO */}
          <View style={responsiveStyles.heroSection}>
            <LinearGradient
              colors={["#667eea", "#764ba2", "#f093fb"]}
              style={responsiveStyles.heroGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={responsiveStyles.heroContent}>
                <View style={responsiveStyles.iconContainer}>
                  <Ionicons name="school" size={dimensions.iconSize(40)} color="#FFFFFF" />
                </View>
                <Text style={responsiveStyles.heroTitle}>¡Crea tu Sala!</Text>
                <Text style={responsiveStyles.heroSubtitle}>Diseña el espacio perfecto para estudiar</Text>
              </View>
            </LinearGradient>
          </View>

          {/* 🎨 FORMULARIO SÚPER BONITO */}
          <Card style={responsiveStyles.card}>
            <Card.Content style={responsiveStyles.cardContent}>
              {/* Información Básica */}
              <View style={responsiveStyles.sectionContainer}>
                <View style={responsiveStyles.sectionHeader}>
                  <View style={responsiveStyles.sectionIconContainer}>
                    <Ionicons name="information-circle" size={dimensions.iconSize(20)} color="#667eea" />
                  </View>
                  <Text style={responsiveStyles.sectionTitle}>Información Básica</Text>
                </View>

                <View style={responsiveStyles.inputWrapper}>
                  <View style={responsiveStyles.inputLabelContainer}>
                    <Ionicons name="home" size={dimensions.iconSize(18)} color="#667eea" />
                    <Text style={responsiveStyles.inputLabel}>Nombre de la Sala</Text>
                  </View>
                  <TextInput
                    value={roomName || ""}
                    onChangeText={(text) => handleTextChange(setRoomName, text)}
                    mode="outlined"
                    style={responsiveStyles.input}
                    contentStyle={responsiveStyles.inputContent}
                    outlineStyle={responsiveStyles.inputOutline}
                    error={!!errors.roomName}
                    onFocus={() => handleFieldFocus("roomName")}
                    onBlur={() => setFocusedField(null)}
                    maxLength={validationSchema.roomName.maxlength}
                    placeholder="Ej: Sala de Matemáticas Avanzadas"
                    placeholderTextColor="#A0A0A0"
                    // 🎯 SCROLL MEJORADO: Configuración optimizada para TextInput
                    scrollEnabled={false} // Evita conflictos de scroll interno
                    theme={{
                      colors: {
                        primary: "#667eea",
                        outline: focusedField === "roomName" ? "#667eea" : "#E0E0E0",
                      },
                    }}
                  />
                  <CharacterCounter field="roomName" value={roomName} />
                  {errors.roomName ? <Text style={responsiveStyles.errorText}>{errors.roomName}</Text> : null}
                </View>

                <View style={responsiveStyles.inputWrapper}>
                  <View style={responsiveStyles.inputLabelContainer}>
                    <Ionicons name="book" size={dimensions.iconSize(18)} color="#667eea" />
                    <Text style={responsiveStyles.inputLabel}>Curso</Text>
                  </View>
                  <TextInput
                    value={course || ""}
                    onChangeText={(text) => handleTextChange(setCourse, text)}
                    mode="outlined"
                    style={responsiveStyles.input}
                    contentStyle={responsiveStyles.inputContent}
                    outlineStyle={responsiveStyles.inputOutline}
                    error={!!errors.course}
                    onFocus={() => handleFieldFocus("course")}
                    onBlur={() => setFocusedField(null)}
                    maxLength={validationSchema.course.maxlength}
                    placeholder="Ej: Cálculo Diferencial"
                    placeholderTextColor="#A0A0A0"
                    scrollEnabled={false} // 🎯 SCROLL MEJORADO
                    theme={{
                      colors: {
                        primary: "#667eea",
                        outline: focusedField === "course" ? "#667eea" : "#E0E0E0",
                      },
                    }}
                  />
                  <CharacterCounter field="course" value={course} />
                  {errors.course ? <Text style={responsiveStyles.errorText}>{errors.course}</Text> : null}
                </View>

                <View style={responsiveStyles.inputWrapper}>
                  <View style={responsiveStyles.inputLabelContainer}>
                    <Ionicons name="bookmark" size={dimensions.iconSize(18)} color="#667eea" />
                    <Text style={responsiveStyles.inputLabel}>Tema</Text>
                  </View>
                  <TextInput
                    value={topic || ""}
                    onChangeText={(text) => handleTextChange(setTopic, text)}
                    mode="outlined"
                    style={responsiveStyles.input}
                    contentStyle={responsiveStyles.inputContent}
                    outlineStyle={responsiveStyles.inputOutline}
                    error={!!errors.topic}
                    onFocus={() => handleFieldFocus("topic")}
                    onBlur={() => setFocusedField(null)}
                    maxLength={validationSchema.topic.maxlength}
                    placeholder="Ej: Límites y Continuidad"
                    placeholderTextColor="#A0A0A0"
                    scrollEnabled={false} // 🎯 SCROLL MEJORADO
                    theme={{
                      colors: {
                        primary: "#667eea",
                        outline: focusedField === "topic" ? "#667eea" : "#E0E0E0",
                      },
                    }}
                  />
                  <CharacterCounter field="topic" value={topic} />
                  {errors.topic ? <Text style={responsiveStyles.errorText}>{errors.topic}</Text> : null}
                </View>
              </View>

              {/* Descripción */}
              <View style={responsiveStyles.sectionContainer}>
                <View style={responsiveStyles.sectionHeader}>
                  <View style={responsiveStyles.sectionIconContainer}>
                    <Ionicons name="create" size={dimensions.iconSize(20)} color="#764ba2" />
                  </View>
                  <Text style={[responsiveStyles.sectionTitle, { color: "#764ba2" }]}>Descripción Detallada</Text>
                </View>

                <View style={responsiveStyles.inputWrapper}>
                  <View style={responsiveStyles.inputLabelContainer}>
                    <Ionicons name="document-text" size={dimensions.iconSize(18)} color="#764ba2" />
                    <Text style={responsiveStyles.inputLabel}>Cuéntanos más sobre tu sala</Text>
                  </View>
                  <TextInput
                    value={description || ""}
                    onChangeText={(text) => handleTextChange(setDescription, text)}
                    mode="outlined"
                    style={[responsiveStyles.input, responsiveStyles.multilineInput]}
                    contentStyle={responsiveStyles.inputContent}
                    outlineStyle={responsiveStyles.inputOutline}
                    multiline
                    numberOfLines={dimensions.isTablet ? 5 : 4}
                    error={!!errors.description}
                    onFocus={() => handleFieldFocus("description")}
                    onBlur={() => setFocusedField(null)}
                    maxLength={validationSchema.description.maxlength}
                    placeholder="Describe los objetivos, metodología, recursos disponibles y todo lo que consideres importante para esta sala de estudio..."
                    placeholderTextColor="#A0A0A0"
                    // 🎯 SCROLL MEJORADO: Para TextInput multiline
                    scrollEnabled={true} // Permite scroll interno en descripción
                    textAlignVertical="top" // Texto desde arriba
                    theme={{
                      colors: {
                        primary: "#764ba2",
                        outline: focusedField === "description" ? "#764ba2" : "#E0E0E0",
                      },
                    }}
                  />
                  <CharacterCounter field="description" value={description} />
                  {errors.description ? <Text style={responsiveStyles.errorText}>{errors.description}</Text> : null}
                </View>
              </View>
            </Card.Content>
          </Card>

          {/* 🎨 BOTÓN SÚPER BONITO */}
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
                colors={loading ? ["#A0A0A0", "#808080"] : ["#667eea", "#764ba2", "#f093fb"]}
                style={responsiveStyles.buttonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                {loading ? (
                  <View style={responsiveStyles.loadingContainer}>
                    <Ionicons name="hourglass" size={dimensions.iconSize(22)} color="#FFFFFF" />
                    <Text style={responsiveStyles.buttonText}>Creando tu sala...</Text>
                  </View>
                ) : (
                  <View style={responsiveStyles.buttonContent}>
                    <Ionicons name="rocket" size={dimensions.iconSize(24)} color="#FFFFFF" />
                    <Text style={responsiveStyles.buttonText}>¡Crear Mi Sala!</Text>
                  </View>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>

          {/* 🎯 ESPACIO DINÁMICO MEJORADO PARA EL TECLADO */}
          {dimensions.isKeyboardVisible && <View style={{ height: Math.max(dimensions.keyboardHeight * 0.1, 50) }} />}
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

// Función para crear estilos responsivos SÚPER MEJORADA
const createResponsiveStyles = (dimensions) => {
  const { width, height, isTablet, isLargeTablet, isSmallScreen, fontSize, spacing, wp, hp, isKeyboardVisible } =
    dimensions

  return StyleSheet.create({
    keyboardAvoidingView: {
      flex: 1,
      width: "100%",
      backgroundColor: "#F8FAFF",
    },
    scrollViewContent: {
      flexGrow: 1,
      // 🎯 PADDING DINÁMICO MEJORADO
      paddingBottom: isKeyboardVisible ? spacing(10) : spacing(30),
      minHeight: height * 0.9, // 🎯 ALTURA MÍNIMA AJUSTADA
    },
    formContainer: {
      width: "100%",
      alignItems: "center",
    },
    // 🎨 HERO SECTION SÚPER BONITA
    heroSection: {
      width: "100%",
      marginBottom: spacing(20),
    },
    heroGradient: {
      paddingVertical: spacing(isTablet ? 60 : 40),
      paddingHorizontal: spacing(20),
      borderBottomLeftRadius: spacing(30),
      borderBottomRightRadius: spacing(30),
    },
    heroContent: {
      alignItems: "center",
    },
    iconContainer: {
      backgroundColor: "rgba(255, 255, 255, 0.2)",
      borderRadius: spacing(25),
      padding: spacing(15),
      marginBottom: spacing(15),
    },
    heroTitle: {
      fontSize: fontSize(isLargeTablet ? 32 : isTablet ? 28 : 24),
      fontWeight: "800",
      color: "#FFFFFF",
      textAlign: "center",
      marginBottom: spacing(8),
      textShadowColor: "rgba(0, 0, 0, 0.3)",
      textShadowOffset: { width: 0, height: 2 },
      textShadowRadius: 4,
    },
    heroSubtitle: {
      fontSize: fontSize(isLargeTablet ? 18 : isTablet ? 16 : 14),
      color: "rgba(255, 255, 255, 0.9)",
      textAlign: "center",
      fontWeight: "500",
    },
    // 🎨 CARD SÚPER BONITA
    card: {
      width: "90%",
      maxWidth: isLargeTablet ? 900 : isTablet ? 750 : "100%",
      marginBottom: spacing(25),
      elevation: 15,
      borderRadius: spacing(25),
      shadowColor: "#667eea",
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.2,
      shadowRadius: 20,
      backgroundColor: "#FFFFFF",
      borderWidth: 1,
      borderColor: "rgba(102, 126, 234, 0.1)",
    },
    cardContent: {
      padding: spacing(isLargeTablet ? 35 : isTablet ? 30 : 20),
    },
    // 🎨 SECCIONES SÚPER BONITAS
    sectionContainer: {
      marginBottom: spacing(25),
    },
    sectionHeader: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: spacing(20),
      paddingBottom: spacing(10),
      borderBottomWidth: 2,
      borderBottomColor: "rgba(102, 126, 234, 0.1)",
    },
    sectionIconContainer: {
      backgroundColor: "rgba(102, 126, 234, 0.1)",
      borderRadius: spacing(10),
      padding: spacing(8),
      marginRight: spacing(12),
    },
    sectionTitle: {
      fontSize: fontSize(isLargeTablet ? 20 : isTablet ? 18 : 16),
      fontWeight: "700",
      color: "#667eea",
    },
    // 🎨 INPUTS SÚPER BONITOS
    inputWrapper: {
      marginBottom: spacing(20),
    },
    inputLabelContainer: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: spacing(8),
      paddingLeft: spacing(4),
    },
    inputLabel: {
      fontSize: fontSize(isLargeTablet ? 16 : isTablet ? 14 : 13),
      fontWeight: "600",
      color: "#4A5568",
      marginLeft: spacing(8),
    },
    input: {
      backgroundColor: "#FFFFFF",
      borderRadius: spacing(12),
    },
    inputContent: {
      fontSize: fontSize(isLargeTablet ? 16 : isTablet ? 15 : 14),
      color: "#2D3748",
      paddingHorizontal: spacing(16),
      paddingVertical: spacing(12),
    },
    inputOutline: {
      borderRadius: spacing(12),
      borderWidth: 2,
    },
    multilineInput: {
      minHeight: spacing(isTablet ? 150 : 120),
    },
    // 🎨 CONTADORES SÚPER BONITOS
    characterCounterContainer: {
      paddingHorizontal: spacing(8),
      marginTop: spacing(8),
    },
    counterRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    counterText: {
      fontSize: fontSize(12),
      color: "#718096",
      fontWeight: "600",
    },
    counterError: {
      color: "#E53E3E",
    },
    counterValid: {
      color: "#00D4AA",
    },
    minCharText: {
      fontSize: fontSize(11),
      color: "#ED8936",
      fontStyle: "italic",
      marginTop: spacing(4),
    },
    errorText: {
      color: "#E53E3E",
      fontSize: fontSize(12),
      marginTop: spacing(6),
      marginLeft: spacing(8),
      fontWeight: "500",
    },
    // 🎨 BOTÓN SÚPER BONITO
    buttonContainer: {
      width: "90%",
      alignItems: "center",
      marginTop: spacing(10),
    },
    buttonWrapper: {
      width: "100%",
      maxWidth: isTablet ? 400 : "100%",
      borderRadius: spacing(20),
      overflow: "hidden",
      shadowColor: "#667eea",
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.4,
      shadowRadius: 20,
      elevation: 15,
    },
    buttonGradient: {
      paddingVertical: spacing(isTablet ? 20 : 18),
      paddingHorizontal: spacing(40),
      alignItems: "center",
      justifyContent: "center",
      minHeight: spacing(isTablet ? 65 : 60),
    },
    buttonContent: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing(12),
    },
    loadingContainer: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing(12),
    },
    buttonText: {
      fontSize: fontSize(isLargeTablet ? 18 : isTablet ? 17 : 16),
      fontWeight: "800",
      color: "#FFFFFF",
      textShadowColor: "rgba(0, 0, 0, 0.3)",
      textShadowOffset: { width: 0, height: 1 },
      textShadowRadius: 2,
    },
  })
}
