// navigation/DrawerNavigator.tsx
import React from 'react';
import { createDrawerNavigator } from '@react-navigation/drawer';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { TouchableOpacity, Text, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Dashboard from '../screens/Dashboard/Dashboard';
import Salas from '../components/salas/index';
import StudentDashboardScreen from '../screens/Students/StudentDashboardScreen';
import VillainSelectionScreen from "../screens/VillainSelectionScreen/VillainSelectionScreen";
import BattleScreen from '../screens/Versus/BattleScreen';

import Mision from '../screens/mision/mission-screen';
import MissionGameScreen from '../screens/mission-game-screen/mission-game-screen';
import compot from '../../front/screens/QuizScreen/ExampleUsage';
import ResultsScreen from "../screens/ComponentesQuiz/results-screen";
import AllRooms from '../screens/AllRooms/AllRooms';
import UploadEvaluationScreen from '../screens/UploadEvaluation/UploadEvaluationScreen';

export type DrawerNavigatorParamList = {
  StudentDashboard: undefined;
  Inicio: undefined;
  Salas: undefined;
  AllRooms: undefined;
  UploadEvaluation: { roomId: string; roomName: string }; // Agregar esta línea
  VillainSelection: undefined;
  BattleScreen: undefined;
  Mision: undefined;
  MissionGameScreen: undefined;
  Quiz: undefined;
  Results: undefined;
};

const Drawer = createDrawerNavigator<DrawerNavigatorParamList>();

// Crear un componente wrapper que maneje el logout
function DrawerNavigatorContent({ setIsAuthenticated }: { setIsAuthenticated: (val: boolean) => void }) {
  const handleLogout = async () => {
    Alert.alert(
      'Cerrar Sesión',
      '¿Estás seguro de que quieres cerrar sesión?',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Cerrar Sesión',
          style: 'destructive',
          onPress: async () => {
            try {
              await AsyncStorage.removeItem('userToken');
              setIsAuthenticated(false);
            } catch (error) {
              console.error('Error al cerrar sesión:', error);
            }
          },
        },
      ]
    );
  };

  return (
    <Drawer.Navigator
      screenOptions={({ navigation }) => ({
        headerStyle: {
          backgroundColor: '#FF8C00',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
        headerRight: () => (
          <TouchableOpacity
            onPress={handleLogout}
            style={{ marginRight: 15, padding: 5 }}
          >
            <Ionicons name="log-out-outline" size={24} color="#fff" />
          </TouchableOpacity>
        ),
        drawerActiveTintColor: '#FF8C00',
        drawerInactiveTintColor: '#333',
      })}
    >
      <Drawer.Screen 
        name="StudentDashboard" 
        component={StudentDashboardScreen}
        options={{ 
          title: "Panel de Estudiante",
          drawerIcon: ({ color, size }) => (
            <Ionicons name="school-outline" size={size} color={color} />
          ),
        }}
      />
      <Drawer.Screen 
        name="Inicio" 
        component={Dashboard}
        options={{ 
          title: "Dashboard",
          drawerIcon: ({ color, size }) => (
            <Ionicons name="home-outline" size={size} color={color} />
          ),
        }}
      />
      <Drawer.Screen 
        name="Salas" 
        component={Salas}
        options={{
          title: "Crear Salas",
          drawerIcon: ({ color, size }) => (
            <Ionicons name="people-outline" size={size} color={color} />
          ),
        }}
      />
      <Drawer.Screen 
        name="AllRooms" 
        component={AllRooms}
        options={{ 
          title: "Todas las Salas",
          drawerIcon: ({ color, size }) => (
            <Ionicons name="list-outline" size={size} color={color} />
          ),
        }}
      />
      {/* Agregar la nueva pantalla UploadEvaluation */}
      <Drawer.Screen 
        name="UploadEvaluation" 
        component={UploadEvaluationScreen}
        options={{ 
          title: "Subir Evaluación",
          drawerIcon: ({ color, size }) => (
            <Ionicons name="cloud-upload-outline" size={size} color={color} />
          ),
          // Ocultar del drawer ya que se accede desde el dashboard
          drawerItemStyle: { display: 'none' }
        }}
      />
      <Drawer.Screen 
        name="VillainSelection" 
        component={VillainSelectionScreen}
        options={{ 
          title: "Selección de Villano",
          drawerIcon: ({ color, size }) => (
            <Ionicons name="skull-outline" size={size} color={color} />
          ),
        }}
      />
      <Drawer.Screen 
        name="BattleScreen" 
        component={BattleScreen}
        options={{ 
          title: "Batalla",
          drawerIcon: ({ color, size }) => (
            <Ionicons name="flash-outline" size={size} color={color} />
          ),
        }}
      />
      <Drawer.Screen 
        name="Mision" 
        component={Mision}
        options={{ 
          title: "Misiones",
          drawerIcon: ({ color, size }) => (
            <Ionicons name="map-outline" size={size} color={color} />
          ),
        }}
      />
      <Drawer.Screen 
        name="MissionGameScreen" 
        component={MissionGameScreen}
        options={{ 
          title: "Juego de Misión",
          drawerIcon: ({ color, size }) => (
            <Ionicons name="game-controller-outline" size={size} color={color} />
          ),
        }}
      />
      <Drawer.Screen 
        name="Quiz" 
        component={compot}
        options={{ 
          title: "Quiz",
          drawerIcon: ({ color, size }) => (
            <Ionicons name="help-circle-outline" size={size} color={color} />
          ),
        }}
      />
      <Drawer.Screen 
        name="Results" 
        component={ResultsScreen} 
        options={{ 
          title: "Resultados",
          drawerIcon: ({ color, size }) => (
            <Ionicons name="trophy-outline" size={size} color={color} />
          ),
        }} 
      />
    </Drawer.Navigator>
  );
}

export default DrawerNavigatorContent;