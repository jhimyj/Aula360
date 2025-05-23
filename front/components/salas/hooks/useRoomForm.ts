import { useState } from 'react';
import { Keyboard } from 'react-native';
import { validateRoomForm, FormErrors } from '../utils/validation';
import { createRoom } from '../services/roomsService';
import { useFormAnimation } from './useFormAnimation';

export const useRoomForm = () => {
  // Estado del formulario
  const [roomName, setRoomName] = useState('');
  const [description, setDescription] = useState('');
  const [course, setCourse] = useState('');
  const [topic, setTopic] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({
    roomName: '',
    description: '',
    course: '',
    topic: ''
  });
  
  // Obtener animaciones
  const { 
    buttonScale, 
    formOpacity, 
    formTranslateY, 
    handlePressIn, 
    handlePressOut,
    animateSuccess,
    animateButtonPress
  } = useFormAnimation();
  
  // Validar formulario
  const validateForm = () => {
    const { errors: newErrors, isValid } = validateRoomForm({
      roomName,
      description,
      course,
      topic
    });
    
    setErrors(newErrors);
    return isValid;
  };
  
  // Manejar envío del formulario
  const handleSubmit = async () => {
    Keyboard.dismiss();
    
    if (validateForm()) {
      setLoading(true);
      animateButtonPress();
      
      const roomData = {
        name: roomName,
        description,
        course,
        topic,
      };

      try {
        await createRoom(roomData);
        
        // Animación de éxito
        animateSuccess();
        
        // Mostrar mensaje de éxito
        alert(`¡Sala creada exitosamente!\n\nNombre: ${roomName}\nCurso: ${course}\nTema: ${topic}`);
        
        // Resetear formulario
        resetForm();
      } catch (error) {
        
        console.error('Error al enviar datos:', error);
        
        if (error.message === 'No se ha encontrado el token de autenticación') {
          alert('No se ha encontrado el token de autenticación');
        } else {
          alert('Error en la conexión al servidor. Por favor intenta nuevamente.');
        }
      } finally {
        setLoading(false);
      }
    }
  };
  
  // Resetear formulario
  const resetForm = () => {
    setRoomName('');
    setDescription('');
    setCourse('');
    setTopic('');
  };
  
  return {
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
    handleSubmit,
    resetForm
  };
};