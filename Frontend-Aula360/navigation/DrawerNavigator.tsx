// navigation/DrawerNavigator.tsx
import React, { useState, useEffect } from 'react';
import { createDrawerNavigator } from '@react-navigation/drawer';
import Dashboard from '../screens/Dashboard/Dashboard';
import Salas from '../screens/Salas/Salas';
import StudentDashboardScreen from '../screens/Students/StudentDashboardScreen'; // Asegúrate de importar esta pantalla
import LoginScreen from '../screens/auth/LoginScreen';
import VillainSelectionScreen from "../screens/VillainSelectionScreen/VillainSelectionScreen" // Ajusta la ruta de la pantalla de villanos
import Register from '../screens/auth/RegisterScreen';
import BattleScreen from '../screens/Versus/BattleScreen';
import Mision from '../screens/ComponentesMision/Mision'; // Ajusta la ruta de la pantalla de misión
import Mision2 from '../screens/ComponentesMision/Mision2';
const Drawer = createDrawerNavigator();
import { Image } from "react-native"

export default function DrawerNavigator() {
  return (
    <Drawer.Navigator>
      <Drawer.Screen name="StudentDashboard" component={StudentDashboardScreen} />
      <Drawer.Screen name="Inicio" component={Dashboard} />
      <Drawer.Screen name="Salas" component={Salas} />
      <Drawer.Screen name="Login" component={LoginScreen} />
      <Drawer.Screen name="Register" component={Register} />
      <Drawer.Screen name="VillainSelection" component={VillainSelectionScreen} />
      <Drawer.Screen name="BattleScreen" component={BattleScreen} />
      <Drawer.Screen name="Mision" component={Mision} />
      <Drawer.Screen name="Mision2" component={Mision2} />
    </Drawer.Navigator>
  );
}
