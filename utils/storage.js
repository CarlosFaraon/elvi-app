import AsyncStorage from '@react-native-async-storage/async-storage';

export async function getItem(key) {
  try {
    const value = await AsyncStorage.getItem(key);
    return value ? JSON.parse(value) : null;
  } catch {
    return null;
  }
}

export async function setItem(key, value) {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  } catch {
    // silently fail
  }
}

export async function getString(key) {
  try {
    return await AsyncStorage.getItem(key);
  } catch {
    return null;
  }
}

export async function setString(key, value) {
  try {
    await AsyncStorage.setItem(key, value);
  } catch {
    // silently fail
  }
}
