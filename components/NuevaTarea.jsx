import { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTareas } from '../context/TareasContext';

function useSpeechRecognition() {
  const [grabando, setGrabando] = useState(false);
  const [soportado, setSoportado] = useState(false);
  const recognitionRef = useRef(null);
  const onResultRef = useRef(null);

  useEffect(() => {
    if (Platform.OS === 'web') {
      const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SR) {
        setSoportado(true);
        const recognition = new SR();
        recognition.lang = 'es-ES';
        recognition.interimResults = false;
        recognition.continuous = false;
        recognition.onresult = (event) => {
          const transcript = event.results[0][0].transcript;
          if (onResultRef.current) onResultRef.current(transcript);
        };
        recognition.onend = () => setGrabando(false);
        recognition.onerror = () => setGrabando(false);
        recognitionRef.current = recognition;
      }
    }
  }, []);

  function iniciar(onResult) {
    onResultRef.current = onResult;
    if (recognitionRef.current) {
      recognitionRef.current.start();
      setGrabando(true);
    }
  }

  function detener() {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
  }

  return { grabando, soportado, iniciar, detener };
}

function formatFecha(raw) {
  // Solo dígitos
  const digits = raw.replace(/\D/g, '').slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return digits.slice(0, 2) + '/' + digits.slice(2);
  return digits.slice(0, 2) + '/' + digits.slice(2, 4) + '/' + digits.slice(4);
}

export default function NuevaTarea() {
  const { crearTarea } = useTareas();
  const router = useRouter();

  const [texto, setTexto] = useState('');
  const [fecha, setFecha] = useState('');

  const { grabando, soportado, iniciar, detener } = useSpeechRecognition();

  function toggleVoz() {
    if (grabando) {
      detener();
    } else {
      iniciar((transcript) => {
        setTexto((prev) => prev ? prev + ' ' + transcript : transcript);
      });
    }
  }

  function handleFechaChange(value) {
    setFecha(formatFecha(value));
  }

  function handleGuardar() {
    if (!texto.trim()) return;
    crearTarea({ texto, fecha });
    router.back();
  }

  return (
    <LinearGradient colors={['#0f0c29', '#302b63', '#24243e']} style={styles.container}>
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.btnCerrar} onPress={() => router.back()}>
            <Text style={styles.btnCerrarText}>✕</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitulo}>Nueva Tarea</Text>
          <TouchableOpacity onPress={handleGuardar}>
            <LinearGradient colors={['#8b5cf6', '#6d28d9']} style={styles.btnGuardar}>
              <Text style={styles.btnGuardarText}>GUARDAR</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
          {/* Fecha */}
          <View style={styles.campo}>
            <Text style={styles.label}>
              <Text style={styles.icono}>📅  </Text>FECHA
            </Text>
            <TextInput
              style={styles.inputFecha}
              placeholder="dd/mm/aaaa"
              placeholderTextColor="rgba(255,255,255,0.3)"
              value={fecha}
              onChangeText={handleFechaChange}
              keyboardType="number-pad"
              maxLength={10}
            />
          </View>

          {/* Texto / Voz */}
          <View style={styles.campo}>
            <View style={styles.labelRow}>
              <Text style={styles.label}>
                <Text style={styles.icono}>📝  </Text>DESCRIBE TU TAREA
              </Text>
              {soportado && (
                <TouchableOpacity
                  style={[styles.btnVoz, grabando && styles.btnVozActivo]}
                  onPress={toggleVoz}
                >
                  <Feather name={grabando ? 'mic-off' : 'mic'} size={18} color={grabando ? '#ef4444' : '#8b5cf6'} />
                  <Text style={[styles.btnVozText, grabando && styles.btnVozTextActivo]}>
                    {grabando ? 'Parar' : 'Voz'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
            <TextInput
              style={styles.textarea}
              placeholder="Escribe o dicta tu tarea..."
              placeholderTextColor="rgba(255,255,255,0.25)"
              multiline
              numberOfLines={6}
              value={texto}
              onChangeText={setTexto}
              textAlignVertical="top"
            />
            {grabando && (
              <View style={styles.grabandoIndicator}>
                <View style={styles.grabandoDot} />
                <Text style={styles.grabandoText}>Escuchando...</Text>
              </View>
            )}
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safe: { flex: 1 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 12,
  },
  btnCerrar: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnCerrarText: { color: 'rgba(255,255,255,0.6)', fontSize: 16 },
  headerTitulo: { fontSize: 18, fontWeight: '700', color: '#fff' },
  btnGuardar: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 12 },
  btnGuardarText: { color: '#fff', fontWeight: '600', fontSize: 13, letterSpacing: 0.8 },

  body: { flex: 1, paddingHorizontal: 24 },
  campo: { marginBottom: 24 },

  label: {
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.45)',
    letterSpacing: 0.8,
    marginBottom: 10,
  },
  icono: { fontSize: 14 },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },

  inputFecha: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 14,
    padding: 16,
    paddingHorizontal: 18,
    fontSize: 16,
    color: '#fff',
    backgroundColor: 'rgba(255,255,255,0.05)',
  },

  textarea: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 14,
    padding: 16,
    paddingHorizontal: 18,
    fontSize: 15,
    color: 'rgba(255,255,255,0.9)',
    backgroundColor: 'rgba(255,255,255,0.05)',
    minHeight: 160,
    lineHeight: 22,
  },

  btnVoz: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(139,92,246,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(139,92,246,0.25)',
  },
  btnVozActivo: {
    backgroundColor: 'rgba(239,68,68,0.15)',
    borderColor: 'rgba(239,68,68,0.3)',
  },
  btnVozText: { fontSize: 13, fontWeight: '600', color: '#8b5cf6' },
  btnVozTextActivo: { color: '#ef4444' },

  grabandoIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 10,
    paddingHorizontal: 4,
  },
  grabandoDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ef4444',
  },
  grabandoText: { fontSize: 13, color: '#ef4444', fontWeight: '500' },
});
