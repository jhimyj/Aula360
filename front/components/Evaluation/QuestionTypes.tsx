// components/Evaluation/QuestionTypes.tsx
import React from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { QuestionType, DifficultyLevel } from '../../hooks/useQuestions';

interface QuestionTypeCardProps {
  type: QuestionType;
  title: string;
  description: string;
  icon: React.ReactNode;
  selected: boolean;
  onSelect: () => void;
}

export const QuestionTypeCard = ({ type, title, description, icon, selected, onSelect }: QuestionTypeCardProps) => {
  return (
    <TouchableOpacity 
      style={[styles.typeCard, selected && styles.selectedCard]} 
      onPress={onSelect}
      activeOpacity={0.8}
    >
      <View style={[styles.iconContainer, selected && styles.selectedIconContainer]}>
        {icon}
      </View>
      <View style={styles.typeInfo}>
        <Text style={[styles.typeTitle, selected && styles.selectedText]}>{title}</Text>
        <Text style={[styles.typeDescription, selected && styles.selectedDescription]}>{description}</Text>
      </View>
      {selected && (
        <View style={styles.checkmark}>
          <Feather name="check-circle" size={24} color="#4361EE" />
        </View>
      )}
    </TouchableOpacity>
  );
};

interface DifficultyBadgeProps {
  difficulty: DifficultyLevel;
  selected: boolean;
  onSelect: () => void;
}

export const DifficultyBadge = ({ difficulty, selected, onSelect }: DifficultyBadgeProps) => {
  const getColor = () => {
    if (selected) {
      switch (difficulty) {
        case 'EASY': return '#4CAF50';
        case 'MEDIUM': return '#FF9800';
        case 'HARD': return '#F44336';
      }
    }
    return '#E0E0E0';
  };

  const getTextColor = () => {
    if (selected) {
      return '#FFFFFF';
    }
    return '#666666';
  };

  const getLabel = () => {
    switch (difficulty) {
      case 'EASY': return 'Fácil';
      case 'MEDIUM': return 'Media';
      case 'HARD': return 'Difícil';
    }
  };

  return (
    <TouchableOpacity 
      style={[styles.difficultyBadge, { backgroundColor: getColor() }]} 
      onPress={onSelect}
      activeOpacity={0.8}
    >
      <Text style={[styles.difficultyText, { color: getTextColor() }]}>{getLabel()}</Text>
    </TouchableOpacity>
  );
};

interface OptionInputProps {
  value: string;
  onChange: (text: string) => void;
  onRemove: () => void;
  index: number;
}

export const OptionInput = ({ value, onChange, onRemove, index }: OptionInputProps) => {
  return (
    <View style={styles.optionContainer}>
      <View style={styles.optionBadge}>
        <Text style={styles.optionBadgeText}>{index + 1}</Text>
      </View>
      <TextInput
        style={styles.optionInput}
        value={value}
        onChangeText={onChange}
        placeholder="Escribe una opción..."
        placeholderTextColor="#999"
      />
      <TouchableOpacity style={styles.removeButton} onPress={onRemove}>
        <Feather name="x" size={20} color="#FF4444" />
      </TouchableOpacity>
    </View>
  );
};

interface TagInputProps {
  tags: string[];
  onAddTag: (tag: string) => void;
  onRemoveTag: (index: number) => void;
}

export const TagInput = ({ tags, onAddTag, onRemoveTag }: TagInputProps) => {
  const [inputValue, setInputValue] = React.useState('');

  const handleAddTag = () => {
    if (inputValue.trim()) {
      onAddTag(inputValue.trim());
      setInputValue('');
    }
  };

  return (
    <View style={styles.tagInputContainer}>
      <View style={styles.tagInputRow}>
        <TextInput
          style={styles.tagInput}
          value={inputValue}
          onChangeText={setInputValue}
          placeholder="Añadir etiqueta..."
          placeholderTextColor="#999"
          onSubmitEditing={handleAddTag}
        />
        <TouchableOpacity style={styles.addTagButton} onPress={handleAddTag}>
          <Feather name="plus" size={20} color="#4361EE" />
        </TouchableOpacity>
      </View>
      
      <View style={styles.tagsContainer}>
        {tags.map((tag, index) => (
          <View key={index} style={styles.tag}>
            <Text style={styles.tagText}>{tag}</Text>
            <TouchableOpacity onPress={() => onRemoveTag(index)}>
              <Feather name="x" size={16} color="#666" />
            </TouchableOpacity>
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  typeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedCard: {
    borderColor: '#4361EE',
    backgroundColor: '#F0F4FF',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  selectedIconContainer: {
    backgroundColor: '#4361EE20',
  },
  typeInfo: {
    flex: 1,
  },
  typeTitle: {
    fontSize: 16,
    fontFamily: 'Poppins_600SemiBold',
    color: '#333',
    marginBottom: 4,
  },
  selectedText: {
    color: '#4361EE',
  },
  typeDescription: {
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
    color: '#666',
  },
  selectedDescription: {
    color: '#4361EE99',
  },
  checkmark: {
    marginLeft: 12,
  },
  difficultyBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
  },
  difficultyText: {
    fontSize: 14,
    fontFamily: 'Poppins_500Medium',
  },
  optionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  optionBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#4361EE',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  optionBadgeText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: 'Poppins_600SemiBold',
  },
  optionInput: {
    flex: 1,
    height: 48,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    paddingHorizontal: 12,
    fontFamily: 'Poppins_400Regular',
    fontSize: 14,
    color: '#333',
  },
  removeButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  tagInputContainer: {
    marginBottom: 16,
  },
  tagInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  tagInput: {
    flex: 1,
    height: 48,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    paddingHorizontal: 12,
    fontFamily: 'Poppins_400Regular',
    fontSize: 14,
    color: '#333',
    marginRight: 8,
  },
  addTagButton: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: '#F0F4FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F4FF',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    marginBottom: 8,
  },
  tagText: {
    fontSize: 12,
    fontFamily: 'Poppins_500Medium',
    color: '#4361EE',
    marginRight: 6,
  },
});