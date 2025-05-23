import React from 'react';
import { 
  StyleSheet, 
  Animated,
  View
} from 'react-native';
import { 
  TextInput, 
  Button, 
  Text, 
  Card, 
  Paragraph,
  useTheme
} from 'react-native-paper';
import { useRoomForm } from './hooks/useRoomForm';

export const SalasForm = () => {
  const {
    // Estado
    roomName,
    description,
    course,
    topic,
    loading,
    errors,
    
    // Setters
    setRoomName,
    setDescription,
    setCourse,
    setTopic,
    
    // Animaciones
    buttonScale,
    formOpacity,
    formTranslateY,
    handlePressIn,
    handlePressOut,
    
    // Acciones
    handleSubmit
  } = useRoomForm();
  
  // Acceso al tema
  const paperTheme = useTheme();
  
  return (
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
          Crear SalW
        </Button>
      </Animated.View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
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
  cardSubtitle: {
    marginBottom: 20,
    color: '#757575',
  },
  input: {
    marginBottom: 12,
    paddingLeft: 25,
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