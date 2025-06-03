"use client";

import { useState, useEffect, useRef } from "react";
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
} from "react-native";
import { TextInput, Card, Paragraph, useTheme } from "react-native-paper";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRoomForm } from "./hooks/useRoomForm";

// Hook para dimensiones responsivas
const useResponsiveDimensions = () => {
  const [dimensions, setDimensions] = useState(Dimensions.get("window"));
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    const dimensionsSubscription = Dimensions.addEventListener("change", ({ window }) => {
      setDimensions(window);
    });

    const keyboardWillShowListener = Keyboard.addListener("keyboardWillShow", (e) => {
      setKeyboardHeight(e.endCoordinates.height);
    });

    const keyboardDidShowListener = Keyboard.addListener("keyboardDidShow", (e) => {
      setKeyboardHeight(e.endCoordinates.height);
    });

    const keyboardWillHideListener = Keyboard.addListener("keyboardWillHide", () => {
      setKeyboardHeight(0);
    });

    const keyboardDidHideListener = Keyboard.addListener("keyboardDidHide", () => {
      setKeyboardHeight(0);
    });

    return () => {
      dimensionsSubscription?.remove();
      keyboardWillShowListener?.remove();
      keyboardDidShowListener?.remove();
      keyboardWillHideListener?.remove();
      keyboardDidHideListener?.remove();
    };
  }, []);

  const { width, height } = dimensions;

  return {
    width,
    height,
    keyboardHeight,
    isKeyboardVisible: keyboardHeight > 0,
    isTablet: width >= 768,
    isLandscape: width > height,
    isSmallScreen: width < 350,
    fontSize: (size) => Math.round(size * (width / 375)),
    spacing: (size) => Math.round(size * (width / 375)),
    wp: (percentage) => (width * percentage) / 100,
    hp: (percentage) => (height * percentage) / 100,
  };
};

// Esquema de validación
const validationSchema = {
  roomName: { minlength: 1, maxlength: 100, label: "Nombre de la Sala" },
  course: { minlength: 2, maxlength: 100, label: "Curso" },
  topic: { minlength: 2, maxlength: 100, label: "Tema" },
  description: { minlength: 4, maxlength: 100, label: "Descripción" },
};

export const SalasForm = () => {
  const dimensions = useResponsiveDimensions();
  const responsiveStyles = createResponsiveStyles(dimensions);
  const scrollViewRef = useRef(null);

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
  } = useRoomForm();

  const [characterCounts, setCharacterCounts] = useState({
    roomName: roomName?.length || 0,
    course: course?.length || 0,
    topic: topic?.length || 0,
    description: description?.length || 0,
  });

  const [focusedField, setFocusedField] = useState(null);

  const paperTheme = useTheme();

  useEffect(() => {
    setCharacterCounts({
      roomName: roomName?.length || 0,
      course: course?.length || 0,
      topic: topic?.length || 0,
      description: description?.length || 0,
    });
  }, [roomName, course, topic, description]);

  const getFieldValidation = (field, value) => {
    const rules = validationSchema[field];
    const length = value?.length || 0;
    const trimmedLength = value?.trim().length || 0;

    return {
      length,
      trimmedLength,
      minLength: rules.minlength,
      maxLength: rules.maxlength,
      isValid: trimmedLength >= rules.minlength && trimmedLength <= rules.maxlength,
      needsMoreChars: trimmedLength < rules.minlength && trimmedLength > 0,
      tooManyChars: length > rules.maxlength,
    };
  };

  const CharacterCounter = ({ field, value }) => {
    const validation = getFieldValidation(field, value);
    const rules = validationSchema[field];

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
          {validation.isValid && (
            <Ionicons name="checkmark-circle" size={dimensions.fontSize(16)} color="#2ED573" />
          )}
        </View>
        {validation.needsMoreChars && (
          <Text style={responsiveStyles.minCharText}>
            Mínimo {rules.minlength} {rules.minlength === 1 ? "carácter" : "caracteres"}
          </Text>
        )}
      </View>
    );
  };

  const handleFieldFocus = (field) => {
    setFocusedField(field);
    if (field === "description" && scrollViewRef.current) {
      setTimeout(() => {
        scrollViewRef.current.scrollToEnd({ animated: true });
      }, 300);
    }
  };

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
            <Card.Content>
              <View style={responsiveStyles.cardHeader}>
                <LinearGradient
                  colors={["#5F27CD", "#7B68EE"]}
                  style={responsiveStyles.headerGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <Ionicons name="home" size={dimensions.fontSize(24)} color="#FFFFFF" />
                  <Text style={responsiveStyles.cardTitle}>Nueva Sala de Estudio</Text>
                </LinearGradient>
              </View>

              <Paragraph style={responsiveStyles.cardSubtitle}>
                Complete los detalles para crear una nueva sala de estudio
              </Paragraph>

              {/* Room Name Input */}
              <View style={responsiveStyles.inputWrapper}>
                <TextInput
                  label="Nombre de la Sala"
                  value={roomName || " "}
                  onChangeText={(text) => setRoomName(text.trim() === "" ? "" : text)}
                  mode="outlined"
                  left={<TextInput.Icon icon="home-outline" color={paperTheme.colors.primary} />}
                  style={responsiveStyles.input}
                  error={!!errors.roomName}
                  onFocus={() => handleFieldFocus("roomName")}
                  onBlur={() => setFocusedField(null)}
                  maxLength={validationSchema.roomName.maxlength}
                  placeholder=""
                />
                <CharacterCounter field="roomName" value={roomName} />
                {errors.roomName ? (
                  <Text style={responsiveStyles.errorText}>{errors.roomName}</Text>
                ) : null}
              </View>

              {/* Course Input */}
              <View style={responsiveStyles.inputWrapper}>
                <TextInput
                  label="Curso"
                  value={course || " "}
                  onChangeText={(text) => setCourse(text.trim() === "" ? "" : text)}
                  mode="outlined"
                  left={<TextInput.Icon icon="book-outline" color={paperTheme.colors.primary} />}
                  style={responsiveStyles.input}
                  error={!!errors.course}
                  onFocus={() => handleFieldFocus("course")}
                  onBlur={() => setFocusedField(null)}
                  maxLength={validationSchema.course.maxlength}
                  placeholder=""
                />
                <CharacterCounter field="course" value={course} />
                {errors.course ? (
                  <Text style={responsiveStyles.errorText}>{errors.course}</Text>
                ) : null}
              </View>

              {/* Topic Input */}
              <View style={responsiveStyles.inputWrapper}>
                <TextInput
                  label="Tema"
                  value={topic || " "}
                  onChangeText={(text) => setTopic(text.trim() === "" ? "" : text)}
                  mode="outlined"
                  left={<TextInput.Icon icon="bookmark-outline" color={paperTheme.colors.primary} />}
                  style={responsiveStyles.input}
                  error={!!errors.topic}
                  onFocus={() => handleFieldFocus("topic")}
                  onBlur={() => setFocusedField(null)}
                  maxLength={validationSchema.topic.maxlength}
                  placeholder=""
                />
                <CharacterCounter field="topic" value={topic} />
                {errors.topic ? (
                  <Text style={responsiveStyles.errorText}>{errors.topic}</Text>
                ) : null}
              </View>

              {/* Description Input */}
              <View style={responsiveStyles.inputWrapper}>
                <TextInput
                  label="Descripción"
                  value={description || " "}
                  onChangeText={(text) => setDescription(text.trim() === "" ? "" : text)}
                  mode="outlined"
                  left={<TextInput.Icon icon="file-document-outline" color={paperTheme.colors.primary} />}
                  style={responsiveStyles.input}
                  multiline
                  numberOfLines={3}
                  error={!!errors.description}
                  onFocus={() => handleFieldFocus("description")}
                  onBlur={() => setFocusedField(null)}
                  maxLength={validationSchema.description.maxlength}
                  placeholder=""
                />
                <CharacterCounter field="description" value={description} />
                {errors.description ? (
                  <Text style={responsiveStyles.errorText}>{errors.description}</Text>
                ) : null}
              </View>
            </Card.Content>
          </Card>

          {/* Submit Button */}
          <Animated.View
            style={[responsiveStyles.buttonContainer, { transform: [{ scale: buttonScale }] }]}
          >
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
                    <Ionicons name="refresh" size={dimensions.fontSize(20)} color="#FFFFFF" />
                    <Text style={responsiveStyles.buttonText}>Creando...</Text>
                  </View>
                ) : (
                  <View style={responsiveStyles.buttonContent}>
                    <Ionicons name="add-circle" size={dimensions.fontSize(20)} color="#FFFFFF" />
                    <Text style={responsiveStyles.buttonText}>Crear Sala</Text>
                  </View>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>

          {/* Espacio adicional para el teclado */}
          {dimensions.isKeyboardVisible && <View style={{ height: dimensions.keyboardHeight * 0.3 }} />}
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

// Función para crear estilos responsivos
const createResponsiveStyles = (dimensions) => {
  const {
    width,
    height,
    isTablet,
    isSmallScreen,
    fontSize,
    spacing,
    wp,
    hp,
    isKeyboardVisible,
  } = dimensions;

  return StyleSheet.create({
    keyboardAvoidingView: {
      flex: 1,
      width: "100%",
    },
    scrollViewContent: {
      flexGrow: 1,
      paddingBottom: isKeyboardVisible ? hp(5) : 0,
    },
    formContainer: {
      width: "100%",
      alignItems: "center",
      paddingHorizontal: spacing(16),
      paddingBottom: spacing(24),
    },
    card: {
      width: "100%",
      marginBottom: spacing(20),
      elevation: 8,
      borderRadius: spacing(16),
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 12,
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
      paddingVertical: spacing(16),
      paddingHorizontal: spacing(20),
      gap: spacing(12),
    },
    cardTitle: {
      fontSize: fontSize(isTablet ? 20 : 18),
      fontWeight: "bold",
      color: "#FFFFFF",
    },
    cardSubtitle: {
      marginBottom: spacing(20),
      color: "#757575",
      fontSize: fontSize(isTablet ? 16 : 14),
      textAlign: "center",
      lineHeight: fontSize(isTablet ? 22 : 20),
    },
    inputWrapper: {
      marginBottom: spacing(16),
    },
    input: {
      marginBottom: spacing(8),
      backgroundColor: "#FFFFFF",
      fontSize: fontSize(isTablet ? 16 : 14),
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
      fontSize: fontSize(12),
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
      fontSize: fontSize(11),
      color: "#F39C12",
      fontStyle: "italic",
      marginTop: spacing(2),
    },
    errorText: {
      color: "#D32F2F",
      fontSize: fontSize(12),
      marginTop: spacing(4),
      marginLeft: spacing(8),
    },
    buttonContainer: {
      width: "100%",
      alignItems: "center",
      marginTop: spacing(8),
    },
    buttonWrapper: {
      width: wp(isSmallScreen ? 90 : 80),
      borderRadius: spacing(16),
      overflow: "hidden",
      shadowColor: "#5F27CD",
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.3,
      shadowRadius: 16,
      elevation: 8,
    },
    buttonGradient: {
      paddingVertical: spacing(16),
      paddingHorizontal: spacing(32),
      alignItems: "center",
      justifyContent: "center",
      minHeight: spacing(56),
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
      fontSize: fontSize(isTablet ? 18 : 16),
      fontWeight: "bold",
      color: "#FFFFFF",
    },
  });
};
