import { createContext, useContext, useState, useEffect } from 'react';
import { getItem, setItem, getString, setString } from '../utils/storage';

const TareasContext = createContext();

export function TareasProvider({ children }) {
  const [tareas, setTareas] = useState([]);
  const [nombreUsuario, setNombreUsuario] = useState('');
  const [fotoUsuario, setFotoUsuario] = useState('');
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      const t = await getItem('tareas');
      const n = await getString('nombreUsuario');
      const f = await getString('fotoUsuario');
      if (t) setTareas(t);
      if (n) setNombreUsuario(n);
      if (f) setFotoUsuario(f);
      setLoaded(true);
    })();
  }, []);

  function guardarTareas(nuevas) {
    setTareas(nuevas);
    setItem('tareas', nuevas);
  }

  function crearTarea(tarea) {
    guardarTareas([{ ...tarea, id: Date.now() }, ...tareas]);
  }

  function eliminarTarea(id) {
    guardarTareas(tareas.filter((t) => t.id !== id));
  }

  function cambiarNombre(nombre) {
    setNombreUsuario(nombre);
    setString('nombreUsuario', nombre);
  }

  function cambiarFoto(uri) {
    setFotoUsuario(uri);
    setString('fotoUsuario', uri);
  }

  return (
    <TareasContext.Provider
      value={{
        tareas,
        nombreUsuario,
        fotoUsuario,
        loaded,
        crearTarea,
        eliminarTarea,
        cambiarNombre,
        cambiarFoto,
      }}
    >
      {children}
    </TareasContext.Provider>
  );
}

export function useTareas() {
  return useContext(TareasContext);
}
