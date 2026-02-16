import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const isWeb = Platform.OS === 'web';

export async function getItem(key) {
  try {
    if (isWeb) {
      const value = localStorage.getItem(key);
      return value ? JSON.parse(value) : null;
    }
    const value = await AsyncStorage.getItem(key);
    return value ? JSON.parse(value) : null;
  } catch {
    return null;
  }
}

export async function setItem(key, value) {
  try {
    if (isWeb) {
      localStorage.setItem(key, JSON.stringify(value));
      return;
    }
    await AsyncStorage.setItem(key, JSON.stringify(value));
  } catch {
    // silently fail
  }
}

export async function getString(key) {
  try {
    if (isWeb) {
      return localStorage.getItem(key);
    }
    return await AsyncStorage.getItem(key);
  } catch {
    return null;
  }
}

export async function setString(key, value) {
  try {
    if (isWeb) {
      localStorage.setItem(key, value);
      return;
    }
    await AsyncStorage.setItem(key, value);
  } catch {
    // silently fail
  }
}
