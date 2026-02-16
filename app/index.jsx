import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useTareas } from '../context/TareasContext';
import ListaTareas from '../components/ListaTareas';

export default function HomeScreen() {
  const { loaded } = useTareas();

  if (!loaded) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#8b5cf6" />
      </View>
    );
  }

  return <ListaTareas />;
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0f0c29',
  },
});
