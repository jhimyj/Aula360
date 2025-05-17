import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Image,
} from "react-native";

export default function Mision2({ navigation }) {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);

  const handleSubmit = () => {
    if (!selectedOption) {
      Alert.alert("Por favor, selecciona una opción antes de enviar.");
      return;
    }
    // Aquí puedes manejar el envío, por ejemplo, guardar la respuesta o enviarla a un backend
    Alert.alert("Respuesta enviada", "¡Tu respuesta ha sido registrada!");
    setSelectedOption(null);
  };

  return (
    <View style={styles.container}>
      <Image
        source={require("../../assets/images/villiancharacter1.png")}
        style={styles.villainImage}
        resizeMode="contain"
      />
      <Text style={styles.title}>
        Tu amiga Pachamama ha venido a ayudar, para aceptar su ayuda responde:
      </Text>
      <Text style={styles.subtitle}>
        ¿Qué simboliza la "Pachamama" (madre tierra) en las obras de Arguedas?
      </Text>
      <TouchableOpacity
        style={[
          styles.option,
          selectedOption === "A" && styles.selectedOption,
        ]}
        onPress={() => setSelectedOption("A")}
      >
        <Text style={styles.optionText}>
          A. La conexión espiritual con los dioses
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[
          styles.option,
          selectedOption === "B" && styles.selectedOption,
        ]}
        onPress={() => setSelectedOption("B")}
      >
        <Text style={styles.optionText}>
          B. El rechazo a la modernización
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[
          styles.option,
          selectedOption === "C" && styles.selectedOption,
        ]}
        onPress={() => setSelectedOption("C")}
      >
        <Text style={styles.optionText}>
          C La relación entre el hombre y la naturaleza, como fuente de vida
        </Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.button} onPress={handleSubmit}>
        <Text style={styles.buttonText}>Enviar</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    margin: 20,
    elevation: 4,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  villainImage: {
    width: 120,
    height: 120,
    alignSelf: "center",
    marginBottom: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#C0392B",
    marginBottom: 10,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 15,
    color: "#333",
    marginBottom: 16,
    textAlign: "center",
  },
  option: {
    borderWidth: 1,
    borderColor: "#8E44AD",
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    backgroundColor: "#F9F9F9",
  },
  selectedOption: {
    backgroundColor: "#D6BBF7",
    borderColor: "#8E44AD",
  },
  optionText: {
    fontSize: 15,
    color: "#333",
  },
  button: {
    backgroundColor: "#8E44AD",
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 10,
  },
  buttonText: {
    color: "#FFF",
    fontWeight: "bold",
    fontSize: 16,
  },
});
