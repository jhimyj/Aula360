import React from 'react';
import { 
  StyleSheet, 
  Keyboard,
  TouchableWithoutFeedback,
  KeyboardAvoidingView,
  Platform,
  ScrollView
} from 'react-native';
import { 
  Provider as PaperProvider, 
  Appbar
} from 'react-native-paper';
import { SalasForm } from './SalasForm';
import { theme } from './theme';

interface SalasScreenProps {
  onBack: () => void;
}

export const SalasScreen = ({ onBack }: SalasScreenProps) => {
  return (
    <PaperProvider theme={theme}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.container}
        >
         
          
          <ScrollView 
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <SalasForm />
          </ScrollView>
        </KeyboardAvoidingView>
      </TouchableWithoutFeedback>
    </PaperProvider>
  );
};

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
});