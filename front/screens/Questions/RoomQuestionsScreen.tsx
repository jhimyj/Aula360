// screens/Questions/RoomQuestionsScreen.tsx
import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  TouchableOpacity, 
  FlatList, 
  ActivityIndicator,
  RefreshControl,
  Alert
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import { useFonts, Poppins_400Regular, Poppins_500Medium, Poppins_600SemiBold, Poppins_700Bold } from '@expo-google-fonts/poppins';
import { useQuestions, Question, QuestionType, DifficultyLevel } from '../../hooks/useQuestions';

export default function RoomQuestionsScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { roomId, roomName } = route.params as { roomId: string, roomName: string };
  
  const { getQuestionsByRoom, loading, error } = useQuestions();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
  });

  useEffect(() => {
    fetchQuestions();
  }, [roomId]);

  const fetchQuestions = async () => {
    try {
      const fetchedQuestions = await getQuestionsByRoom(roomId);
      if (fetchedQuestions) {
        setQuestions(fetchedQuestions);
      }
    } catch (error) {
      console.error('Error fetching questions:', error);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchQuestions();
    setRefreshing(false);
  };

  const handleAddQuestion = () => {
    navigation.navigate('UploadEvaluation', { roomId, roomName });
  };

  const getQuestionTypeLabel = (type: QuestionType) => {
    switch (type) {
      case 'MULTIPLE_CHOICE_SINGLE':
        return 'Opción múltiple (una respuesta)';
      case 'MULTIPLE_CHOICE_MULTIPLE':
        return 'Opción múltiple (varias respuestas)';
      case 'OPEN_ENDED':
        return 'Respuesta abierta';
      default:
        return 'Desconocido';
    }
  };

  const getDifficultyColor = (difficulty: DifficultyLevel) => {
    switch (difficulty) {
      case 'EASY':
        return '#4CAF50';
      case 'MEDIUM':
        return '#FF9800';
      case 'HARD':
        return '#F44336';
      default:
        return '#999';
    }
  };

  const getDifficultyLabel = (difficulty: DifficultyLevel) => {
    switch (difficulty) {
      case 'EASY':
        return 'Fácil';
      case 'MEDIUM':
        return 'Media';
      case 'HARD':
        return 'Difícil';
      default:
        return 'Desconocido';
    }
  };

  const renderQuestionCard = ({ item }: { item: Question }) => (
    <View style={styles.questionCard}>
      <View style={styles.questionHeader}>
        <View 
          style={[
            styles.difficultyBadge, 
            { backgroundColor: getDifficultyColor(item.difficulty) }
          ]}
        >
          <Text style={styles.difficultyText}>
            {getDifficultyLabel(item.difficulty)}
          </Text>
        </View>
        <Text style={styles.scoreText}>{item.score} pts</Text>
      </View>
      
      <Text style={styles.questionText}>{item.text}</Text>
      
      <View style={styles.questionTypeContainer}>
        <Feather 
          name={
            item.type === 'MULTIPLE_CHOICE_SINGLE' ? 'check-circle' : 
            item.type === 'MULTIPLE_CHOICE_MULTIPLE' ? 'check-square' : 
            'edit-3'
          } 
          size={16} 
          color="#4361EE" 
        />
        <Text style={styles.questionTypeText}>
          {getQuestionTypeLabel(item.type)}
        </Text>
      </View>
      
      {item.type !== 'OPEN_ENDED' && item.config.options && (
        <View style={styles.optionsContainer}>
          {item.config.options.map((option, index) => (
            <View key={index} style={styles.optionItem}>
              <View style={styles.optionBullet}>
                <Text style={styles.optionBulletText}>{index + 1}</Text>
              </View>
              <Text style={styles.optionText}>{option}</Text>
            </View>
          ))}
        </View>
      )}
      
      {item.tags && item.tags.length > 0 && (
        <View style={styles.tagsContainer}>
          {item.tags.map((tag, index) => (
            <View key={index} style={styles.tagBadge}>
              <Text style={styles.tagText}>{tag}</Text>
            </View>
          ))}
        </View>
      )}
      
      <View style={styles.questionFooter}>
        <Text style={styles.dateText}>
          Creada: {new Date(item.created_at || '').toLocaleDateString()}
        </Text>
        
        <TouchableOpacity 
          style={styles.moreButton}
          onPress={() => {
            // Aquí podrías implementar opciones para editar o eliminar
            Alert.alert(
              'Opciones',
              '¿Qué deseas hacer con esta pregunta?',
              [
                { text: 'Cancelar', style: 'cancel' },
                { 
                  text: 'Editar', 
                  onPress: () => Alert.alert('Próximamente', 'La edición de preguntas estará disponible pronto.')
                },
                { 
                  text: 'Eliminar', 
                  style: 'destructive',
                  onPress: () => Alert.alert('Próximamente', 'La eliminación de preguntas estará disponible pronto.')
                }
              ]
            );
          }}
        >
          <Feather name="more-horizontal" size={20} color="#666" />
        </TouchableOpacity>
      </View>
    </View>
  );

  if (!fontsLoaded) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4361EE" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => navigation.goBack()}
        >
          <Feather name="arrow-left" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Preguntas</Text>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={handleAddQuestion}
        >
          <Feather name="plus" size={24} color="#4361EE" />
        </TouchableOpacity>
      </View>

      {/* Room Info */}
      <View style={styles.roomInfoContainer}>
        <View style={styles.roomIconContainer}>
          <Feather name="book-open" size={20} color="#4361EE" />
        </View>
        <Text style={styles.roomName}>{roomName}</Text>
      </View>

      {/* Questions List */}
      {loading && questions.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4361EE" />
          <Text style={styles.loadingText}>Cargando preguntas...</Text>
        </View>
      ) : (
        <>
          {questions.length > 0 ? (
            <FlatList
              data={questions}
              renderItem={renderQuestionCard}
              keyExtractor={(item) => item.id || ''}
              contentContainerStyle={styles.questionsList}
              showsVerticalScrollIndicator={false}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={handleRefresh}
                  colors={["#4361EE"]}
                  tintColor="#4361EE"
                />
              }
              ListHeaderComponent={
                <Text style={styles.questionsCount}>
                  {questions.length} pregunta{questions.length !== 1 ? 's' : ''} encontrada{questions.length !== 1 ? 's' : ''}
                </Text>
              }
            />
          ) : (
            <View style={styles.emptyContainer}>
              <Feather name="help-circle" size={64} color="#DDD" />
              <Text style={styles.emptyTitle}>No hay preguntas</Text>
              <Text style={styles.emptyDescription}>
                Esta sala aún no tiene preguntas. Comienza agregando tu primera pregunta.
              </Text>
              <TouchableOpacity 
                style={styles.addFirstButton}
                onPress={handleAddQuestion}
                activeOpacity={0.8}
              >
                <Text style={styles.addFirstButtonText}>Agregar pregunta</Text>
                <Feather name="plus" size={18} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          )}
        </>
      )}

      {/* Error Message */}
      {error && (
        <View style={styles.errorContainer}>
          <Feather name="alert-circle" size={24} color="#FF4444" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={handleRefresh}
          >
            <Text style={styles.retryButtonText}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F0F4FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  roomInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#F0F4FF',
  },
  roomIconContainer: {
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
    fontFamily: 'Poppins_400Regular',
  },
  questionsList: {
    padding: 20,
    paddingBottom: 40,
  },
  questionsCount: {
    fontSize: 14,
    fontFamily: 'Poppins_500Medium',
    color: '#666',
    marginBottom: 16,
  },
  questionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
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
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  difficultyBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  difficultyText: {
    fontSize: 12,
    fontFamily: 'Poppins_500Medium',
    color: '#FFFFFF',
  },
  scoreText: {
    fontSize: 14,
    fontFamily: 'Poppins_600SemiBold',
    color: '#4361EE',
  },
  questionText: {
    fontSize: 16,
    fontFamily: 'Poppins_500Medium',
    color: '#333',
    marginBottom: 12,
    lineHeight: 24,
  },
  questionTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  questionTypeText: {
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
    color: '#666',
    marginLeft: 8,
  },
  optionsContainer: {
    marginBottom: 12,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
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
    fontFamily: 'Poppins_500Medium',
    color: '#4361EE',
  },
  optionText: {
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
    color: '#333',
    flex: 1,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  tagBadge: {
    backgroundColor: '#F0F4FF',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginRight: 8,
    marginBottom: 8,
  },
  tagText: {
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
    color: '#4361EE',
  },
  questionFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    paddingTop: 12,
  },
  dateText: {
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
    color: '#999',
  },
  moreButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontFamily: 'Poppins_600SemiBold',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  addFirstButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4361EE',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  addFirstButtonText: {
    fontSize: 14,
    fontFamily: 'Poppins_600SemiBold',
    color: '#FFFFFF',
    marginRight: 8,
  },
  errorContainer: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: '#FFEBEE',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  errorText: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
    color: '#FF4444',
    marginLeft: 12,
    marginRight: 12,
  },
  retryButton: {
    backgroundColor: '#FF4444',
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  retryButtonText: {
    fontSize: 12,
    fontFamily: 'Poppins_500Medium',
    color: '#FFFFFF',
  },
});