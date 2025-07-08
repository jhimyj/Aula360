// components/Questions/QuestionsModal.tsx
import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Modal, 
  TouchableOpacity, 
  FlatList, 
  SafeAreaView,
  Dimensions,
  ActivityIndicator,
  ScrollView
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useFonts, Poppins_400Regular, Poppins_500Medium, Poppins_600SemiBold, Poppins_700Bold } from '@expo-google-fonts/poppins';

interface Question {
  id: string;
  text: string;
  type: string;
  difficulty: string;
  score: number;
  tags?: string[];
  config?: {
    options?: string[];
  };
  created_at: string;
  updated_at: string;
}

interface QuestionsModalProps {
  visible: boolean;
  onClose: () => void;
  questions: Question[];
  roomName: string;
  loading?: boolean;
  error?: string | null;
}

const { width, height } = Dimensions.get('window');

const QuestionsModal = ({ 
  visible, 
  onClose, 
  questions, 
  roomName,
  loading = false,
  error = null
}: QuestionsModalProps) => {
  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold
  });

  if (!fontsLoaded) {
    return null;
  }

  // Función para obtener el color según la dificultad
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty?.toUpperCase()) {
      case 'EASY':
        return '#4CAF50';
      case 'MEDIUM':
        return '#FF9800';
      case 'HARD':
        return '#F44336';
      default:
        return '#9E9E9E';
    }
  };

  // Función para obtener el texto de la dificultad
  const getDifficultyText = (difficulty: string) => {
    switch (difficulty?.toUpperCase()) {
      case 'EASY':
        return 'Fácil';
      case 'MEDIUM':
        return 'Medio';
      case 'HARD':
        return 'Difícil';
      default:
        return 'Sin definir';
    }
  };

  // Función para obtener el icono según el tipo de pregunta
  const getQuestionTypeIcon = (type: string) => {
    switch (type) {
      case 'MULTIPLE_CHOICE_SINGLE':
        return 'check-circle';
      case 'MULTIPLE_CHOICE_MULTIPLE':
        return 'check-square';
      case 'OPEN_ENDED':
        return 'edit-3';
      case 'TRUE_FALSE':
        return 'help-circle';
      default:
        return 'help-circle';
    }
  };

  // Función para obtener el texto del tipo de pregunta
  const getQuestionTypeText = (type: string) => {
    switch (type) {
      case 'MULTIPLE_CHOICE_SINGLE':
        return 'Opción múltiple (única)';
      case 'MULTIPLE_CHOICE_MULTIPLE':
        return 'Opción múltiple (varias)';
      case 'OPEN_ENDED':
        return 'Respuesta abierta';
      case 'TRUE_FALSE':
        return 'Verdadero/Falso';
      default:
        return 'Tipo desconocido';
    }
  };

  const renderQuestionCard = ({ item, index }: { item: Question; index: number }) => (
    <View style={styles.questionCard}>
      <View style={styles.questionHeader}>
        <View style={styles.questionNumber}>
          <Text style={styles.questionNumberText}>{index + 1}</Text>
        </View>
        
        <View style={styles.questionMeta}>
          <View style={[styles.difficultyBadge, { backgroundColor: getDifficultyColor(item.difficulty) }]}>
            <Text style={styles.difficultyText}>{getDifficultyText(item.difficulty)}</Text>
          </View>
          
          <View style={styles.scoreBadge}>
            <Feather name="star" size={12} color="#FF9800" />
            <Text style={styles.scoreText}>{item.score} pts</Text>
          </View>
        </View>
      </View>
      
      <Text style={styles.questionText}>{item.text || 'Sin texto'}</Text>
      
      <View style={styles.questionType}>
        <Feather name={getQuestionTypeIcon(item.type)} size={16} color="#4361EE" />
        <Text style={styles.questionTypeText}>{getQuestionTypeText(item.type)}</Text>
      </View>
      
      {item.config?.options && item.config.options.length > 0 && (
        <View style={styles.optionsContainer}>
          <Text style={styles.optionsTitle}>Opciones:</Text>
          {item.config.options.map((option, optionIndex) => (
            <View key={optionIndex} style={styles.optionItem}>
              <View style={styles.optionBullet}>
                <Text style={styles.optionBulletText}>{String.fromCharCode(65 + optionIndex)}</Text>
              </View>
              <Text style={styles.optionText}>{option || 'Opción sin texto'}</Text>
            </View>
          ))}
        </View>
      )}
      
      {item.tags && item.tags.length > 0 && (
        <View style={styles.tagsContainer}>
          <Text style={styles.tagsTitle}>Etiquetas:</Text>
          <View style={styles.tagsWrapper}>
            {item.tags.map((tag, tagIndex) => (
              <View key={tagIndex} style={styles.tag}>
                <Text style={styles.tagText}>{tag || 'Sin etiqueta'}</Text>
              </View>
            ))}
          </View>
        </View>
      )}
      
      <View style={styles.questionFooter}>
        <Text style={styles.dateText}>
          Creada: {new Date(item.created_at).toLocaleDateString('es-ES')}
        </Text>
        {item.updated_at !== item.created_at && (
          <Text style={styles.dateText}>
            Actualizada: {new Date(item.updated_at).toLocaleDateString('es-ES')}
          </Text>
        )}
      </View>
    </View>
  );

  const EmptyComponent = () => (
    <View style={styles.emptyContainer}>
      <Feather name="help-circle" size={64} color="#E0E0E0" />
      <Text style={styles.emptyTitle}>No hay preguntas</Text>
      <Text style={styles.emptyText}>
        Esta sala aún no tiene preguntas creadas.
      </Text>
    </View>
  );

  const ErrorComponent = () => (
    <View style={styles.errorContainer}>
      <Feather name="alert-circle" size={64} color="#F44336" />
      <Text style={styles.errorTitle}>Error al cargar preguntas</Text>
      <Text style={styles.errorText}>{error || 'Error desconocido'}</Text>
    </View>
  );

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <View style={styles.headerLeft}>
              <Text style={styles.modalTitle}>Preguntas</Text>
              <Text style={styles.roomNameText}>{roomName || 'Sin nombre'}</Text>
            </View>
            <TouchableOpacity 
              style={styles.closeButton} 
              onPress={onClose}
            >
              <Feather name="x" size={24} color="#666" />
            </TouchableOpacity>
          </View>
          
          {!loading && !error && questions && questions.length > 0 && (
            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{questions.length}</Text>
                <Text style={styles.statLabel}>Preguntas</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>
                  {questions.reduce((sum, q) => sum + (q.score || 0), 0)}
                </Text>
                <Text style={styles.statLabel}>Puntos totales</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>
                  {new Set(questions.map(q => q.type)).size}
                </Text>
                <Text style={styles.statLabel}>Tipos</Text>
              </View>
            </View>
          )}
          
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#4361EE" />
              <Text style={styles.loadingText}>Cargando preguntas...</Text>
            </View>
          ) : error ? (
            <ErrorComponent />
          ) : (
            <FlatList
              data={questions || []}
              renderItem={renderQuestionCard}
              keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
              contentContainerStyle={styles.questionsList}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={EmptyComponent}
            />
          )}
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    marginTop: 50,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  headerLeft: {
    flex: 1,
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: 'Poppins_600SemiBold',
    color: '#333',
  },
  roomNameText: {
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
    color: '#666',
    marginTop: 2,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontFamily: 'Poppins_700Bold',
    color: '#4361EE',
  },
  statLabel: {
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
    color: '#666',
    marginTop: 4,
  },
  questionsList: {
    padding: 20,
  },
  questionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  questionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  questionNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#4361EE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  questionNumberText: {
    fontSize: 14,
    fontFamily: 'Poppins_600SemiBold',
    color: '#FFFFFF',
  },
  questionMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  difficultyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
  },
  difficultyText: {
    fontSize: 10,
    fontFamily: 'Poppins_600SemiBold',
    color: '#FFFFFF',
  },
  scoreBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF3E0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  scoreText: {
    fontSize: 10,
    fontFamily: 'Poppins_600SemiBold',
    color: '#FF9800',
    marginLeft: 4,
  },
  questionText: {
    fontSize: 16,
    fontFamily: 'Poppins_500Medium',
    color: '#333',
    lineHeight: 24,
    marginBottom: 12,
  },
  questionType: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  questionTypeText: {
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
    color: '#4361EE',
    marginLeft: 6,
  },
  optionsContainer: {
    marginBottom: 12,
  },
  optionsTitle: {
    fontSize: 14,
    fontFamily: 'Poppins_600SemiBold',
    color: '#333',
    marginBottom: 8,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  optionBullet: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#F0F4FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  optionBulletText: {
    fontSize: 12,
    fontFamily: 'Poppins_600SemiBold',
    color: '#4361EE',
  },
  optionText: {
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
    color: '#333',
    flex: 1,
  },
  tagsContainer: {
    marginBottom: 12,
  },
  tagsTitle: {
    fontSize: 14,
    fontFamily: 'Poppins_600SemiBold',
    color: '#333',
    marginBottom: 8,
  },
  tagsWrapper: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  tag: {
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 6,
    marginBottom: 4,
  },
  tagText: {
    fontSize: 10,
    fontFamily: 'Poppins_500Medium',
    color: '#1976D2',
  },
  questionFooter: {
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    paddingTop: 8,
  },
  dateText: {
    fontSize: 10,
    fontFamily: 'Poppins_400Regular',
    color: '#999',
    marginBottom: 2,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    fontFamily: 'Poppins_400Regular',
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontFamily: 'Poppins_600SemiBold',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
    color: '#666',
    textAlign: 'center',
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  errorTitle: {
    fontSize: 18,
    fontFamily: 'Poppins_600SemiBold',
    color: '#F44336',
    marginTop: 16,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
    color: '#666',
    textAlign: 'center',
  },
});

export default QuestionsModal;