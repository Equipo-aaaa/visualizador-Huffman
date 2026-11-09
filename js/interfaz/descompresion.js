// DI-06 · Carga de un archivo .hfmn para descomprimirlo.
// Diego Antonio Espinosa Salinas
// Lee el archivo y entrega sus bytes con alCargarHfmn(bytes, nombre).
// Descomprimir lo hace el worker; la página avisa el resultado con mostrarEstado
// y entrega el texto recuperado con mostrarDescarga.

// Crea un elemento con su clase y su texto. textContent y no innerHTML, para
// que un nombre de archivo con "<" o ">" se muestre como texto y no como HTML.
function crear(etiqueta, clase, texto) {
  const elemento = document.createElement(etiqueta);
  if (clase) elemento.className = clase;
  if (texto !== undefined) elemento.textContent = texto;
  return elemento;
}

// Guarda el texto como archivo. El Blob es un archivo en la memoria del navegador
// y se escribe en UTF-8, así que los acentos y la ñ se conservan.
function descargarTexto(texto, nombreArchivo) {
  const blob = new Blob([texto], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);

  const enlace = document.createElement('a');
  enlace.href = url;
  enlace.download = nombreArchivo;
  enlace.click();

  // Se libera después, para no cancelar la descarga que acaba de empezar
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// Arma un nombre válido para Windows a partir del título del libro
function nombreParaTxt(titulo) {
  const limpio = titulo
    .replace(/[<>:"/\\|?*\u0000-\u001f]/g, '')
    .replace(/\.txt$/i, '')
    .trim();
  return `${limpio || 'texto-descomprimido'}.txt`;
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
  const estado = crear('p', 'descompresion-estado', 'Puedes cargar el .hfmn que descargaste en la sección 2.');
  estado.setAttribute('aria-live', 'polite');

  // Oculto hasta que haya un texto recuperado
  const botonTexto = crear('button', 'btn btn-outline-info btn-sm mt-2', 'Descargar .txt');
  botonTexto.type = 'button';
  botonTexto.hidden = true;

  contenedor.append(zona, estado, botonTexto);

  // ---- Estado ----
  let textoRecuperado = '';
  let nombreTexto = '';

  function mostrarEstado(mensaje, esError = false) {
    estado.textContent = mensaje;
    estado.classList.toggle('descompresion-estado--error', esError);
  }

  function ocultarDescarga() {
    botonTexto.hidden = true;
    textoRecuperado = '';
    nombreTexto = '';
  }

  function mostrarDescarga(texto, titulo) {
    textoRecuperado = texto;
    nombreTexto = nombreParaTxt(titulo);
    botonTexto.hidden = false;
  }

  async function leerArchivo(archivo) {
    // Al cargar otro archivo, el botón no debe seguir ofreciendo el texto anterior
    ocultarDescarga();

    // Se revisa aquí lo que se puede saber sin abrirlo. Si el contenido no es un
    // .hfmn válido (firma, versión...), lo detecta descomprimir en el worker.
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
      mostrarEstado(`Descomprimiendo "${archivo.name}"…`);
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

  botonTexto.addEventListener('click', () => descargarTexto(textoRecuperado, nombreTexto));

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
    mostrarDescarga,
    destruir() {
      contenedor.replaceChildren();
    },
  };
}
