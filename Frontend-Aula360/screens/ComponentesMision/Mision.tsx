import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Image,
} from "react-native";

export default function Mision({ navigation }) {
  const [answer, setAnswer] = useState("");

  const handleSubmit = () => {
    if (answer.trim().length === 0) {
      Alert.alert("Por favor, escribe tu respuesta antes de enviar.");
      return;
    }
    // Aquí puedes manejar el envío, por ejemplo, guardar la respuesta o enviarla a un backend
    Alert.alert("Respuesta enviada", "¡Tu respuesta ha sido registrada!");
    setAnswer("");
  };

  return (
    <View style={styles.container}>
      <Image
        source={require("../../assets/images/villiancharacter1.png")}
        style={styles.villainImage}
        resizeMode="contain"
      />
      <Text style={styles.title}>
        ¡El Despojo Corporativo está atacando! ¡Defiéndete rápido!
      </Text>
      <Text style={styles.subtitle}>
        Escribe un párrafo sobre la cosmovisión andina en{" "}
        <Text style={styles.bold}>El sueño del pongo</Text> y{" "}
        <Text style={styles.bold}>El barranco</Text>. ¡Si no actúas, perderás
        puntos de vida!
      </Text>
      <TextInput
        style={styles.input}
        placeholder="Escribe tu respuesta aquí..."
        value={answer}
        onChangeText={setAnswer}
        multiline
        numberOfLines={5}
        textAlignVertical="top"
      />
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
  bold: {
    fontWeight: "bold",
    color: "#8E44AD",
  },
  input: {
    borderWidth: 1,
    borderColor: "#8E44AD",
    borderRadius: 10,
    padding: 12,
    minHeight: 100,
    marginBottom: 16,
    backgroundColor: "#F9F9F9",
    fontSize: 15,
  },
  button: {
    backgroundColor: "#8E44AD",
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  buttonText: {
    color: "#FFF",
    fontWeight: "bold",
    fontSize: 16,
  },
});
