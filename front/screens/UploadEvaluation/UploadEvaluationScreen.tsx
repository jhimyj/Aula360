// screens/UploadEvaluation/UploadEvaluationScreen.tsx
import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  TextInput, 
  KeyboardAvoidingView, 
  Platform,
  Alert,
  ActivityIndicator
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import { useFonts, Poppins_400Regular, Poppins_500Medium, Poppins_600SemiBold, Poppins_700Bold } from '@expo-google-fonts/poppins';
import { useQuestions, QuestionType, DifficultyLevel, Question } from '../../components/hooks/useQuestions';
import { QuestionTypeCard, DifficultyBadge, OptionInput, TagInput } from '../../components/Evaluation/QuestionTypes';

export default function UploadEvaluationScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { roomId, roomName } = route.params as { roomId: string, roomName: string };
  
  const { createQuestion, loading, error } = useQuestions();
  
  const [questionText, setQuestionText] = useState('');
  const [questionType, setQuestionType] = useState<QuestionType>('MULTIPLE_CHOICE_SINGLE');
  const [difficulty, setDifficulty] = useState<DifficultyLevel>('EASY');
  const [score, setScore] = useState('200');
  const [options, setOptions] = useState<string[]>(['', '']);
  const [tags, setTags] = useState<string[]>([]);
  const [step, setStep] = useState(1);
  const [isFormValid, setIsFormValid] = useState(false);

  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
  });

  useEffect(() => {
    // Validar formulario según el paso actual
    if (step === 1) {
      setIsFormValid(questionText.trim().length > 0);
    } else if (step === 2) {
      if (questionType === 'OPEN_ENDED') {
        setIsFormValid(true);
      } else {
        const validOptions = options.filter(opt => opt.trim().length > 0);
        setIsFormValid(validOptions.length >= 2);
      }
    } else if (step === 3) {
      const scoreNum = parseInt(score);
      setIsFormValid(scoreNum >= 100 && scoreNum <= 1000);
    }
  }, [questionText, questionType, options, score, step]);

  const handleAddOption = () => {
    if (options.length < 5) {
      setOptions([...options, '']);
    } else {
      Alert.alert('Límite alcanzado', 'No puedes agregar más de 5 opciones.');
    }
  };

  const handleRemoveOption = (index: number) => {
    if (options.length > 2) {
      const newOptions = [...options];
      newOptions.splice(index, 1);
      setOptions(newOptions);
    } else {
      Alert.alert('Mínimo requerido', 'Debes tener al menos 2 opciones.');
    }
  };

  const handleUpdateOption = (text: string, index: number) => {
    const newOptions = [...options];
    newOptions[index] = text;
    setOptions(newOptions);
  };

  const handleAddTag = (tag: string) => {
    if (!tags.includes(tag)) {
      setTags([...tags, tag]);
    }
  };

  const handleRemoveTag = (index: number) => {
    const newTags = [...tags];
    newTags.splice(index, 1);
    setTags(newTags);
  };

  const handleNext = () => {
    if (step < 3) {
      setStep(step + 1);
    } else {
      handleSubmit();
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    } else {
      navigation.goBack();
    }
  };

  const handleSubmit = async () => {
    try {
      const questionData: Question = {
        room_id: roomId,
        type: questionType,
        text: questionText,
        score: parseInt(score),
        tags: tags.length > 0 ? tags : undefined,
        difficulty: difficulty,
        config: questionType === 'OPEN_ENDED' ? {} : { options: options.filter(opt => opt.trim().length > 0) }
      };

      const questionId = await createQuestion(questionData);
      
      if (questionId) {
        Alert.alert(
          'Pregunta creada',
          'La pregunta ha sido creada exitosamente.',
          [
            { 
              text: 'Crear otra', 
              onPress: () => {
                // Resetear formulario
                setQuestionText('');
                setQuestionType('MULTIPLE_CHOICE_SINGLE');
                setDifficulty('EASY');
                setScore('200');
                setOptions(['', '']);
                setTags([]);
                setStep(1);
              } 
            },
            { 
              text: 'Volver', 
              onPress: () => navigation.goBack() 
            }
          ]
        );
      }
    } catch (error) {
      console.error('Error submitting question:', error);
      Alert.alert('Error', 'No se pudo crear la pregunta. Inténtalo de nuevo.');
    }
  };

  if (!fontsLoaded) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4361EE" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={handleBack}
        >
          <Feather name="arrow-left" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Subir Evaluación</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Progress Indicator */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View 
            style={[
              styles.progressFill, 
              { width: `${(step / 3) * 100}%` }
            ]} 
          />
        </View>
        <Text style={styles.progressText}>Paso {step} de 3</Text>
      </View>

      {/* Room Info */}
      <View style={styles.roomInfoContainer}>
        <View style={styles.roomBadge}>
          <Feather name="book-open" size={16} color="#4361EE" />
        </View>
        <Text style={styles.roomName}>{roomName || 'Sala seleccionada'}</Text>
      </View>

      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {step === 1 && (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>¿Qué quieres preguntar?</Text>
            <Text style={styles.stepDescription}>Escribe el texto de tu pregunta y selecciona el tipo.</Text>
            
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Texto de la pregunta</Text>
              <TextInput
                style={styles.textInput}
                value={questionText}
                onChangeText={setQuestionText}
                placeholder="Ej: ¿Cuál es la capital de Francia?"
                placeholderTextColor="#999"
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>

            <Text style={styles.sectionTitle}>Tipo de pregunta</Text>
            
            <QuestionTypeCard
              type="MULTIPLE_CHOICE_SINGLE"
              title="Opción múltiple (una respuesta)"
              description="El estudiante selecciona una opción correcta"
              icon={<Feather name="check-circle" size={24} color="#4361EE" />}
              selected={questionType === 'MULTIPLE_CHOICE_SINGLE'}
              onSelect={() => setQuestionType('MULTIPLE_CHOICE_SINGLE')}
            />
            
            <QuestionTypeCard
              type="MULTIPLE_CHOICE_MULTIPLE"
              title="Opción múltiple (varias respuestas)"
              description="El estudiante puede seleccionar varias opciones"
              icon={<Feather name="check-square" size={24} color="#4361EE" />}
              selected={questionType === 'MULTIPLE_CHOICE_MULTIPLE'}
              onSelect={() => setQuestionType('MULTIPLE_CHOICE_MULTIPLE')}
            />
            
            <QuestionTypeCard
              type="OPEN_ENDED"
              title="Respuesta abierta"
              description="El estudiante escribe una respuesta libre"
              icon={<Feather name="edit-3" size={24} color="#4361EE" />}
              selected={questionType === 'OPEN_ENDED'}
              onSelect={() => setQuestionType('OPEN_ENDED')}
            />
          </View>
        )}

        {step === 2 && (
          <View style={styles.stepContainer}>
            {questionType !== 'OPEN_ENDED' ? (
              <>
                <Text style={styles.stepTitle}>Opciones de respuesta</Text>
                <Text style={styles.stepDescription}>
                  Agrega entre 2 y 5 opciones para tu pregunta de opción múltiple.
                </Text>
                
                <View style={styles.optionsContainer}>
                  {options.map((option, index) => (
                    <OptionInput
                      key={index}
                      value={option}
                      onChange={(text) => handleUpdateOption(text, index)}
                      onRemove={() => handleRemoveOption(index)}
                      index={index}
                    />
                  ))}
                  
                  {options.length < 5 && (
                    <TouchableOpacity 
                      style={styles.addOptionButton} 
                      onPress={handleAddOption}
                      activeOpacity={0.8}
                    >
                      <Feather name="plus" size={20} color="#4361EE" />
                      <Text style={styles.addOptionText}>Agregar opción</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </>
            ) : (
              <>
                <Text style={styles.stepTitle}>Respuesta abierta</Text>
                <Text style={styles.stepDescription}>
                  Has seleccionado una pregunta de respuesta abierta. Los estudiantes podrán escribir libremente su respuesta.
                </Text>
                
                <View style={styles.openEndedInfo}>
                  <Feather name="info" size={24} color="#4361EE" />
                  <Text style={styles.openEndedInfoText}>
                    Las respuestas abiertas deberán ser revisadas manualmente para asignar puntaje.
                  </Text>
                </View>
              </>
            )}
          </View>
        )}

        {step === 3 && (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Detalles finales</Text>
            <Text style={styles.stepDescription}>
              Configura la dificultad, puntaje y etiquetas para tu pregunta.
            </Text>
            
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Puntaje (100-1000)</Text>
              <TextInput
                style={styles.scoreInput}
                value={score}
                onChangeText={setScore}
                placeholder="200"
                placeholderTextColor="#999"
                keyboardType="number-pad"
              />
            </View>
            
            <Text style={styles.sectionTitle}>Dificultad</Text>
            <View style={styles.difficultyContainer}>
              <DifficultyBadge
                difficulty="EASY"
                selected={difficulty === 'EASY'}
                onSelect={() => setDifficulty('EASY')}
              />
              <DifficultyBadge
                difficulty="MEDIUM"
                selected={difficulty === 'MEDIUM'}
                onSelect={() => setDifficulty('MEDIUM')}
              />
              <DifficultyBadge
                difficulty="HARD"
                selected={difficulty === 'HARD'}
                onSelect={() => setDifficulty('HARD')}
              />
            </View>
            
            <Text style={styles.sectionTitle}>Etiquetas (opcional)</Text>
            <Text style={styles.sectionDescription}>
              Agrega etiquetas para categorizar tu pregunta.
            </Text>
            
            <TagInput
              tags={tags}
              onAddTag={handleAddTag}
              onRemoveTag={handleRemoveTag}
            />
          </View>
        )}

        {error && (
          <View style={styles.errorContainer}>
            <Feather name="alert-circle" size={20} color="#FF4444" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity 
          style={[styles.nextButton, !isFormValid && styles.disabledButton]} 
          onPress={handleNext}
          disabled={!isFormValid || loading}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <>
              <Text style={styles.nextButtonText}>
                {step < 3 ? 'Siguiente' : 'Crear pregunta'}
              </Text>
              <Feather 
                name={step < 3 ? 'arrow-right' : 'check'} 
                size={20} 
                color="#FFFFFF" 
              />
            </>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F8F9FA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: 'Poppins_600SemiBold',
    color: '#333',
  },
  placeholder: {
    width: 40,
  },
  progressContainer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
  },
  progressBar: {
    height: 6,
    backgroundColor: '#E0E0E0',
    borderRadius: 3,
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4361EE',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    fontFamily: 'Poppins_500Medium',
    color: '#666',
  },
  roomInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#F0F4FF',
  },
  roomBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  roomName: {
    fontSize: 14,
    fontFamily: 'Poppins_500Medium',
    color: '#4361EE',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 100,
  },
  stepContainer: {
    marginBottom: 20,
  },
  stepTitle: {
    fontSize: 20,
    fontFamily: 'Poppins_600SemiBold',
    color: '#333',
    marginBottom: 8,
  },
  stepDescription: {
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
    color: '#666',
    marginBottom: 24,
  },
  inputContainer: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 14,
    fontFamily: 'Poppins_500Medium',
    color: '#333',
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
    color: '#333',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    minHeight: 120,
  },
  scoreInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
    color: '#333',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    height: 56,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: 'Poppins_600SemiBold',
    color: '#333',
    marginBottom: 12,
    marginTop: 8,
  },
  sectionDescription: {
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
    color: '#666',
    marginBottom: 16,
  },
  optionsContainer: {
    marginBottom: 24,
  },
  addOptionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F0F4FF',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#4361EE20',
    borderStyle: 'dashed',
  },
  addOptionText: {
    fontSize: 14,
    fontFamily: 'Poppins_500Medium',
    color: '#4361EE',
    marginLeft: 8,
  },
  openEndedInfo: {
    flexDirection: 'row',
    backgroundColor: '#F0F4FF',
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
  },
  openEndedInfoText: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
    color: '#4361EE',
    marginLeft: 12,
  },
  difficultyContainer: {
    flexDirection: 'row',
    marginBottom: 24,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
  },
  nextButton: {
    backgroundColor: '#4361EE',
    borderRadius: 12,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabledButton: {
    backgroundColor: '#A0A0A0',
  },
  nextButtonText: {
    fontSize: 16,
    fontFamily: 'Poppins_600SemiBold',
    color: '#FFFFFF',
    marginRight: 8,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFEBEE',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
    color: '#FF4444',
    marginLeft: 8,
  },
});