import { useState, useRef, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Pressable,
  ScrollView,
  StyleSheet,
  Platform,

} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTareas } from '../context/TareasContext';

const DIAS_SEMANA = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

function getDiasDelMes(year, month) {
  const primerDia = new Date(year, month, 1);
  const ultimoDia = new Date(year, month + 1, 0);
  const diasEnMes = ultimoDia.getDate();
  let diaInicio = primerDia.getDay() - 1;
  if (diaInicio < 0) diaInicio = 6;

  const dias = [];
  for (let i = 0; i < diaInicio; i++) dias.push(null);
  for (let d = 1; d <= diasEnMes; d++) dias.push(d);
  return dias;
}

function formatDiaCalendario(year, month, day) {
  const dd = String(day).padStart(2, '0');
  const mm = String(month + 1).padStart(2, '0');
  return `${dd}/${mm}/${year}`;
}

// --- Conversión de números hablados en español a dígitos ---
const NUMEROS_BASICOS = {
  'cero': '0', 'uno': '1', 'una': '1', 'dos': '2', 'tres': '3',
  'cuatro': '4', 'cinco': '5', 'seis': '6', 'siete': '7', 'ocho': '8',
  'nueve': '9', 'diez': '10', 'once': '11', 'doce': '12', 'trece': '13',
  'catorce': '14', 'quince': '15', 'dieciséis': '16', 'dieciseis': '16',
  'diecisiete': '17', 'dieciocho': '18', 'diecinueve': '19', 'veinte': '20',
  'veintiuno': '21', 'veintiuna': '21', 'veintidós': '22', 'veintidos': '22',
  'veintitrés': '23', 'veintitres': '23', 'veinticuatro': '24',
  'veinticinco': '25', 'veintiséis': '26', 'veintiseis': '26',
  'veintisiete': '27', 'veintiocho': '28', 'veintinueve': '29',
  'treinta': '30', 'cuarenta': '40', 'cincuenta': '50', 'sesenta': '60',
  'setenta': '70', 'ochenta': '80', 'noventa': '90',
  'cien': '100', 'ciento': '100',
  'doscientos': '200', 'doscientas': '200',
  'trescientos': '300', 'trescientas': '300',
  'cuatrocientos': '400', 'cuatrocientas': '400',
  'quinientos': '500', 'quinientas': '500',
  'seiscientos': '600', 'seiscientas': '600',
  'setecientos': '700', 'setecientas': '700',
  'ochocientos': '800', 'ochocientas': '800',
  'novecientos': '900', 'novecientas': '900',
  'mil': '1000',
};

function convertirNumerosEnTexto(texto) {
  const patron = new RegExp(
    '\\b(' + Object.keys(NUMEROS_BASICOS).join('|') + ')\\b',
    'gi'
  );
  return texto.replace(patron, (match) => NUMEROS_BASICOS[match.toLowerCase()] || match);
}

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

export default function NuevaTarea() {
  const { crearTarea } = useTareas();
  const router = useRouter();

  const [texto, setTexto] = useState('');
  const [fecha, setFecha] = useState('');
  const [calendarioAbierto, setCalendarioAbierto] = useState(false);
  const [mesVista, setMesVista] = useState(new Date().getMonth());
  const [anioVista, setAnioVista] = useState(new Date().getFullYear());

  const { grabando, soportado, iniciar, detener } = useSpeechRecognition();

  const dias = useMemo(() => getDiasDelMes(anioVista, mesVista), [anioVista, mesVista]);

  const hoyStr = useMemo(() => {
    const h = new Date();
    return formatDiaCalendario(h.getFullYear(), h.getMonth(), h.getDate());
  }, []);

  function toggleVoz() {
    if (grabando) {
      detener();
    } else {
      iniciar((transcript) => {
        const textoConvertido = convertirNumerosEnTexto(transcript);
        setTexto((prev) => prev ? prev + ' ' + textoConvertido : textoConvertido);
      });
    }
  }

  function mesAnterior() {
    if (mesVista === 0) {
      setMesVista(11);
      setAnioVista(anioVista - 1);
    } else {
      setMesVista(mesVista - 1);
    }
  }

  function mesSiguiente() {
    if (mesVista === 11) {
      setMesVista(0);
      setAnioVista(anioVista + 1);
    } else {
      setMesVista(mesVista + 1);
    }
  }

  function seleccionarDia(dia) {
    const fechaSel = formatDiaCalendario(anioVista, mesVista, dia);
    setFecha(fechaSel);
    setCalendarioAbierto(false);
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

        <ScrollView style={styles.body} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          {/* Fecha */}
          <View style={styles.campo}>
            <Text style={styles.label}>
              <Text style={styles.icono}>📅  </Text>FECHA
            </Text>
            <TouchableOpacity
              activeOpacity={0.7}
              style={styles.inputFecha}
              onPress={() => setCalendarioAbierto(!calendarioAbierto)}
            >
              <Text style={fecha ? styles.inputFechaText : styles.inputFechaPlaceholder}>
                {fecha || 'dd/mm/aaaa'}
              </Text>
              <Feather
                name={calendarioAbierto ? 'chevron-up' : 'chevron-down'}
                size={18}
                color="rgba(255,255,255,0.4)"
              />
            </TouchableOpacity>

            {calendarioAbierto && (
              <View style={styles.calendario}>
                {/* Navegación mes */}
                <View style={styles.calNav}>
                  <TouchableOpacity onPress={mesAnterior} style={styles.calNavBtn}>
                    <Feather name="chevron-left" size={20} color="#fff" />
                  </TouchableOpacity>
                  <Text style={styles.calMes}>{MESES[mesVista]} {anioVista}</Text>
                  <TouchableOpacity onPress={mesSiguiente} style={styles.calNavBtn}>
                    <Feather name="chevron-right" size={20} color="#fff" />
                  </TouchableOpacity>
                </View>

                {/* Cabecera días */}
                <View style={styles.calSemana}>
                  {DIAS_SEMANA.map((d) => (
                    <Text key={d} style={styles.calDiaSemana}>{d}</Text>
                  ))}
                </View>

                {/* Grid días */}
                <View style={styles.calGrid}>
                  {dias.map((dia, i) => {
                    if (dia === null) {
                      return <View key={`e-${i}`} style={styles.calCelda} />;
                    }
                    const fechaStr = formatDiaCalendario(anioVista, mesVista, dia);
                    const esHoy = fechaStr === hoyStr;
                    const seleccionado = fechaStr === fecha;

                    return (
                      <TouchableOpacity
                        key={dia}
                        style={[
                          styles.calCelda,
                          esHoy && styles.calCeldaHoy,
                          seleccionado && styles.calCeldaSeleccionada,
                        ]}
                        onPress={() => seleccionarDia(dia)}
                      >
                        <Text style={[
                          styles.calDia,
                          esHoy && styles.calDiaHoy,
                          seleccionado && styles.calDiaSeleccionado,
                        ]}>
                          {dia}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            )}
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
              onChangeText={(val) => setTexto(convertirNumerosEnTexto(val))}
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 14,
    padding: 16,
    paddingHorizontal: 18,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  inputFechaText: {
    fontSize: 16,
    color: '#fff',
  },
  inputFechaPlaceholder: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.3)',
  },

  // Calendario
  calendario: {
    marginTop: 12,
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 16,
    padding: 16,
  },
  calNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  calNavBtn: {
    padding: 6,
  },
  calMes: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  calSemana: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  calDiaSemana: {
    flex: 1,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.3)',
  },
  calGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  calCelda: {
    width: '14.28%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
  },
  calCeldaHoy: {
    backgroundColor: 'rgba(139,92,246,0.15)',
  },
  calCeldaSeleccionada: {
    backgroundColor: '#8b5cf6',
  },
  calDia: {
    fontSize: 14,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.7)',
  },
  calDiaHoy: {
    color: '#c4b5fd',
    fontWeight: '700',
  },
  calDiaSeleccionado: {
    color: '#fff',
    fontWeight: '700',
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
