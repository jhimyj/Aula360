import React, { useState } from 'react';
import { 
  View, 
  StyleSheet, 
  Animated,
  Keyboard,
  TouchableWithoutFeedback,
  KeyboardAvoidingView,
  Platform,
  ScrollView
} from 'react-native';
import { 
  Provider as PaperProvider, 
  TextInput, 
  Button, 
  Text, 
  Card, 
  Title, 
  Paragraph,
  Appbar,
  useTheme,
  DefaultTheme
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';

// Custom theme based on Material Design
const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: '#FF8C00',
    accent: '#FF6347',
    background: '#F5F5F5',
    surface: '#FFFFFF',
    text: '#333333',
    placeholder: '#9E9E9E'
  },
  roundness: 12,
};

export default function Salas({ onBack }) {
  // Form state
  const [roomName, setRoomName] = useState('');
  const [description, setDescription] = useState('');
  const [course, setCourse] = useState('');
  const [topic, setTopic] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Animation values
  const [buttonScale] = useState(new Animated.Value(1));
  const [formOpacity] = useState(new Animated.Value(0));
  const [formTranslateY] = useState(new Animated.Value(20));
  
  // Form validation
  const [errors, setErrors] = useState({
    roomName: '',
    description: '',
    course: '',
    topic: ''
  });

  // Theme access
  const paperTheme = useTheme();

  // Animate form entrance on component mount
  React.useEffect(() => {
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

  // Validate form fields
  const validateForm = () => {
    let isValid = true;
    const newErrors = {
      roomName: '',
      description: '',
      course: '',
      topic: ''
    };

    if (!roomName.trim()) {
      newErrors.roomName = 'El nombre de la sala es requerido';
      isValid = false;
    }

    if (!description.trim()) {
      newErrors.description = 'La descripción es requerida';
      isValid = false;
    } else if (description.length < 10) {
      newErrors.description = 'La descripción debe tener al menos 10 caracteres';
      isValid = false;
    }

    if (!course.trim()) {
      newErrors.course = 'El curso es requerido';
      isValid = false;
    }

    if (!topic.trim()) {
      newErrors.topic = 'El tema es requerido';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  // Handle form submission
  const handleSubmit = async () => {
    Keyboard.dismiss();
    
    if (validateForm()) {
      setLoading(true);
      
      // Button press animation
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
      
      const roomData = {
        name: roomName,
        description: description,
        course: course,
        topic: topic,
      };

      try {
        // Get token from AsyncStorage
        const token = await AsyncStorage.getItem('userToken');

        if (!token) {
          alert('No se ha encontrado el token de autenticación');
          setLoading(false);
          return;
        }

        // Make API request
        const response = await axios.post(
          'https://iz6hr4i7m9.execute-api.us-east-1.amazonaws.com/dev/rooms/create',
          roomData,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            }
          }
        );
        console.log(response.data)
        // Check if creation was successful
        if (response.status === 200) {
          // Success animation
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
          
          // Show success message
          alert(`¡Sala creada exitosamente!\n\nNombre: ${roomName}\nCurso: ${course}\nTema: ${topic}`);
          
          // Reset form
          setRoomName('');
          setDescription('');
          setCourse('');
          setTopic('');
        } else {
          alert('Error al crear la sala. Intenta nuevamente');
        }
      } catch (error) {
        console.error('Error al enviar datos:', error);
        alert('Error en la conexión al servidor. Por favor intenta nuevamente.');
      } finally {
        setLoading(false);
      }
    }
  };

  // Button animation handlers
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

  return (
    <PaperProvider theme={theme}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.container}
        >
          <Appbar.Header style={styles.appbar}>
            <Appbar.BackAction onPress={onBack} color="#FFF" />
            <Appbar.Content title="Crear Nueva Sala" color="#FFF" />
          </Appbar.Header>
          
          <ScrollView 
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <Animated.View 
              style={[
                styles.formContainer,
                { 
                  opacity: formOpacity,
                  transform: [{ translateY: formTranslateY }]
                }
              ]}
            >
              <Card style={styles.card}>
                <Card.Content>
                  <Paragraph style={styles.cardSubtitle}>
                    Complete los detalles para crear una nueva sala de estudio
                  </Paragraph>
                  
                  {/* Room Name Input */}
                  <TextInput
                    label="Nombre de la Sala"
                    value={roomName}
                    onChangeText={setRoomName}
                    mode="outlined"
                    left={<TextInput.Icon icon="account-group" color={paperTheme.colors.primary} />}
                    style={styles.input}


                    error={!!errors.roomName}
                  />
                  {errors.roomName ? <Text style={styles.errorText}>{errors.roomName}</Text> : null}
                  
                  {/* Description Input */}
                  <TextInput
                    label="Descripción"
                    value={description}
                    onChangeText={setDescription}
                    mode="outlined"
                    left={<TextInput.Icon icon="text-box-outline" color={paperTheme.colors.primary} />}
                    style={styles.input}
                    multiline
                    numberOfLines={3}
                    error={!!errors.description}
                  />
                  {errors.description ? <Text style={styles.errorText}>{errors.description}</Text> : null}
                  
                  {/* Course Input */}
                  <TextInput
                    label="Curso"
                    value={course}
                    onChangeText={setCourse}
                    mode="outlined"
                    left={<TextInput.Icon icon="book-open-variant" color={paperTheme.colors.primary} />}
                    style={styles.input}
                    error={!!errors.course}
                  />
                  {errors.course ? <Text style={styles.errorText}>{errors.course}</Text> : null}
                  
                  {/* Topic Input */}
                  <TextInput
                    label="Tema"
                    value={topic}
                    onChangeText={setTopic}
                    mode="outlined"
                    left={<TextInput.Icon icon="tag-outline" color={paperTheme.colors.primary} />}
                    style={styles.input}
                    error={!!errors.topic}
                  />
                  {errors.topic ? <Text style={styles.errorText}>{errors.topic}</Text> : null}
                </Card.Content>
              </Card>
              
              {/* Submit Button */}
              <Animated.View 
                style={[
                  styles.buttonContainer,
                  { transform: [{ scale: buttonScale }] }
                ]}
              >
                <Button
                  mode="contained"
                  onPress={handleSubmit}
                  onPressIn={handlePressIn}
                  onPressOut={handlePressOut}
                  loading={loading}
                  disabled={loading}
                  style={styles.button}
                  labelStyle={styles.buttonLabel}
                  icon="check-circle"
                >
                  Crear Sala
                </Button>
              </Animated.View>
            </Animated.View>
          </ScrollView>
        </KeyboardAvoidingView>
      </TouchableWithoutFeedback>
    </PaperProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 2,
    backgroundColor: '#F5F5F5',
  },
  appbar: {
    backgroundColor: '#FF8C00',
    elevation: 4,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 16,
  },
  formContainer: {
    width: '100%',
    alignItems: 'center',
    paddingBottom: 24,
  },
  card: {
    width: '100%',
    marginBottom: 20,
    elevation: 4,
    borderRadius: 12,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  cardSubtitle: {
    marginBottom: 20,
    color: '#757575',
  },
  input: {
    marginBottom: 12,
    paddingLeft: 25,  // Da un poco de espacio extra en el lado izquierdo
    backgroundColor: '#FFFFFF',
  },
  errorText: {
    color: '#D32F2F',
    fontSize: 12,
    marginTop: -8,
    marginBottom: 8,
    marginLeft: 8,
  },
  buttonContainer: {
    width: '100%',
    alignItems: 'center',
    marginTop: 8,
  },
  button: {
    width: '80%',
    paddingVertical: 8,
    borderRadius: 30,
    elevation: 4,
  },
  buttonLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    paddingVertical: 4,
  },
});

// Example of how to use this component:
/*
import Salas from './SalasEnhanced';

export default function App() {
  const [showSalas, setShowSalas] = useState(false);
  
  return (
    <View style={{ flex: 1 }}>
      {showSalas ? (
        <Salas onBack={() => setShowSalas(false)} />
      ) : (
        <Button onPress={() => setShowSalas(true)}>
          Crear Sala
        </Button>
      )}
    </View>
  );
}
*/

// Note: This component requires these dependencies:
// - react-native-paper
// - @expo/vector-icons
// - expo-linear-gradient (optional for gradient effects)