"use client";

import React, { useState, useEffect, useRef } from "react";
import { StyleSheet, View, StatusBar, BackHandler, Dimensions } from "react-native";
import { Video } from "expo-av";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";

/**
 * Pantalla que muestra un video a pantalla completa según el personaje seleccionado
 * Sin controles adicionales, solo el video
 */
const MissionGameScreen = ({ navigation }) => {
  const [videoSource, setVideoSource] = useState(null);
  const videoRef = useRef(null);
  const [dimensions, setDimensions] = useState(Dimensions.get("window"));

  // Función para actualizar dimensiones
  const updateDimensions = ({ window }) => {
    setDimensions(window);
  };

  // Cargar el personaje seleccionado y configurar el video correspondiente
  useFocusEffect(
    React.useCallback(() => {
      const loadCharacterData = async () => {
        console.log("🚀 MissionGameScreen montado");

        try {
          const savedName = await AsyncStorage.getItem("selectedCharacterName");
          console.log("Nombre del personaje guardado:", savedName);
          if (savedName) {
            switch (savedName) {
              case "Qhapaq":
                setVideoSource(
                  require("../../assets/EntradaMision/Qhapac-entrada-mision.mp4")
                );
                break;
              case "Amaru":
                setVideoSource(
                  require("../../assets/EntradaMision/Amaru-entrada-mision.mp4")
                );
                break;
              case "Killa":
                setVideoSource(
                  require("../../assets/EntradaMision/Killa-entrada-mision.mp4")
                );
                break;
              default:
                setVideoSource(require("../../assets/videos/Tunel.mp4"));
                break;
            }
          }
        } catch (error) {
          console.error("Error al cargar el nombre del personaje:", error);
        }
      };

      loadCharacterData();
    }, [])
  );

  // Manejar cambios de dimensiones
  useEffect(() => {
    const subscription = Dimensions.addEventListener("change", updateDimensions);
    return () => {
      subscription?.remove();
    };
  }, []);

  // Manejar el botón de retroceso en Android
  useEffect(() => {
    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      () => {
        navigation.goBack();
        return true;
      }
    );

    return () => {
      backHandler.remove();
    };
  }, [navigation]);

  // Navegar al finalizar el video
  const handlePlaybackEnd = () => {
    console.log("✅ Video finalizado, navegando a Quiz");

    navigation.navigate("Quiz");
  };

  return (
    <View style={styles.absoluteContainer}>
      <StatusBar hidden />
      <View style={styles.container}>
        {videoSource && (
          <Video
            ref={videoRef}
            style={styles.video}
            source={videoSource}
            resizeMode="cover"
            shouldPlay
            isLooping={false}
            useNativeControls={false}
            onPlaybackStatusUpdate={(status) => {
              if (status.didJustFinish) {
                handlePlaybackEnd();
              }
            }}
          />
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  absoluteContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: "100%",
    height: "100%",
    backgroundColor: "#000",
    zIndex: 999,
  },
  container: {
    flex: 1,
    backgroundColor: "#000",
    width: "100%",
    height: "100%",
  },
  video: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: "100%",
    height: "100%",
  },
});

export default MissionGameScreen;