import { useState, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  Image,
  StyleSheet,
  Alert,
  Platform,
  Modal,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
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
  // Lunes=0 ... Domingo=6
  let diaInicio = primerDia.getDay() - 1;
  if (diaInicio < 0) diaInicio = 6;

  const dias = [];
  for (let i = 0; i < diaInicio; i++) dias.push(null);
  for (let d = 1; d <= diasEnMes; d++) dias.push(d);
  return dias;
}

function formatDiaFiltro(year, month, day) {
  const dd = String(day).padStart(2, '0');
  const mm = String(month + 1).padStart(2, '0');
  return `${dd}/${mm}/${year}`;
}

export default function ListaTareas() {
  const { tareas, eliminarTarea, nombreUsuario, fotoUsuario, cambiarNombre, cambiarFoto } = useTareas();
  const [editandoNombre, setEditandoNombre] = useState(false);
  const [calendarioAbierto, setCalendarioAbierto] = useState(false);
  const [filtroFecha, setFiltroFecha] = useState(null); // string dd/mm/aaaa o null
  const [mesVista, setMesVista] = useState(new Date().getMonth());
  const [anioVista, setAnioVista] = useState(new Date().getFullYear());
  const router = useRouter();

  const tareasFiltradas = useMemo(() => {
    if (!filtroFecha) return tareas;
    return tareas.filter((t) => (t.fecha || t.fechaEntrega) === filtroFecha);
  }, [tareas, filtroFecha]);

  const dias = useMemo(() => getDiasDelMes(anioVista, mesVista), [anioVista, mesVista]);

  // Fechas que tienen tareas (para marcar puntos en el calendario)
  const fechasConTareas = useMemo(() => {
    const set = new Set();
    tareas.forEach((t) => {
      if (t.fecha || t.fechaEntrega) set.add(t.fecha || t.fechaEntrega);
    });
    return set;
  }, [tareas]);

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
    const fecha = formatDiaFiltro(anioVista, mesVista, dia);
    if (filtroFecha === fecha) {
      setFiltroFecha(null); // deseleccionar
    } else {
      setFiltroFecha(fecha);
    }
    setCalendarioAbierto(false);
  }

  async function pickImage() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });
    if (!result.canceled && result.assets[0]) {
      cambiarFoto(result.assets[0].uri);
    }
  }

  function renderCard({ item: t }) {
    return (
      <View style={styles.card}>
        <View style={styles.cardTop}>
          <Text style={styles.cardTexto} numberOfLines={3}>{t.texto}</Text>
          <TouchableOpacity
            style={styles.btnEliminar}
            onPress={() => {
              if (Platform.OS === 'web') {
                if (window.confirm('¿Estás seguro de que quieres borrar esta tarea?')) {
                  eliminarTarea(t.id);
                }
              } else {
                Alert.alert(
                  'Eliminar tarea',
                  '¿Estás seguro de que quieres borrar esta tarea?',
                  [
                    { text: 'Cancelar', style: 'cancel' },
                    { text: 'Borrar', style: 'destructive', onPress: () => eliminarTarea(t.id) },
                  ]
                );
              }
            }}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Feather name="trash-2" size={20} color="#ef4444" />
          </TouchableOpacity>
        </View>

        {(t.fecha || t.fechaEntrega) ? (
          <View style={styles.cardBottom}>
            <Feather name="calendar" size={14} color="rgba(255,255,255,0.4)" />
            <Text style={styles.fechaTexto}>{t.fecha || t.fechaEntrega}</Text>
          </View>
        ) : null}
      </View>
    );
  }

  const hoy = new Date();
  const hoyStr = formatDiaFiltro(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());

  return (
    <LinearGradient
      colors={['#0f0c29', '#302b63', '#24243e']}
      style={styles.container}
    >
      <SafeAreaView style={styles.safe} edges={['top']}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.saludo}>TAREA DE TRABAJO</Text>
            <View style={styles.tituloRow}>
              <Text style={styles.titulo}>Mis Tareas</Text>
              {tareasFiltradas.length > 0 && (
                <View style={styles.contador}>
                  <Text style={styles.contadorText}>{tareasFiltradas.length}</Text>
                </View>
              )}
            </View>
          </View>

          {/* Perfil */}
          <View style={styles.perfil}>
            <TouchableOpacity style={styles.avatarWrapper} onPress={pickImage}>
              {fotoUsuario ? (
                <Image source={{ uri: fotoUsuario }} style={styles.avatarImg} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Feather name="user" size={20} color="rgba(255,255,255,0.35)" />
                </View>
              )}
              <View style={styles.avatarEdit}>
                <Feather name="plus" size={10} color="#fff" />
              </View>
            </TouchableOpacity>

            {editandoNombre ? (
              <TextInput
                style={styles.nombreInput}
                placeholder="Tu nombre"
                placeholderTextColor="rgba(255,255,255,0.3)"
                value={nombreUsuario}
                onChangeText={cambiarNombre}
                onBlur={() => setEditandoNombre(false)}
                onSubmitEditing={() => setEditandoNombre(false)}
                autoFocus
              />
            ) : (
              <TouchableOpacity onPress={() => setEditandoNombre(true)}>
                <Text style={styles.nombreBtn}>{nombreUsuario || 'Tu nombre'}</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Filtro calendario */}
        <View style={styles.filtroRow}>
          <TouchableOpacity
            style={[styles.filtroBtn, calendarioAbierto && styles.filtroBtnActivo]}
            onPress={() => setCalendarioAbierto(!calendarioAbierto)}
          >
            <Feather name="calendar" size={18} color={filtroFecha ? '#8b5cf6' : 'rgba(255,255,255,0.5)'} />
            <Text style={[styles.filtroBtnText, filtroFecha && styles.filtroBtnTextActivo]}>
              {filtroFecha || 'Filtrar por fecha'}
            </Text>
            <Feather name={calendarioAbierto ? 'chevron-up' : 'chevron-down'} size={16} color="rgba(255,255,255,0.4)" />
          </TouchableOpacity>

          {filtroFecha && (
            <TouchableOpacity
              style={styles.filtroClear}
              onPress={() => setFiltroFecha(null)}
            >
              <Feather name="x" size={16} color="rgba(255,255,255,0.5)" />
            </TouchableOpacity>
          )}
        </View>

        {/* Calendario desplegable */}
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
                const fechaStr = formatDiaFiltro(anioVista, mesVista, dia);
                const esHoy = fechaStr === hoyStr;
                const seleccionado = fechaStr === filtroFecha;
                const tieneTareas = fechasConTareas.has(fechaStr);

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
                    {tieneTareas && <View style={[styles.calPunto, seleccionado && styles.calPuntoSel]} />}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        {/* Content */}
        {tareasFiltradas.length === 0 ? (
          <View style={styles.vacia}>
            <View style={styles.vaciaCirculo}>
              <Text style={styles.vaciaIcono}>{filtroFecha ? '📅' : '+'}</Text>
            </View>
            <Text style={styles.vaciaTexto}>
              {filtroFecha ? 'Sin tareas este día' : 'Sin tareas pendientes'}
            </Text>
            <Text style={styles.vaciaSub}>
              {filtroFecha ? 'Prueba con otra fecha o quita el filtro' : 'Pulsa el boton para crear una'}
            </Text>
          </View>
        ) : (
          <FlatList
            data={tareasFiltradas}
            keyExtractor={(item) => String(item.id)}
            renderItem={renderCard}
            contentContainerStyle={styles.lista}
            showsVerticalScrollIndicator={false}
          />
        )}

        {/* FAB */}
        <TouchableOpacity
          style={styles.fab}
          activeOpacity={0.8}
          onPress={() => router.push('/nueva-tarea')}
        >
          <LinearGradient
            colors={['#8b5cf6', '#6d28d9']}
            style={styles.fabGradient}
          >
            <Text style={styles.fabIcon}>+</Text>
            <Text style={styles.fabText}>Nueva Tarea</Text>
          </LinearGradient>
        </TouchableOpacity>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safe: { flex: 1 },
  header: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  saludo: {
    fontSize: 13,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.5)',
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  tituloRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  titulo: { fontSize: 28, fontWeight: '800', color: '#fff' },
  contador: {
    backgroundColor: 'rgba(139,92,246,0.3)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(139,92,246,0.3)',
  },
  contadorText: { color: '#c4b5fd', fontSize: 14, fontWeight: '700' },

  perfil: { alignItems: 'center', gap: 6 },
  avatarWrapper: { width: 48, height: 48 },
  avatarImg: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: 'rgba(139,92,246,0.5)',
  },
  avatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarEdit: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#8b5cf6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  nombreBtn: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 11,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  nombreInput: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(139,92,246,0.4)',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    fontSize: 11,
    color: '#fff',
    width: 80,
    textAlign: 'center',
  },

  // Filtro
  filtroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 12,
    gap: 8,
  },
  filtroBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  filtroBtnActivo: {
    borderColor: 'rgba(139,92,246,0.4)',
    backgroundColor: 'rgba(139,92,246,0.08)',
  },
  filtroBtnText: {
    flex: 1,
    fontSize: 14,
    color: 'rgba(255,255,255,0.5)',
    fontWeight: '500',
  },
  filtroBtnTextActivo: {
    color: '#c4b5fd',
  },
  filtroClear: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Calendario
  calendario: {
    marginHorizontal: 20,
    marginBottom: 12,
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
  calPunto: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#8b5cf6',
    marginTop: 2,
  },
  calPuntoSel: {
    backgroundColor: '#fff',
  },

  // Empty
  vacia: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24 },
  vaciaCirculo: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  vaciaIcono: { fontSize: 32, color: 'rgba(255,255,255,0.25)', fontWeight: '300' },
  vaciaTexto: { fontSize: 17, fontWeight: '600', color: 'rgba(255,255,255,0.7)', marginBottom: 6 },
  vaciaSub: { fontSize: 14, color: 'rgba(255,255,255,0.35)' },

  lista: { paddingHorizontal: 20, paddingBottom: 100, gap: 12 },

  card: {
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 16,
    padding: 16,
    gap: 10,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  cardTexto: {
    fontSize: 15,
    fontWeight: '500',
    color: '#fff',
    lineHeight: 22,
    flex: 1,
  },
  btnEliminar: {
    padding: 4,
  },
  cardBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
  },
  fechaTexto: { fontSize: 12, color: 'rgba(255,255,255,0.4)' },

  fab: {
    position: 'absolute',
    bottom: 24,
    alignSelf: 'center',
    borderRadius: 16,
    shadowColor: '#8b5cf6',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  fabGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 16,
  },
  fabIcon: { fontSize: 20, color: '#fff', fontWeight: '300' },
  fabText: { fontSize: 15, fontWeight: '600', color: '#fff' },
});
