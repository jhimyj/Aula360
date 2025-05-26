import { createNativeStackNavigator } from "@react-navigation/native-stack"
import LoginScreen from "../screens/auth/LoginScreen"
import RegisterScreen from "../screens/auth/RegisterScreen"
import StudentAuthScreen from "../screens/auth/StudentAuthScreen"
import VillainSelectionScreen from "../screens/VillainSelectionScreen/VillainSelectionScreen" // 🎯 AGREGAR IMPORT
import AsyncStorage from "@react-native-async-storage/async-storage"

export type AuthStackParamList = {
  Login: undefined
  Register: undefined
  StudentAuth: undefined
  VillainSelection: undefined // 🎯 AGREGAR TIPO
}

const Stack = createNativeStackNavigator<AuthStackParamList>()

export default function AuthStack({ setIsAuthenticated }: { setIsAuthenticated: (val: boolean) => void }) {
  // 🎯 FUNCIÓN MEJORADA PARA MANEJAR LA AUTENTICACIÓN
  const handleAuthentication = async (value: boolean) => {
    console.log("🔄 handleAuthentication llamado con:", value)

    if (value) {
      try {
        // 🔍 VERIFICAR QUE TODOS LOS DATOS NECESARIOS ESTÉN PRESENTES
        const [authMethod, userRole, userToken, studentToken] = await AsyncStorage.multiGet([
          "authMethod",
          "userRole",
          "userToken",
          "studentToken",
        ])

        const method = authMethod[1]
        const role = userRole[1]
        const hasUserToken = !!userToken[1]
        const hasStudentToken = !!studentToken[1]

        console.log("🔐 Verificando datos de autenticación:")
        console.log("- Método:", method)
        console.log("- Rol:", role)
        console.log("- Token usuario:", hasUserToken)
        console.log("- Token estudiante:", hasStudentToken)

        // ✅ VALIDAR QUE LOS DATOS SEAN CONSISTENTES
        let isValidAuth = false

        if (method === "token" && hasUserToken && role) {
          console.log("✅ ACCESO CON TOKEN: Usuario autenticado con credenciales")
          isValidAuth = true
        } else if (method === "student" && hasStudentToken && role === "STUDENT") {
          console.log("✅ ACCESO COMO ESTUDIANTE: Usuario accediendo como estudiante")
          isValidAuth = true
        } else if (method === "student_with_token" && hasStudentToken && role === "STUDENT") {
          console.log("✅ ACCESO CON TOKEN DE ESTUDIANTE: Estudiante autenticado independientemente")
          isValidAuth = true
        } else if (method === "student_returning" && hasStudentToken && role === "STUDENT") {
          console.log("✅ ACCESO SIN TOKEN: Estudiante que regresa")
          isValidAuth = true
        } else {
          console.log("❌ DATOS DE AUTENTICACIÓN INCONSISTENTES")
          console.log("- Se esperaba método válido y tokens correspondientes")

          // 🧹 LIMPIAR DATOS INCONSISTENTES
          await AsyncStorage.multiRemove([
            "authMethod",
            "userRole",
            "userToken",
            "studentToken",
            "userInfo",
            "isAuthenticated",
          ])

          console.log("🧹 Datos inconsistentes limpiados")
          isValidAuth = false
        }

        if (isValidAuth) {
          // ✅ MARCAR COMO AUTENTICADO EN ASYNCSTORAGE
          await AsyncStorage.setItem("isAuthenticated", "true")
          console.log("✅ Usuario marcado como autenticado")

          // 🎯 LIMPIAR FLAGS QUE PUEDAN INTERFERIR CON LA NAVEGACIÓN
          await AsyncStorage.multiRemove([
            "showMissionInfo",
            "isInMissionFlow",
            "autoShowMission",
            "missionVisible",
            "currentScreen",
            "navigationFlow",
            "isInCharacterSelection",
            "navigatingToVillain",
          ])

          console.log("🧹 Flags de navegación limpiados")

          // 🚀 PROCEDER CON LA AUTENTICACIÓN
          setIsAuthenticated(true)
        } else {
          console.log("❌ Autenticación fallida - datos inválidos")
          setIsAuthenticated(false)
        }
      } catch (error) {
        console.error("❌ Error al verificar autenticación:", error)
        setIsAuthenticated(false)
      }
    } else {
      // ❌ DESAUTENTICANDO
      console.log("🔓 Desautenticando usuario...")

      try {
        // 🧹 LIMPIAR TODOS LOS DATOS
        await AsyncStorage.clear()
        console.log("🧹 AsyncStorage completamente limpiado")
      } catch (error) {
        console.error("❌ Error al limpiar AsyncStorage:", error)
      }

      setIsAuthenticated(false)
    }
  }

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: "slide_from_right",
        gestureEnabled: true,
      }}
      initialRouteName="Login"
    >
      <Stack.Screen name="Login">
        {(props) => <LoginScreen {...props} setIsAuthenticated={handleAuthentication} />}
      </Stack.Screen>

      <Stack.Screen name="Register">
        {(props) => <RegisterScreen {...props} setIsAuthenticated={handleAuthentication} />}
      </Stack.Screen>

      <Stack.Screen name="StudentAuth">
        {(props) => (
          <StudentAuthScreen
            {...props}
            setIsAuthenticated={handleAuthentication}
            onBack={() => {
              console.log("🔙 Regresando desde StudentAuth")
              props.navigation.goBack()
            }}
          />
        )}
      </Stack.Screen>

      {/* 🎯 PANTALLA DE VILLANOS AGREGADA TEMPORALMENTE PARA PROTOTIPO */}
      <Stack.Screen 
        name="VillainSelection" 
        component={VillainSelectionScreen}
        options={{
          headerShown: true,
          title: "👹 Selección de Villanos",
          headerStyle: {
            backgroundColor: "#FF8C00",
          },
          headerTintColor: "#fff",
          headerTitleStyle: {
            fontWeight: "bold",
          },
        }}
      />
    </Stack.Navigator>
  )
}
