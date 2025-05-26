"use client"

import { useState, useEffect } from "react"
import { NavigationContainer } from "@react-navigation/native"
import AsyncStorage from "@react-native-async-storage/async-storage"
import AuthStack from "./navigation/AuthStack"
import DrawerNavigator from "./navigation/DrawerNavigator"
import { View, ActivityIndicator, StyleSheet } from "react-native"

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    checkToken()
  }, [])

  const checkToken = async () => {
    try {
      const token = await AsyncStorage.getItem("userToken")
      const studentToken = await AsyncStorage.getItem("studentToken")
      const userRole = await AsyncStorage.getItem("userRole")

      console.log("🔐 Verificando autenticación en App:")
      console.log("- Token profesor:", !!token)
      console.log("- Token estudiante:", !!studentToken)
      console.log("- Rol de usuario:", userRole)

      const isAuth = !!(token || studentToken)

      if (isAuth) {
        console.log("✅ Usuario autenticado, cargando DrawerNavigator")
      } else {
        console.log("❌ Usuario no autenticado, cargando AuthStack")
      }

      setIsAuthenticated(isAuth)
    } catch (error) {
      console.error("❌ Error al verificar tokens:", error)
      setIsAuthenticated(false)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSetIsAuthenticated = (value: boolean) => {
    console.log("🔄 setIsAuthenticated llamado con:", value)

    if (!value) {
      // Si se está desautenticando, limpiar todo
      AsyncStorage.clear().then(() => {
        console.log("🧹 AsyncStorage limpiado al desautenticar")
      })
    }

    setIsAuthenticated(value)
  }

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF8C00" />
      </View>
    )
  }

  console.log("🎯 Renderizando App con isAuthenticated:", isAuthenticated)

  return (
    <NavigationContainer>
      {isAuthenticated ? (
        <DrawerNavigator setIsAuthenticated={handleSetIsAuthenticated} />
      ) : (
        <AuthStack setIsAuthenticated={handleSetIsAuthenticated} />
      )}
    </NavigationContainer>
  )
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
})
