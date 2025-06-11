"use client";

import React, { useState, useEffect, useRef } from "react";
import { 
  StyleSheet, 
  View, 
  StatusBar, 
  BackHandler, 
  Dimensions,
  Platform,
  Text,
  ActivityIndicator,
  ToastAndroid
} from "react-native";
import { Video, ResizeMode } from "expo-av";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import * as ScreenOrientation from 'expo-screen-orientation';

/**
 * Pantalla que muestra un video a pantalla completa según el personaje seleccionado
 * Optimizada para APK en producción
 */
const MissionGameScreen = ({ navigation }) => {
  const [videoSource, setVideoSource] = useState(null);
  const videoRef = useRef(null);
  const [dimensions, setDimensions] = useState(Dimensions.get("window"));
  const [isVideoReady, setIsVideoReady] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [videoLoaded, setVideoLoaded] = useState(false);

  // Función para actualizar dimensiones
  const updateDimensions = ({ window }) => {
    setDimensions(window);
  };

  // Función para mostrar toast en Android
  const showToast = (message) => {
    if (Platform.OS === 'android') {
      ToastAndroid.show(message, ToastAndroid.SHORT);
    }
    console.log(message);
  };

  // Cargar el personaje seleccionado y configurar el video correspondiente
  useFocusEffect(
    React.useCallback(() => {
      const loadCharacterData = async () => {
        console.log("🚀 MissionGameScreen montado");
        setIsLoading(true);
        setError(null);

        try {
          // Asegurar que la orientación sea la correcta para video
          if (Platform.OS !== 'web') {
            await ScreenOrientation.unlockAsync();
          }

          const savedName = await AsyncStorage.getItem("selectedCharacterName");
          console.log("Nombre del personaje guardado:", savedName);
          
          if (savedName) {
            // Usar un objeto para mapear nombres a recursos
            const videoMapping = {
              Qhapaq: { uri: "https://titels.s3.us-east-2.amazonaws.com/Qhapac-entrada-mision.mp4" },
              Amaru: { uri: "https://titels.s3.us-east-2.amazonaws.com/Amaru-entrada-mision.mp4" },
              Killa: { uri: "https://titels.s3.us-east-2.amazonaws.com/Killa-entrada-mision.mp4" }
            };
            
            // Establecer el video correspondiente o el default
            setVideoSource(videoMapping[savedName] || require("../../assets/videos/Tunel.mp4"));
          } else {
            // Video por defecto si no hay personaje seleccionado
            setVideoSource(require("../../assets/videos/Tunel.mp4"));
          }
        } catch (error) {
          console.error("Error al cargar el nombre del personaje:", error);
          setError("Error al cargar el video. Intente nuevamente.");
          // Usar video por defecto en caso de error
          setVideoSource(require("../../assets/videos/Tunel.mp4"));
        } finally {
          setIsLoading(false);
        }
      };

      loadCharacterData();
      
      // Cleanup function para cuando el componente se desmonta
      return () => {
        if (videoRef.current) {
          try {
            videoRef.current.stopAsync();
            videoRef.current.unloadAsync();
          } catch (e) {
            console.log("Error al limpiar video:", e);
          }
        }
        
        // Restaurar orientación al salir
        if (Platform.OS !== 'web') {
          ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.DEFAULT);
        }
      };
    }, [])
  );

  // Manejar cambios de dimensiones
  useEffect(() => {
    const subscription = Dimensions.addEventListener("change", updateDimensions);
    
    return () => {
      if (subscription?.remove) {
        subscription.remove();
      }
    };
  }, []);

  // Manejar el botón de retroceso en Android
  useEffect(() => {
    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      () => {
        // Pausar y descargar video antes de navegar para liberar memoria
        if (videoRef.current) {
          try {
            videoRef.current.pauseAsync();
            // No descargar completamente para evitar parpadeo
          } catch (e) {
            console.log("Error al pausar video:", e);
          }
        }
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
    console.log("✅ Video finalizado, navegando a mission");
    
    // Pequeño retraso para asegurar que la navegación funcione correctamente
    setTimeout(() => {
      navigation.navigate("Mision");
    }, 100);
  };

  // Manejar cuando el video está listo para reproducir
  const handleVideoLoad = (status) => {
    if (status.isLoaded) {
      setIsVideoReady(true);
      setVideoLoaded(true);
      console.log("Video cargado correctamente");
    } else {
      setError("Error al cargar el video");
      console.log("Error al cargar video:", status);
    }
  };

  // Manejar errores del video
  const handleVideoError = (error) => {
    console.error("Error en reproducción:", error);
    setError("Error en la reproducción del video");
    
    // Intentar recargar el video
    if (videoRef.current) {
      try {
        videoRef.current.unloadAsync().then(() => {
          setTimeout(() => {
            videoRef.current.loadAsync(videoSource);
          }, 1000);
        });
      } catch (e) {
        console.log("Error al recargar video:", e);
      }
    }
  };

  // Reintentar cargar el video
  const retryLoadVideo = () => {
    setError(null);
    setIsLoading(true);
    
    if (videoRef.current) {
      try {
        videoRef.current.unloadAsync().then(() => {
          setTimeout(() => {
            videoRef.current.loadAsync(videoSource);
            setIsLoading(false);
          }, 500);
        });
      } catch (e) {
        console.log("Error al recargar video:", e);
        setIsLoading(false);
        setError("No se pudo cargar el video");
      }
    }
  };

  return (
    <View style={styles.absoluteContainer}>
      <StatusBar hidden />
      <View style={[styles.container, { width: dimensions.width, height: dimensions.height }]}>
        {isLoading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#FFFFFF" />
            <Text style={styles.loadingText}>Cargando video...</Text>
          </View>
        )}
        
        {error && !isLoading && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
            <View style={styles.retryButton}>
              <Text style={styles.retryText} onPress={retryLoadVideo}>
                Reintentar
              </Text>
            </View>
          </View>
        )}
        
        {videoSource && (
          <Video
            ref={videoRef}
            style={styles.video}
            source={videoSource}
            resizeMode={ResizeMode.COVER}
            shouldPlay={!isLoading && !error}
            isLooping={false}
            useNativeControls={false}
            onLoad={handleVideoLoad}
            onPlaybackStatusUpdate={(status) => {
              if (status.didJustFinish) {
                handlePlaybackEnd();
              }
            }}
            onError={handleVideoError}
            // Configuraciones optimizadas para APK
            progressUpdateIntervalMillis={500}
            volume={1.0}
            isMuted={false}
            rate={1.0}
            shouldCorrectPitch={true}
            // Configuraciones específicas para Android
            androidImplementation={Platform.OS === 'android' ? "MediaPlayer" : undefined}
            // Prevenir problemas de memoria
            positionMillis={0}
            // Mejorar rendimiento
            posterSource={null}
            usePoster={false}
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
    justifyContent: "center",
    alignItems: "center",
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
  loadingContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#000",
    zIndex: 10,
  },
  loadingText: {
    color: "#FFFFFF",
    marginTop: 10,
    fontSize: 16,
  },
  errorContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#000",
    zIndex: 10,
    padding: 20,
  },
  errorText: {
    color: "#FF6B6B",
    fontSize: 16,
    textAlign: "center",
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: "#444",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
  },
  retryText: {
    color: "#FFFFFF",
    fontSize: 16,
  },
});

export default MissionGameScreen;