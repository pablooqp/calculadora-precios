let rowCount = 0;
let facturaEnEdicion = null; // Variable para rastrear si se está editando una factura

function agregarFila() {
  const tbody = document.getElementById("cuerpoTabla");
  const rowId = rowCount;

  const mainRow = document.createElement("tr");
  mainRow.id = `fila-main-${rowId}`;
  mainRow.className =
    "border-t border-gray-100 hover:bg-gray-50/50 transition-colors text-sm align-middle";

  mainRow.innerHTML = `
        <td class="p-2" data-label="Producto">
            <input type="text" placeholder="Nombre..." class="w-full p-2 border-gray-200 border rounded-md focus:ring-1 focus:ring-indigo-400 outline-none">
        </td>
        <td class="p-2 text-center" data-label="Cant.">
            <input type="number" value="1" min="1" class="w-16 p-2 border-gray-200 border rounded-md cantidad text-center" oninput="calcularTodo()">
        </td>
        <td class="p-2" data-label="Neto Total">
            <input type="number" value="0" min="0" class="w-full p-2 border-gray-200 border rounded-md neto-total text-right" oninput="calcularTodo()">
        </td>
        <td class="p-2 bg-indigo-50/30" data-label="Neto Unit.">
            <input type="text" readonly class="w-full p-2 border-transparent bg-transparent font-bold text-indigo-700 neto-unitario-display text-right outline-none" value="$0">
        </td>
        <td class="p-2" data-label="ILA">
            <select class="w-full p-2 border-gray-200 border rounded-md ila-tipo text-xs" onchange="calcularTodo()">
                <option value="0">Sin ILA</option>
                <option value="0.205">Vino/Cer. (20,5%)</option>
                <option value="0.315">Destilado (31,5%)</option>
            </select>
        </td>
        <td class="p-2" data-label="Margen %">
            <input type="number" value="30" min="0" max="99" class="w-full p-2 border-gray-200 border rounded-md margen-producto text-center font-semibold text-green-600" oninput="calcularTodo()">
        </td>
        <td class="p-2 text-center" data-label="">
            <div class="flex items-center justify-center space-x-2">
                <button onclick="toggleDetails(${rowId})" class="text-indigo-500 hover:text-indigo-700 p-1 transition-transform rotate-180" id="btn-toggle-${rowId}">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>
                </button>
                <button onclick="eliminarFila(${rowId})" class="text-gray-300 hover:text-red-500 p-1 transition-colors">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                </button>
            </div>
        </td>
    `;

  const detailsRow = document.createElement("tr");
  detailsRow.id = `fila-details-${rowId}`;
  detailsRow.className = "bg-white";
  detailsRow.innerHTML = `
        <td colspan="7" class="p-0 border-b border-gray-100">
            <div id="container-details-${rowId}" class="details-panel collapsed px-4 py-3">
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4 border-l-4 border-indigo-400 pl-4 py-1">
                    
                    <!-- Bloque 1: Costos Base e Impuestos de Factura -->
                    <div class="text-[11px] space-y-1 border-r border-gray-100 pr-4">
                        <span class="text-[9px] uppercase font-bold text-gray-400 block mb-1">Costo Unitario Factura</span>
                        <div class="flex justify-between">
                            <span class="text-gray-500">Neto Producto:</span>
                            <span class="font-medium text-gray-800" id="det-neto-base-${rowId}">$0</span>
                        </div>
                        <div class="flex justify-between text-gray-500 italic">
                            <span>Flete / Otros Unit.:</span>
                            <span id="det-flete-unit-${rowId}">$0</span>
                        </div>
                        <div class="flex justify-between text-orange-600">
                            <span>ILA Pagado en Compra:</span>
                            <span id="det-ila-pago-${rowId}">$0</span>
                        </div>
                        <div class="flex justify-between text-blue-500">
                            <span>IVA Crédito (Factura):</span>
                            <span id="det-costo-iva-compra-${rowId}">$0</span>
                        </div>
                        <div class="flex justify-between font-bold text-indigo-700 pt-1 border-t border-dashed border-indigo-100">
                            <span>Desembolso Total Unit.:</span>
                            <span id="det-costo-final-${rowId}">$0</span>
                        </div>
                    </div>

                    <!-- Bloque 2: Flujo IVA -->
                    <div class="text-[11px] space-y-1 border-r border-gray-100 pr-4">
                        <span class="text-[9px] uppercase font-bold text-gray-400 block mb-1">Flujo de IVA</span>
                        <div class="flex justify-between text-gray-500">
                            <span>IVA Crédito (Compra):</span>
                            <span id="det-iva-compra-${rowId}">$0</span>
                        </div>
                        <div class="flex justify-between text-gray-500">
                            <span>IVA Débito (Venta):</span>
                            <span id="det-iva-venta-${rowId}">$0</span>
                        </div>
                        <div class="flex justify-between font-bold text-blue-600 pt-1 border-t border-dashed border-indigo-100">
                            <span>IVA a Pagar F29:</span>
                            <span id="det-dif-iva-${rowId}">$0</span>
                        </div>
                    </div>

                    <!-- Bloque 3: Proyección Venta -->
                    <div class="text-[11px] space-y-1">
                        <span class="text-[9px] uppercase font-bold text-gray-400 block mb-1">Análisis de Venta Minorista</span>
                        <div class="flex justify-between">
                            <span class="text-gray-500">Valor Neto Compra (Neto+Log+ILA):</span>
                            <span id="det-costo-reposicion-${rowId}">$0</span>
                        </div>
                        <div class="flex justify-between">
                            <span class="text-gray-500">Venta Neta Sugerida:</span>
                            <span id="det-neto-venta-${rowId}">$0</span>
                        </div>
                        <div class="flex justify-between text-blue-600">
                            <span>IVA Venta:</span>
                            <span id="det-iva-venta-val-${rowId}">$0</span>
                        </div>
                        <div class="flex justify-between items-center bg-indigo-100 p-2 rounded mt-1">
                            <span class="text-indigo-800 font-bold uppercase text-[9px]">P. VENTA FINAL (PVP):</span>
                            <input type="number" min="0" class="w-24 text-right text-base font-bold text-indigo-900 bg-white border border-indigo-300 rounded px-1 py-0.5 pvp-input" id="det-venta-sugerida-${rowId}" value="0" oninput="calcularDesdePVP(${rowId})">
                        </div>
                        <div class="flex justify-between items-center bg-green-50 p-1.5 rounded mt-1">
                            <span class="text-green-700 font-bold text-[9px]">GANANCIA NETA REAL:</span>
                            <span class="text-sm font-bold text-green-800" id="det-ganancia-${rowId}">$0</span>
                        </div>
                    </div>

                </div>
            </div>
        </td>
    `;

  tbody.appendChild(mainRow);
  tbody.appendChild(detailsRow);
  rowCount++;
  calcularTodo();
}

function toggleDetails(id) {
  const container = document.getElementById(`container-details-${id}`);
  const btn = document.getElementById(`btn-toggle-${id}`);
  if (container.classList.contains("expanded")) {
    container.classList.remove("expanded");
    container.classList.add("collapsed");
    btn.classList.add("rotate-180");
  } else {
    container.classList.remove("collapsed");
    container.classList.add("expanded");
    btn.classList.remove("rotate-180");
  }
}

function calcularDesdePVP(id) {
  const mainRow = document.getElementById(`fila-main-${id}`);
  if (!mainRow) return;

  const pvpInput = document.getElementById(`det-venta-sugerida-${id}`);
  const pvpFinal = parseFloat(pvpInput.value) || 0;

  const cant = parseFloat(mainRow.querySelector('.cantidad').value) || 0;
  const netoTotalLinea = parseFloat(mainRow.querySelector('.neto-total').value) || 0;
  const tasaILA = parseFloat(mainRow.querySelector('.ila-tipo').value) || 0;

  if (cant <= 0 || pvpFinal <= 0) return;

  const fleteTotal = parseFloat(document.getElementById('fleteTotal').value) || 0;
  const otrosCargos = parseFloat(document.getElementById('otrosCargos').value) || 0;
  const tbody = document.getElementById('cuerpoTabla');
  const allRows = tbody.querySelectorAll('tr[id^="fila-main-"]');
  let totalUnidades = 0;
  allRows.forEach(r => totalUnidades += parseFloat(r.querySelector('.cantidad').value) || 0);
  const logisticaUnitario = totalUnidades > 0 ? (fleteTotal + otrosCargos) / totalUnidades : 0;

  const netoUnitario = netoTotalLinea / cant;
  const ilaCompraUnit = netoUnitario * tasaILA;
  const costoReposicionUnit = netoUnitario + logisticaUnitario + ilaCompraUnit;

  // PVP = netoVenta * 1.19 => netoVenta = PVP / 1.19
  const netoVentaSugerido = pvpFinal / 1.19;

  // margen = 1 - (costoReposicion / netoVenta)
  const margenCalculado = costoReposicionUnit > 0 && netoVentaSugerido > 0
    ? (1 - costoReposicionUnit / netoVentaSugerido) * 100
    : 0;

  // Actualizar el campo margen con 2 decimales
  mainRow.querySelector('.margen-producto').value = margenCalculado.toFixed(2);

  // Recalcular todo sin que se pise el PVP ingresado
  calcularTodo(id);
}

function eliminarFila(id) {
  if (document.getElementById(`fila-main-${id}`))
    document.getElementById(`fila-main-${id}`).remove();
  if (document.getElementById(`fila-details-${id}`))
    document.getElementById(`fila-details-${id}`).remove();
  calcularTodo();
}

function formatoDinero(valor) {
  return new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
  }).format(Math.round(valor));
}

function calcularTodo(skipPvpId) {
  const fleteTotal =
    parseFloat(document.getElementById("fleteTotal").value) || 0;
  const otrosCargos =
    parseFloat(document.getElementById("otrosCargos").value) || 0;
  const tbody = document.getElementById("cuerpoTabla");
  const mainRows = tbody.querySelectorAll('tr[id^="fila-main-"]');

  let totalUnidades = 0;
  mainRows.forEach(
    (row) =>
      (totalUnidades += parseFloat(row.querySelector(".cantidad").value) || 0),
  );

  const logisticaUnitario =
    totalUnidades > 0 ? (fleteTotal + otrosCargos) / totalUnidades : 0;

  let sumaNetosFactura = 0;
  let sumaILAVino = 0;
  let sumaILADestilado = 0;

  mainRows.forEach((row) => {
    const id = row.id.split("-").pop();
    const cant = parseFloat(row.querySelector(".cantidad").value) || 0;
    const netoTotalLinea =
      parseFloat(row.querySelector(".neto-total").value) || 0;
    const tasaILA = parseFloat(row.querySelector(".ila-tipo").value) || 0;
    const margenDeseado =
      (parseFloat(row.querySelector(".margen-producto").value) || 0) / 100;

    const netoUnitario = cant > 0 ? netoTotalLinea / cant : 0;
    row.querySelector(".neto-unitario-display").value =
      formatoDinero(netoUnitario);

    sumaNetosFactura += netoTotalLinea;

    const ilaLinea = netoTotalLinea * tasaILA;
    if (tasaILA === 0.205) sumaILAVino += ilaLinea;
    else if (tasaILA === 0.315) sumaILADestilado += ilaLinea;

    if (cant > 0) {
      const ilaCompraUnit = netoUnitario * tasaILA;
      const costoReposicionUnit =
        netoUnitario + logisticaUnitario + ilaCompraUnit;

      const ivaCompraUnit = (netoUnitario + logisticaUnitario) * 0.19;
      const desembolsoTotalFacturaUnit =
        netoUnitario + logisticaUnitario + ilaCompraUnit + ivaCompraUnit;

      const factorMargen = margenDeseado >= 1 ? 0.01 : 1 - margenDeseado;
      const netoVentaSugerido = costoReposicionUnit / factorMargen;
      const ivaVentaUnit = netoVentaSugerido * 0.19;
      const pvpFinal = netoVentaSugerido + ivaVentaUnit;

      const diferenciaIVA = ivaVentaUnit - ivaCompraUnit;
      const gananciaNetaUnit = netoVentaSugerido - costoReposicionUnit;

      // Bloque 1
      const detNetoBase = document.getElementById(`det-neto-base-${id}`);
      if (detNetoBase) detNetoBase.innerText = formatoDinero(netoUnitario);

      const detFleteUnit = document.getElementById(`det-flete-unit-${id}`);
      if (detFleteUnit)
        detFleteUnit.innerText = formatoDinero(logisticaUnitario);

      const detIlaPago = document.getElementById(`det-ila-pago-${id}`);
      if (detIlaPago) detIlaPago.innerText = formatoDinero(ilaCompraUnit);

      const detCostoIvaCompra = document.getElementById(
        `det-costo-iva-compra-${id}`,
      );
      if (detCostoIvaCompra)
        detCostoIvaCompra.innerText = formatoDinero(ivaCompraUnit);

      const detCostoFinal = document.getElementById(`det-costo-final-${id}`);
      if (detCostoFinal)
        detCostoFinal.innerText = formatoDinero(desembolsoTotalFacturaUnit);

      // Bloque 2
      const detIvaCompra = document.getElementById(`det-iva-compra-${id}`);
      if (detIvaCompra) detIvaCompra.innerText = formatoDinero(ivaCompraUnit);

      const detIvaVenta = document.getElementById(`det-iva-venta-${id}`);
      if (detIvaVenta) detIvaVenta.innerText = formatoDinero(ivaVentaUnit);

      const detDifIva = document.getElementById(`det-dif-iva-${id}`);
      if (detDifIva) detDifIva.innerText = formatoDinero(diferenciaIVA);

      // Bloque 3
      const detCostoReposicion = document.getElementById(
        `det-costo-reposicion-${id}`,
      );
      if (detCostoReposicion)
        detCostoReposicion.innerText = formatoDinero(costoReposicionUnit);

      const detNetoVenta = document.getElementById(`det-neto-venta-${id}`);
      if (detNetoVenta)
        detNetoVenta.innerText = formatoDinero(netoVentaSugerido);

      const detIvaVentaVal = document.getElementById(`det-iva-venta-val-${id}`);
      if (detIvaVentaVal)
        detIvaVentaVal.innerText = formatoDinero(ivaVentaUnit);

      const detVentaSugerida = document.getElementById(
        `det-venta-sugerida-${id}`,
      );
      if (detVentaSugerida && parseInt(id) !== skipPvpId) {
        detVentaSugerida.value = Math.round(pvpFinal);
      }

      const detGanancia = document.getElementById(`det-ganancia-${id}`);
      if (detGanancia) detGanancia.innerText = formatoDinero(gananciaNetaUnit);
    }
  });

  const subtotalNetoFactura = sumaNetosFactura + fleteTotal + otrosCargos;
  const totalILA = sumaILAVino + sumaILADestilado;
  const totalIVAFactura = subtotalNetoFactura * 0.19;
  const granTotalFactura = subtotalNetoFactura + totalILA + totalIVAFactura;

  document.getElementById("resNeto").innerText =
    formatoDinero(subtotalNetoFactura);
  document.getElementById("resILAVino").innerText = formatoDinero(sumaILAVino);
  document.getElementById("resILADestilado").innerText =
    formatoDinero(sumaILADestilado);
  document.getElementById("resILA").innerText = formatoDinero(totalILA);
  document.getElementById("resIVA").innerText = formatoDinero(totalIVAFactura);
  document.getElementById("resTotal").innerText =
    formatoDinero(granTotalFactura);
}

function limpiar() {
  document.getElementById("fleteTotal").value = 0;
  document.getElementById("otrosCargos").value = 0;
  document.getElementById("cuerpoTabla").innerHTML = "";
  document.getElementById("nombreFactura").value = "";
  document.getElementById("numeroFactura").value = "";
  document.getElementById("nombreEmpresa").value = "";
  document.getElementById("fechaFactura").value = "";
  agregarFila();
}

function nuevaFactura() {
  facturaEnEdicion = null;
  limpiar();
  document.getElementById("nombreFactura").focus();
}

function getFacturaDatosGenerales() {
  return {
    numeroFactura: document.getElementById("numeroFactura").value || "",
    nombreEmpresa: document.getElementById("nombreEmpresa").value || "",
    fechaFactura: document.getElementById("fechaFactura").value || "",
    nombre: document.getElementById("nombreFactura").value || "",
  };
}

function setFacturaDatosGenerales(factura) {
  document.getElementById("numeroFactura").value = factura.numeroFactura || "";
  document.getElementById("nombreEmpresa").value = factura.nombreEmpresa || "";
  document.getElementById("fechaFactura").value = factura.fechaFactura || "";
  document.getElementById("nombreFactura").value = factura.nombre || "";
}

function guardarFactura() {
  const tbody = document.getElementById("cuerpoTabla");
  const mainRows = tbody.querySelectorAll('tr[id^="fila-main-"]');

  const datos = getFacturaDatosGenerales();
  const factura = {
    ...datos,
    fleteTotal: parseFloat(document.getElementById("fleteTotal").value) || 0,
    otrosCargos: parseFloat(document.getElementById("otrosCargos").value) || 0,
    productos: [],
  };

  mainRows.forEach((row) => {
    const producto = {
      nombre: row.querySelector('input[placeholder="Nombre..."]').value,
      cantidad: parseFloat(row.querySelector(".cantidad").value) || 0,
      netoTotal: parseFloat(row.querySelector(".neto-total").value) || 0,
      ilaTipo: parseFloat(row.querySelector(".ila-tipo").value) || 0,
      margen: parseFloat(row.querySelector(".margen-producto").value) || 0,
    };
    factura.productos.push(producto);
  });

  const facturasGuardadas = JSON.parse(localStorage.getItem("facturas")) || [];

  if (facturaEnEdicion !== null) {
    // Sobrescribir la factura en edición
    facturasGuardadas[facturaEnEdicion] = factura;
    alert("Factura actualizada exitosamente.");
  } else {
    // Agregar una nueva factura
    facturasGuardadas.push(factura);
    alert("Factura guardada exitosamente.");
  }

  localStorage.setItem("facturas", JSON.stringify(facturasGuardadas));
  cargarFacturas();

  // Preguntar si desea limpiar después de guardar
  if (confirm("¿Desea limpiar los datos después de guardar?")) {
    limpiar();
  }
}

function cargarFacturas() {
  const listadoFacturas = document.getElementById("listadoFacturas");
  listadoFacturas.innerHTML = "";

  const facturasGuardadas = JSON.parse(localStorage.getItem("facturas")) || [];
  facturasGuardadas.forEach((factura, index) => {
    let nombreMostrar = factura.nombre && factura.nombre.trim()
      ? factura.nombre
      : ((factura.numeroFactura || "") + (factura.nombreEmpresa ? " - " + factura.nombreEmpresa : "")).trim();
    if (!nombreMostrar) nombreMostrar = `Factura ${index + 1}`;
    const li = document.createElement("li");
    li.className =
      "flex justify-between items-center p-2 bg-gray-50 rounded shadow-sm";
    li.innerHTML = `
            <span><button onclick="editarFactura(${index})" class="text-indigo-600 hover:underline">${nombreMostrar} - Productos: ${factura.productos.length}</button></span>
            <div class="flex space-x-2">
                <button onclick="descargarFactura(${index})" class="text-green-600 hover:underline">Descargar</button>
                <button onclick="eliminarFactura(${index})" class="text-red-600 hover:underline">Eliminar</button>
            </div>
        `;
    listadoFacturas.appendChild(li);
  });
}

function eliminarFactura(index) {
  const facturasGuardadas = JSON.parse(localStorage.getItem("facturas")) || [];

  if (index < 0 || index >= facturasGuardadas.length) {
    alert("Factura no encontrada.");
    return;
  }

  // Eliminar la factura seleccionada
  facturasGuardadas.splice(index, 1);
  localStorage.setItem("facturas", JSON.stringify(facturasGuardadas));

  alert("Factura eliminada exitosamente.");
  cargarFacturas();
}

function descargarFactura(index) {
  const facturasGuardadas = JSON.parse(localStorage.getItem("facturas")) || [];
  const factura = facturasGuardadas[index];
  if (!factura) {
    alert("Factura no encontrada.");
    return;
  }
  const blob = new Blob([JSON.stringify(factura, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = (factura.nombre || "factura").replace(/[^a-zA-Z0-9áéíóúñÁÉÍÓÚÑ _-]/g, "") + ".json";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function importarFactura(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function (e) {
    try {
      const factura = JSON.parse(e.target.result);
      if (!factura.productos || !Array.isArray(factura.productos)) {
        alert("El archivo no tiene un formato de factura válido.");
        return;
      }
      // Si faltan datos generales, pedirlos
      if (!factura.numeroFactura || !factura.nombreEmpresa || !factura.fechaFactura) {
        factura.numeroFactura = prompt("Ingrese el N° de Factura:", "");
        factura.nombreEmpresa = prompt("Ingrese el nombre de la empresa:", "");
        factura.fechaFactura = prompt("Ingrese la fecha de la factura (YYYY-MM-DD):", "");
      }
      const facturasGuardadas = JSON.parse(localStorage.getItem("facturas")) || [];
      facturasGuardadas.push(factura);
      localStorage.setItem("facturas", JSON.stringify(facturasGuardadas));
      cargarFacturas();
      alert("Factura importada exitosamente: " + factura.nombre);
    } catch (err) {
      alert("Error al leer el archivo JSON.");
    }
  };
  reader.readAsText(file);
  event.target.value = "";
}

function editarFactura(index) {
  const facturasGuardadas = JSON.parse(localStorage.getItem("facturas")) || [];
  const factura = facturasGuardadas[index];

  if (!factura) {
    alert("Factura no encontrada.");
    return;
  }

  facturaEnEdicion = index;
  setFacturaDatosGenerales(factura);
  document.getElementById("fleteTotal").value = factura.fleteTotal;
  document.getElementById("otrosCargos").value = factura.otrosCargos;

  // Limpiar la tabla de productos
  const tbody = document.getElementById("cuerpoTabla");
  tbody.innerHTML = "";

  // Cargar los productos de la factura
  factura.productos.forEach((producto) => {
    agregarFila();
    const rows = tbody.querySelectorAll('tr[id^="fila-main-"]');
    const lastRow = rows[rows.length - 1];
    if (lastRow) {
      const nombreInput = lastRow.querySelector('input[placeholder="Nombre..."]');
      const cantidadInput = lastRow.querySelector(".cantidad");
      const netoTotalInput = lastRow.querySelector(".neto-total");
      const ilaTipoSelect = lastRow.querySelector(".ila-tipo");
      const margenInput = lastRow.querySelector(".margen-producto");
      if (nombreInput) nombreInput.value = producto.nombre;
      if (cantidadInput) cantidadInput.value = producto.cantidad;
      if (netoTotalInput) netoTotalInput.value = producto.netoTotal;
      if (ilaTipoSelect) ilaTipoSelect.value = producto.ilaTipo;
      if (margenInput) margenInput.value = producto.margen;
    }
  });
  calcularTodo();
}

// Cargar facturas al iniciar
window.onload = function () {
  agregarFila(); // Asegurar que haya al menos una fila inicial
  cargarFacturas(); // Cargar las facturas almacenadas en localStorage
};
