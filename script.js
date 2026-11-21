const filas = document.querySelectorAll('.fila-moneda');
const inputsMonedas = document.querySelectorAll('.input-moneda');
const inputObjetos = document.getElementById('cantidad-objetos');
const costoUnitarioEl = document.getElementById('costo-unitario');
const btnAgregar = document.getElementById('btn-agregar');

const btnModoMultiple = document.getElementById('btn-modo-multiple');
const elementosMultiples = document.querySelectorAll('.solo-multiple');

const bannerEdicion = document.getElementById('banner-edicion');
const textoEditando = document.getElementById('texto-editando');
const inputNombreEdicion = document.getElementById('input-nombre-edicion');
const btnCancelarEdicion = document.getElementById('btn-cancelar-edicion');

const listaVentaEl = document.getElementById('lista-venta');
const totalGeneralEl = document.getElementById('total-general');
const btnLimpiar = document.getElementById('btn-limpiar');
const controlesNumero = document.querySelectorAll('.control-numero');

const STORAGE_KEY = 'calculadora_monedas_sv_v1';

let modoMultipleActivo = false;
let carrito = [];
let subtotalItemActual = 0;
let indiceEditando = null;

function guardarEstado() {
  const estado = {
    modoMultipleActivo,
    carrito,
    monedasActuales: Array.from(inputsMonedas).map(input => input.value),
    cantidadActual: inputObjetos.value
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(estado));
}

function cargarEstado() {
  const guardado = localStorage.getItem(STORAGE_KEY);
  if (!guardado) return;

  try {
    const estado = JSON.parse(guardado);

    if (Array.isArray(estado.carrito)) {
      carrito = estado.carrito;
    }

    if (Array.isArray(estado.monedasActuales)) {
      inputsMonedas.forEach((input, i) => {
        input.value = estado.monedasActuales[i] || '';
      });
    }

    if (estado.cantidadActual) {
      inputObjetos.value = estado.cantidadActual;
    }

    if (estado.modoMultipleActivo) {
      aplicarModoMultiple(true, false);
    }

    renderizarLista();
    calcular(false);
  } catch (e) {
    console.error('Error al restaurar datos:', e);
  }
}

function aplicarModoMultiple(activar, debeGuardar = true) {
  modoMultipleActivo = activar;
  btnModoMultiple.classList.toggle('activo', modoMultipleActivo);
  btnModoMultiple.setAttribute('aria-pressed', modoMultipleActivo);
  btnModoMultiple.textContent = modoMultipleActivo ? 'Multiventa: ON' : 'Multiventa: OFF';

  elementosMultiples.forEach(el => {
    el.classList.toggle('oculto', !modoMultipleActivo);
  });

  if (!modoMultipleActivo && indiceEditando !== null) {
    cancelarEdicion();
  }

  actualizarTotalGeneral();
  if (debeGuardar) guardarEstado();
}

btnModoMultiple.addEventListener('click', () => {
  aplicarModoMultiple(!modoMultipleActivo, true);
});

function calcular(debeGuardar = true) {
  let costoPorObjeto = 0;

  filas.forEach(fila => {
    const input = fila.querySelector('.input-moneda');
    const resultadoDiv = fila.querySelector('.resultado-parcial');

    const cantidad = parseFloat(input.value) || 0;
    const valorUnitario = parseFloat(input.getAttribute('data-valor'));
    const subtotal = cantidad * valorUnitario;

    resultadoDiv.textContent = subtotal.toLocaleString('es-AR') + ' c';
    costoPorObjeto += subtotal;
  });

  const cantidadObjetos = parseFloat(inputObjetos.value) || 1;
  subtotalItemActual = costoPorObjeto * cantidadObjetos;

  costoUnitarioEl.textContent = costoPorObjeto.toLocaleString('es-AR') + ' c';
  actualizarTextoBotonAgregar();
  actualizarTotalGeneral();

  if (debeGuardar) guardarEstado();
}

function actualizarTextoBotonAgregar() {
  const monto = subtotalItemActual.toLocaleString('es-AR') + ' c';
  if (indiceEditando !== null) {
    btnAgregar.textContent = `✓ Guardar cambios en #${indiceEditando + 1} (${monto})`;
    btnAgregar.classList.add('modo-guardar-edicion');
  } else {
    btnAgregar.textContent = `+ Agregar #${carrito.length + 1} a la lista (${monto})`;
    btnAgregar.classList.remove('modo-guardar-edicion');
  }
}

function resetearFormularioItem() {
  inputsMonedas.forEach(input => input.value = '');
  inputObjetos.value = '1';
  inputNombreEdicion.value = '';
  calcular(true);
}

function guardarEnLista() {
  if (subtotalItemActual <= 0) return;

  const monedasGuardadas = Array.from(inputsMonedas).map(input => parseInt(input.value) || 0);
  const cantidad = parseInt(inputObjetos.value) || 1;
  const nombreEditado = indiceEditando !== null ? inputNombreEdicion.value.trim() : '';

  const datosItem = {
    nombre: nombreEditado,
    monedas: monedasGuardadas,
    cantidad: cantidad,
    total: subtotalItemActual
  };

  if (indiceEditando !== null) {
    carrito[indiceEditando] = datosItem;
    indiceEditando = null;
    bannerEdicion.classList.add('oculto');
  } else {
    carrito.push(datosItem);
  }

  renderizarLista();
  resetearFormularioItem();
}

function cargarParaEditar(index) {
  if (indiceEditando !== null && indiceEditando !== index && subtotalItemActual > 0) {
    carrito[indiceEditando] = {
      nombre: inputNombreEdicion.value.trim(),
      monedas: Array.from(inputsMonedas).map(input => parseInt(input.value) || 0),
      cantidad: parseInt(inputObjetos.value) || 1,
      total: subtotalItemActual
    };
  }

  const item = carrito[index];
  indiceEditando = index;

  inputsMonedas.forEach((input, i) => {
    input.value = item.monedas[i] > 0 ? item.monedas[i] : '';
  });
  inputObjetos.value = item.cantidad;
  inputNombreEdicion.value = item.nombre || '';

  textoEditando.textContent = `#${index + 1}`;
  bannerEdicion.classList.remove('oculto');

  renderizarLista();
  calcular(true);
}

function cancelarEdicion() {
  indiceEditando = null;
  inputNombreEdicion.value = '';
  bannerEdicion.classList.add('oculto');
  renderizarLista();
  resetearFormularioItem();
}

function eliminarDeLista(index) {
  if (indiceEditando === index) {
    cancelarEdicion();
  } else if (indiceEditando !== null && index < indiceEditando) {
    indiceEditando--;
  }
  carrito.splice(index, 1);
  renderizarLista();
  actualizarTextoBotonAgregar();
  guardarEstado();
}

function renderizarLista() {
  if (carrito.length === 0) {
    listaVentaEl.innerHTML = '<span class="lista-vacia">Sin ítems guardados aún</span>';
    actualizarTextoBotonAgregar();
    actualizarTotalGeneral();
    return;
  }

  listaVentaEl.innerHTML = '';

  carrito.forEach((item, index) => {
    const card = document.createElement('div');
    card.className = 'item-card' + (indiceEditando === index ? ' en-edicion' : '');

    const nombreHTML = item.nombre
      ? `<span class="item-nombre">${item.nombre}</span>`
      : '';

    card.innerHTML = `
      <div class="item-izq">
        <span class="badge-num">#${index + 1}</span>
        ${nombreHTML}
        <span class="item-cant">×${item.cantidad}</span>
      </div>
      <div class="item-der">
        <span class="item-precio">${item.total.toLocaleString('es-AR')} c</span>
        <button type="button" class="btn-accion-lista btn-editar" aria-label="Editar">✎</button>
        <button type="button" class="btn-accion-lista btn-borrar" aria-label="Eliminar">×</button>
      </div>
    `;

    card.querySelector('.btn-editar').addEventListener('click', () => cargarParaEditar(index));
    card.querySelector('.btn-borrar').addEventListener('click', () => eliminarDeLista(index));

    listaVentaEl.appendChild(card);
  });

  actualizarTextoBotonAgregar();
  actualizarTotalGeneral();
}

function actualizarTotalGeneral() {
  if (!modoMultipleActivo) {
    totalGeneralEl.textContent = subtotalItemActual.toLocaleString('es-AR') + ' c';
    return;
  }

  const totalLista = carrito.reduce((acc, item) => acc + item.total, 0);
  const totalMostrar = totalLista > 0 ? totalLista : subtotalItemActual;
  totalGeneralEl.textContent = totalMostrar.toLocaleString('es-AR') + ' c';
}

function limpiar() {
  carrito = [];
  indiceEditando = null;
  inputNombreEdicion.value = '';
  bannerEdicion.classList.add('oculto');
  renderizarLista();
  resetearFormularioItem();
  guardarEstado();
}

controlesNumero.forEach(control => {
  const btnRestar = control.querySelector('.btn-restar');
  const btnSumar = control.querySelector('.btn-sumar');
  const input = control.querySelector('input[type="number"]');
  const minimo = parseInt(input.getAttribute('min')) || 0;

  btnSumar.addEventListener('click', () => {
    const actual = parseInt(input.value) || 0;
    input.value = actual + 1;
    calcular(true);
  });

  btnRestar.addEventListener('click', () => {
    const actual = parseInt(input.value) || 0;
    if (actual > minimo) {
      const nuevoValor = actual - 1;
      input.value = (nuevoValor === 0 && minimo === 0) ? '' : nuevoValor;
      calcular(true);
    }
  });
});

btnAgregar.addEventListener('click', guardarEnLista);
btnCancelarEdicion.addEventListener('click', cancelarEdicion);
btnLimpiar.addEventListener('click', limpiar);

cargarEstado();
