"use client";

import React, { useState, useEffect, useRef } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { StyleSheet, View, StatusBar, BackHandler } from "react-native";
import { Video } from "expo-av"; // ✅ CORRECTO
import AsyncStorage from "@react-native-async-storage/async-storage";

/**
 * Pantalla que muestra un video a pantalla completa según el personaje seleccionado
 * Sin controles adicionales, solo el video
 */
const MissionGameScreen = ({ navigation }) => {
  const [videoSource, setVideoSource] = useState(null);
  const videoRef = useRef(null);
  const [videoKey, setVideoKey] = useState(0);

  // Cargar el personaje seleccionado y configurar el video correspondiente
  useFocusEffect(
    React.useCallback(() => {
      const loadCharacterData = async () => {
        try {
          const savedName = await AsyncStorage.getItem("selectedCharacterName");
          console.log("Nombre del personaje guardado:", savedName);
          if (savedName) {
            switch (savedName) {
              case "Qhapaq":
                setVideoSource(
                  require("..//../assets/EntradaMision/Qhapac-entrada-mision.mp4")
                );
                break;
              case "Amaru":
                setVideoSource(
                  require("..//../assets/EntradaMision/Amaru-entrada-mision.mp4")
                );
                break;
              case "Killa":
                setVideoSource(
                  require("..//../assets/EntradaMision/Killa-entrada-mision.mp4")
                );
                break;
              default:
                setVideoSource(require("../../assets/videos/Tunel.mp4"));
                break;
            }

            // 👇 Fuerza un nuevo render del <Video />
            setVideoKey((prevKey) => prevKey + 1);
          }
        } catch (error) {
          console.error("Error al cargar el nombre del personaje:", error);
        }
      };

      loadCharacterData();
    }, [])
  );

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
    navigation.navigate("Quiz");
  };

  return (
    <View style={styles.container}>
      <StatusBar hidden />
      {videoSource && (
        <Video
          key={videoKey}
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
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  video: {
    flex: 1,
    width: "100%",
    height: "100%",
  },
});

export default MissionGameScreen;