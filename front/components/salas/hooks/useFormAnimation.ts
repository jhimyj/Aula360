import { useState, useEffect } from 'react';
import { Animated } from 'react-native';

export const useFormAnimation = () => {
  const [buttonScale] = useState(new Animated.Value(1));
  const [formOpacity] = useState(new Animated.Value(0));
  const [formTranslateY] = useState(new Animated.Value(20));
  
  // Animación de entrada del formulario
  useEffect(() => {
    Animated.parallel([
      Animated.timing(formOpacity, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(formTranslateY, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // Animación de botón al presionar
  const handlePressIn = () => {
    Animated.spring(buttonScale, {
      toValue: 0.95,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(buttonScale, {
      toValue: 1,
      friction: 5,
      tension: 40,
      useNativeDriver: true,
    }).start();
  };

  // Animación de éxito
  const animateSuccess = () => {
    Animated.sequence([
      Animated.timing(formOpacity, {
        toValue: 0.7,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(formOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  };

  // Animación de botón al enviar
  const animateButtonPress = () => {
    Animated.sequence([
      Animated.timing(buttonScale, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(buttonScale, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  return {
    buttonScale,
    formOpacity,
    formTranslateY,
    handlePressIn,
    handlePressOut,
    animateSuccess,
    animateButtonPress
  };
};