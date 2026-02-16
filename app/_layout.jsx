import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { TareasProvider } from '../context/TareasContext';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <TareasProvider>
        <StatusBar style="light" />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: '#0f0c29' },
            animation: 'slide_from_right',
          }}
        />
      </TareasProvider>
    </SafeAreaProvider>
  );
}
