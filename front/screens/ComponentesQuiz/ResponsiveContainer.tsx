import React from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Dimensions,
  Platform,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface ResponsiveContainerProps {
  children: React.ReactNode;
  backgroundColor?: string;
  enableScroll?: boolean;
  contentContainerStyle?: any;
  style?: any;
}

const ResponsiveContainer: React.FC<ResponsiveContainerProps> = ({
  children,
  backgroundColor = '#000',
  enableScroll = true,
  contentContainerStyle,
  style,
}) => {
  const insets = useSafeAreaInsets();
  const { width, height } = Dimensions.get('window');
  
  // Detectar tipo de dispositivo
  const isTablet = width >= 768;
  const isLandscape = width > height;
  
  // Calcular padding dinámico
  const dynamicPadding = {
    paddingTop: Math.max(insets.top, isTablet ? 20 : 10),
    paddingBottom: Math.max(insets.bottom, isTablet ? 20 : 10),
    paddingHorizontal: isTablet ? 24 : 16,
  };

  const containerStyle = [
    styles.container,
    {
      backgroundColor,
      minHeight: height,
      width: '100%',
    },
    style,
  ];

  const contentStyle = [
    styles.content,
    dynamicPadding,
    {
      minHeight: height - (insets.top + insets.bottom),
    },
    contentContainerStyle,
  ];

  if (!enableScroll) {
    return (
      <SafeAreaView style={containerStyle}>
        <StatusBar backgroundColor={backgroundColor} barStyle="light-content" />
        <View style={contentStyle}>
          {children}
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={containerStyle}>
      <StatusBar backgroundColor={backgroundColor} barStyle="light-content" />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={contentStyle}
        showsVerticalScrollIndicator={false}
        bounces={true}
        scrollEventThrottle={16}
        keyboardShouldPersistTaps="handled"
      >
        {children}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
  },
});

export default ResponsiveContainer;
