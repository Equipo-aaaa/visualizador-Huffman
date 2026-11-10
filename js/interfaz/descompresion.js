// DI-06 · Carga de un archivo .hfmn para inspeccionarlo.
// Diego Antonio Espinosa Salinas
// Lee el archivo y entrega sus bytes con alCargarHfmn(bytes, nombre). La página
// lo manda a inspeccionar y avisa el resultado con mostrarEstado. Descomprimir y
// descargar el .txt se hace desde el inspector (inspector.js).

// Crea un elemento con su clase y su texto. textContent y no innerHTML, para
// que un nombre de archivo con "<" o ">" se muestre como texto y no como HTML.
function crear(etiqueta, clase, texto) {
  const elemento = document.createElement(etiqueta);
  if (clase) elemento.className = clase;
  if (texto !== undefined) elemento.textContent = texto;
  return elemento;
}

export function montarDescompresion(contenedor, { alCargarHfmn }) {
  contenedor.replaceChildren();

  // ---- Estructura ----
  const zona = crear('div', 'descompresion-zona');
  const selector = crear('input');
  selector.type = 'file';
  // accept solo filtra la ventana de archivos; igual se revisa al leer
  selector.accept = '.hfmn';
  selector.hidden = true;

  const boton = crear('button', 'btn btn-outline-info btn-sm', 'Elegir archivo .hfmn');
  boton.type = 'button';

  zona.append(
    crear('span', 'descompresion-zona-texto', 'Arrastra un .hfmn aquí o'),
    boton,
    selector,
  );

  // aria-live hace que un lector de pantalla anuncie los cambios de estado
  const estado = crear('p', 'descompresion-estado',
    'Carga cualquier .hfmn, por ejemplo el que descargaste en la sección 2. Se inspecciona antes de descomprimirlo.');
  estado.setAttribute('aria-live', 'polite');

  contenedor.append(zona, estado);

  // ---- Estado ----
  function mostrarEstado(mensaje, esError = false) {
    estado.textContent = mensaje;
    estado.classList.toggle('descompresion-estado--error', esError);
  }

  async function leerArchivo(archivo) {
    // Se revisa aquí lo que se puede saber sin abrirlo. Si el contenido no es un
    // .hfmn válido (firma, versión...), lo detecta inspeccionar en el worker.
    if (!archivo.name.toLowerCase().endsWith('.hfmn')) {
      mostrarEstado(`"${archivo.name}" no es un archivo .hfmn.`, true);
      return;
    }
    if (archivo.size === 0) {
      mostrarEstado(`"${archivo.name}" está vacío.`, true);
      return;
    }

    try {
      // arrayBuffer() lee el archivo como bytes, igual que open(ruta, 'rb').read()
      const bytes = new Uint8Array(await archivo.arrayBuffer());
      mostrarEstado(`Inspeccionando "${archivo.name}"…`);
      alCargarHfmn(bytes, archivo.name);
    } catch {
      mostrarEstado(`No se pudo leer "${archivo.name}".`, true);
    }
  }

  // ---- Eventos ----
  // El botón visible abre la ventana del input de archivo, que está oculto
  boton.addEventListener('click', () => selector.click());
  selector.addEventListener('change', () => {
    if (selector.files.length > 0) leerArchivo(selector.files[0]);
    // Se limpia para que volver a elegir el mismo archivo también dispare 'change'
    selector.value = '';
  });

  // Sin preventDefault en dragover y drop, el navegador abriría el archivo en la pestaña
  zona.addEventListener('dragover', (evento) => {
    evento.preventDefault();
    zona.classList.add('descompresion-zona--activa');
  });
  zona.addEventListener('dragleave', () => zona.classList.remove('descompresion-zona--activa'));
  zona.addEventListener('drop', (evento) => {
    evento.preventDefault();
    zona.classList.remove('descompresion-zona--activa');
    if (evento.dataTransfer.files.length > 0) leerArchivo(evento.dataTransfer.files[0]);
  });

  return {
    mostrarEstado,
    destruir() {
      contenedor.replaceChildren();
    },
  };
}
