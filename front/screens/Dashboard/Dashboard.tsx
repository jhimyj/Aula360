// screens/Dashboard.tsx
import React from "react";
import { useNavigation } from '@react-navigation/native';
import { DrawerNavigationProp } from '@react-navigation/drawer'; // Usa DrawerNavigationProp
import { DrawerNavigatorParamList } from '../../navigation/DrawerNavigator'; // Ajusta según tu estructura
import { Image } from "react-native"

import { View, ScrollView, SafeAreaView, StatusBar, StyleSheet, Button } from "react-native";
import { useFonts, Poppins_400Regular, Poppins_500Medium, Poppins_600SemiBold, Poppins_700Bold } from '@expo-google-fonts/poppins';
import Header from "../CreateRoomCard/Header";
import CreateRoomCard from "../CreateRoomCard/CreateRoomCard";
import ActionCards from "../CreateRoomCard/ActionCards";
import PreviousRooms from "../CreateRoomCard/PreviousRooms";

export default function Dashboard() {
  const navigation = useNavigation<DrawerNavigationProp<DrawerNavigatorParamList>>();

  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
  });

  // Sample data - in a real app, this would come from props or state
  const rooms = [
    {
      id: "1",
      name: "Sala de Comunicación 1° Grado",
      studentCount: 3,
      startDate: "12/05/2025",
      startTime: "9:00 am",
      endDate: "19/05/2025",
      endTime: "9:00 am",
      color: "#4361EE"
    },
    {
      id: "2",
      name: "Matemáticas 2° Grado",
      studentCount: 5,
      startDate: "14/05/2025",
      startTime: "10:30 am",
      endDate: "21/05/2025",
      endTime: "10:30 am",
      color: "#3A0CA3"
    }
  ];

  const handleCreateRoom = () => {
    navigation.navigate("Salas");
    console.log("Create room pressed");
  };

  const handleUploadEvaluation = () => {
    console.log("Upload evaluation pressed");
  };

  const handleViewStudents = () => {
    console.log("View students pressed");
  };

  const handleLogout = () => {
    navigation.navigate("Login"); // Navegar a Login al presionar el botón "Salir"
    console.log("Logged out and navigated to login");
  };

  if (!fontsLoaded) {
    return null; // Or a loading screen
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8F9FA" />
      
      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <CreateRoomCard onPress={handleCreateRoom} />
        
        <ActionCards 
          onUploadEvaluation={handleUploadEvaluation}
          onViewStudents={handleViewStudents}
        />
        
        <PreviousRooms rooms={rooms} />
        
        {/* Agregar el botón de "Salir" */}
        <View style={styles.logoutButtonContainer}>
          <Button title="Salir a Login" onPress={handleLogout} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FA",
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  logoutButtonContainer: {
    marginTop: 20,
    padding: 10,
  }
});
