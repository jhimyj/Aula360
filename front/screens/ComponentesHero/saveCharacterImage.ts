import AsyncStorage from '@react-native-async-storage/async-storage'

export const saveCharacterImage = async (imageUri: string, typeCharacter: string) => {
  try {
    await AsyncStorage.setItem('selectedCharacterImage' + typeCharacter, imageUri)
  } catch (error) {
    console.error('Error guardando la imagen del personaje:', error)
  }
}
export const getSavedCharacterImage = async (typeCharacter: string): Promise<string | null> => {
  try {
    return await AsyncStorage.getItem('selectedCharacterImage' + typeCharacter)
  } catch (error) {
    console.error('Error obteniendo la imagen del personaje:', error)
    return null
  }
}
