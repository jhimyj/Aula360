import { createNativeStackNavigator } from "@react-navigation/native-stack"
import LoginScreen from "../screens/auth/LoginScreen"
import RegisterScreen from "../screens/auth/RegisterScreen"
import StudentAuthScreen from "../screens/auth/StudentAuthScreen"
import VillainSelectionScreen from "../screens/VillainSelectionScreen/VillainSelectionScreen"
import MissionGameScreen from "../screens/mission-game-screen/mission-game-screen"
import Mision from "../screens/mision/mission-screen"
import BattleScreen from "../screens/Versus/BattleScreen"
import compot from "../screens/QuizScreen/ExampleUsage"
import ResultsScreen from "../screens/ComponentesQuiz/results-screen" //  IMPORT AGREGADO
import AsyncStorage from "@react-native-async-storage/async-storage"
import StudentDashboardScreen from "../screens/Students/StudentDashboardScreen"

export type AuthStackParamList = {
  Login: undefined
  Register: undefined
  StudentAuth: undefined
  VillainSelection: undefined
  MissionGameScreen: undefined
  Mision: undefined
  BattleScreen: undefined
  Quiz: undefined
  Results: undefined //  NUEVO TIPO AGREGADO
  StudentDashboard: undefined //  DASHBOARD PARA ESTUDIANTES
}

const Stack = createNativeStackNavigator<AuthStackParamList>()

export default function AuthStack({ setIsAuthenticated }: { setIsAuthenticated: (val: boolean) => void }) {
  //FUNCIÓN MEJORADA PARA MANEJAR LA AUTENTICACIÓN
  const handleAuthentication = async (value: boolean) => {
    console.log(" handleAuthentication llamado con:", value)

    if (value) {
      try {
        // VERIFICAR QUE TODOS LOS DATOS NECESARIOS ESTÉN PRESENTES
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

        console.log(" Verificando datos de autenticación:")
        console.log("- Método:", method)
        console.log("- Rol:", role)
        console.log("- Token usuario:", hasUserToken)
        console.log("- Token estudiante:", hasStudentToken)

        //  VALIDAR QUE LOS DATOS SEAN CONSISTENTES
        let isValidAuth = false

        if (method === "token" && hasUserToken && role) {
          console.log("ACCESO CON TOKEN: Usuario autenticado con credenciales")
          isValidAuth = true
        } else if (method === "student" && hasStudentToken && role === "STUDENT") {
          console.log("ACCESO COMO ESTUDIANTE: Usuario accediendo como estudiante")
          isValidAuth = true
        } else if (method === "student_with_token" && hasStudentToken && role === "STUDENT") {
          console.log("ACCESO CON TOKEN DE ESTUDIANTE: Estudiante autenticado independientemente")
          isValidAuth = true
        } else if (method === "student_returning" && hasStudentToken && role === "STUDENT") {
          console.log("ACCESO SIN TOKEN: Estudiante que regresa")
          isValidAuth = true
        } else {
          console.log("DATOS DE AUTENTICACIÓN INCONSISTENTES")
          console.log("- Se esperaba método válido y tokens correspondientes")

          //  LIMPIAR DATOS INCONSISTENTES
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
          //  MARCAR COMO AUTENTICADO EN ASYNCSTORAGE
          await AsyncStorage.setItem("isAuthenticated", "true")
          console.log(" Usuario marcado como autenticado")

          //  LIMPIAR FLAGS QUE PUEDAN INTERFERIR CON LA NAVEGACIÓN
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

          //  PROCEDER CON LA AUTENTICACIÓN
          setIsAuthenticated(true)
        } else {
          console.log(" Autenticación fallida - datos inválidos")
          setIsAuthenticated(false)
        }
      } catch (error) {
        console.error("Error al verificar autenticación:", error)
        setIsAuthenticated(false)
      }
    } else {
      //  DESAUTENTICANDO
      console.log("Desautenticando usuario...")

      try {
        // LIMPIAR TODOS LOS DATOS

        console.log(" AsyncStorage completamente limpiado")
      } catch (error) {
        console.error(" Error al limpiar AsyncStorage:", error)
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
              console.log(" Regresando desde StudentAuth")
              props.navigation.goBack()
            }}
          />
        )}
      </Stack.Screen>

      {/*  PANTALLA DE VILLANOS */}
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

      {/* PANTALLA DE MISIONES */}
      <Stack.Screen
        name="Mision"
        component={Mision}
        options={{
          headerShown: true,
          title: "🗺️ Misiones",
          headerStyle: {
            backgroundColor: "#FF8C00",
          },
          headerTintColor: "#fff",
          headerTitleStyle: {
            fontWeight: "bold",
          },
        }}
      />

      {/*  PANTALLA DE BATALLA - SIN BOTÓN DE BACK */}
      <Stack.Screen
        name="BattleScreen"
        component={BattleScreen}
        options={{
          headerShown: true,
          title: "⚔️ Batalla",
          headerStyle: {
            backgroundColor: "#FF8C00",
          },
          headerTintColor: "#fff",
          headerTitleStyle: {
            fontWeight: "bold",
          },
          headerLeft: () => null,
          headerBackVisible: false,
          headerBackButtonMenuEnabled: false,
          gestureEnabled: false,
          headerBackTitleVisible: false,
        }}
      />

      {/*  PANTALLA DE QUIZ - SIN BOTÓN DE BACK */}
      <Stack.Screen
        name="Quiz"
        component={compot}
        options={{
          headerShown: true,
          title: "❓ Quiz",
          headerStyle: {
            backgroundColor: "#FF8C00",
          },
          headerTintColor: "#fff",
          headerTitleStyle: {
            fontWeight: "bold",
          },
          headerLeft: () => null,
          headerBackVisible: false,
          headerBackButtonMenuEnabled: false,
          gestureEnabled: false,
          headerBackTitleVisible: false,
        }}
      />

      {/* 🏆 PANTALLA DE RESULTADOS - SIN BOTÓN DE BACK */}
      <Stack.Screen
        name="Results"
        component={ResultsScreen}
        options={{
          headerShown: true,
          title: "🏆 Resultados",
          headerStyle: {
            backgroundColor: "#FF8C00",
          },
          headerTintColor: "#fff",
          headerTitleStyle: {
            fontWeight: "bold",
          },
          //  MÚLTIPLES FORMAS DE QUITAR EL BOTÓN DE BACK
          headerLeft: () => null,
          headerBackVisible: false,
          headerBackButtonMenuEnabled: false,
          gestureEnabled: false,
          //  PREVENIR NAVEGACIÓN HACIA ATRÁS
          headerBackTitleVisible: false,
        }}
      />

      {/*  PANTALLA DE JUEGO DE MISIÓN */}
      <Stack.Screen
        name="MissionGameScreen"
        component={MissionGameScreen}
        options={{
          headerShown: true,
          title: "🎮 Juego de Misión",
          headerStyle: {
            backgroundColor: "#FF8C00",
          },
          headerTintColor: "#fff",
          headerTitleStyle: {
            fontWeight: "bold",
          },
        }}
      />

      {/*  DASHBOARD PARA ESTUDIANTES */}
      <Stack.Screen
        name="StudentDashboard"
        component={StudentDashboardScreen}
        options={{
          headerShown: true,
          title: "🏠 Dashboard Estudiante",
          headerStyle: {
            backgroundColor: "#4361EE",
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
