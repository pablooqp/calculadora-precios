let rowCount = 0;
let facturaEnEdicion = null; // Variable para rastrear si se está editando una factura
let productosCache = [];

async function cargarProductos() {
  try {
    const resp = await fetch('https://pub-003150e7951b49dcafdf09e331520cd5.r2.dev/productos.json');
    const json = await resp.json();
    productosCache = (json.data || []).filter(p => p.DESCRIPCION && p.DESCRIPCION.trim());
  } catch (e) {
    console.error('Error al cargar productos:', e);
  }
}

function configurarAutocompletado(input, rowId) {
  const wrapper = document.createElement('div');
  wrapper.className = 'autocomplete-wrapper';
  input.parentNode.insertBefore(wrapper, input);
  wrapper.appendChild(input);

  const lista = document.createElement('ul');
  lista.className = 'autocomplete-list';
  document.body.appendChild(lista);

  let seleccionado = false;

  function posicionarLista() {
    const rect = input.getBoundingClientRect();
    lista.style.left = rect.left + 'px';
    lista.style.top = (rect.bottom + 2) + 'px';
    lista.style.width = rect.width + 'px';
  }

  input.addEventListener('input', function () {
    seleccionado = false;
    const texto = this.value.trim().toLowerCase();
    lista.innerHTML = '';
    if (texto.length < 2) { lista.style.display = 'none'; return; }
    const resultados = productosCache.filter(p =>
      p.DESCRIPCION.toLowerCase().includes(texto)
    ).slice(0, 10);
    if (resultados.length === 0) { lista.style.display = 'none'; return; }
    resultados.forEach(p => {
      const li = document.createElement('li');
      li.className = 'autocomplete-item';
      li.innerHTML = `<span>${p.DESCRIPCION}</span><span class="text-xs text-gray-400 ml-2">PV: $${p.PVENTA.toLocaleString('es-CL')}</span>`;
      li.addEventListener('mousedown', function (e) {
        e.preventDefault();
        input.value = p.DESCRIPCION;
        seleccionado = true;
        lista.style.display = 'none';
        const label = document.getElementById(`det-pventa-programa-${rowId}`);
        if (label) {
          label.innerText = `Precio programa de venta: $${p.PVENTA.toLocaleString('es-CL')}`;
          label.style.display = 'block';
        }
      });
      lista.appendChild(li);
    });
    posicionarLista();
    lista.style.display = 'block';
  });

  input.addEventListener('blur', function () {
    setTimeout(() => { lista.style.display = 'none'; }, 150);
  });

  input.addEventListener('focus', function () {
    if (lista.children.length > 0 && !seleccionado) lista.style.display = 'block';
  });
}

function esDispositivoMovil() {
  return /Mobi|Android|iPhone|iPad|iPod|Opera Mini|IEMobile|WPDesktop/i.test(navigator.userAgent);
}

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
                <option value="0">Sin Impuesto</option>
                <option value="0.205">ILA Vino/Cer. (20,5%)</option>
                <option value="0.315">ILA Destilado (31,5%)</option>
                <option value="0.1">IABA (10%)</option>
                <option value="0.18">IABA (18%)</option>
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
                            <span>Impuesto Pagado en Compra:</span>
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
                            <span class="text-gray-500">Valor Neto Compra (Neto+Log+Imp.):</span>
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
                        <div class="text-[9px] text-orange-600 font-semibold hidden" id="det-pventa-programa-${rowId}"></div>
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

  const productoInput = mainRow.querySelector('input[placeholder="Nombre..."]');
  if (productoInput) configurarAutocompletado(productoInput, rowId);

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

  const totales = calcularTotalesFactura();
  const netoUnitario = netoTotalLinea / cant;
  const logisticaUnitario = calcularLogisticaUnitario(netoUnitario, cant, netoTotalLinea, tasaILA, totales);
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
  if (confirm("¿Desea eliminar la fila?")) {
    if (document.getElementById(`fila-main-${id}`))
      document.getElementById(`fila-main-${id}`).remove();
    if (document.getElementById(`fila-details-${id}`))
      document.getElementById(`fila-details-${id}`).remove();
    calcularTodo();
  }
}

function formatoDinero(valor) {
  return new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
  }).format(Math.round(valor));
}

function calcularLogisticaUnitario(netoUnitario, cant, netoTotalLinea, tasaILA, totales) {
  const metodo = document.getElementById('metodoFlete').value;
  if (metodo === 'ccu') {
    const numLineas = totales.mainRows.length;
    return calcularTransporteCCU(totales.fleteTotal + totales.otrosCargos, numLineas, cant);
  }
  if (metodo === 'proporcional') {
    return obtenerTransporteUnitario(netoUnitario, tasaILA, totales.granTotalFactura, totales.sumaBrutosTeoricos, totales.ivaSinILA);
  }
  const totalUnidades = Array.from(totales.mainRows).reduce((sum, r) => sum + (parseFloat(r.querySelector('.cantidad').value) || 0), 0);
  return totalUnidades > 0 ? (totales.fleteTotal + totales.otrosCargos) / totalUnidades : 0;
}

function calcularTransporteCCU(netoFleteFactura, numLineas, cantidadUnidades) {
  if (numLineas === 0 || cantidadUnidades === 0) return 0;
  const fletePorLinea = netoFleteFactura / numLineas;
  return parseFloat((fletePorLinea / cantidadUnidades).toFixed(2));
}

function obtenerTransporteUnitario(netoUnitario, tasaILA, totalFactura, sumaBrutosTeoricos, ivaSinILA) {
  const TASA_IVA = 0.19;
  if (sumaBrutosTeoricos === 0) return 0;
  const factorRecargo = totalFactura / sumaBrutosTeoricos;
  const brutoSinFlete = ivaSinILA
    ? netoUnitario * (1 + TASA_IVA) + netoUnitario * tasaILA
    : netoUnitario * (1 + tasaILA) * (1 + TASA_IVA);
  const brutoConFlete = brutoSinFlete * factorRecargo;
  const transporteBruto = brutoConFlete - brutoSinFlete;
  const transporteNetoUnitario = transporteBruto / (1 + TASA_IVA);
  return parseFloat(transporteNetoUnitario.toFixed(2));
}

function calcularTotalesFactura() {
  const fleteTotal = parseFloat(document.getElementById("fleteTotal").value) || 0;
  const otrosCargos = parseFloat(document.getElementById("otrosCargos").value) || 0;
  const tbody = document.getElementById("cuerpoTabla");
  const mainRows = tbody.querySelectorAll('tr[id^="fila-main-"]');

  let sumaNetosFactura = 0;
  let sumaILAVino = 0;
  let sumaILADestilado = 0;
  let sumaIABA = 0;
  let sumaBrutosTeoricos = 0;

  const ivaSinILA = document.getElementById('ivaSinILA').checked;

  mainRows.forEach((row) => {
    const netoTotalLinea = parseFloat(row.querySelector(".neto-total").value) || 0;
    const tasaILA = parseFloat(row.querySelector(".ila-tipo").value) || 0;
    sumaNetosFactura += netoTotalLinea;
    const ilaLinea = netoTotalLinea * tasaILA;
    if (tasaILA === 0.205) sumaILAVino += ilaLinea;
    else if (tasaILA === 0.315) sumaILADestilado += ilaLinea;
    else if (tasaILA === 0.1 || tasaILA === 0.18) sumaIABA += ilaLinea;
    sumaBrutosTeoricos += ivaSinILA
      ? netoTotalLinea * (1.19 + tasaILA)
      : netoTotalLinea * (1 + tasaILA) * 1.19;
  });

  const subtotalNetoFactura = sumaNetosFactura + fleteTotal + otrosCargos;
  const totalILA = sumaILAVino + sumaILADestilado + sumaIABA;
  const totalIVAFactura = ivaSinILA
    ? subtotalNetoFactura * 0.19
    : (subtotalNetoFactura + totalILA) * 0.19;
  const granTotalFactura = subtotalNetoFactura + totalILA + totalIVAFactura;

  return {
    fleteTotal, otrosCargos, mainRows,
    sumaNetosFactura, sumaILAVino, sumaILADestilado, sumaIABA,
    sumaBrutosTeoricos, subtotalNetoFactura, totalILA,
    totalIVAFactura, granTotalFactura, ivaSinILA
  };
}

function calcularTodo(skipPvpId) {
  const totales = calcularTotalesFactura();
  const { mainRows, granTotalFactura, sumaBrutosTeoricos } = totales;

  // Acumuladores para resumen de rentabilidad
  let rentTotalUnidades = 0;
  let rentSumaCostoReposicion = 0;
  let rentSumaVentaPVP = 0;
  let rentSumaVentaNeta = 0;
  let rentSumaGananciaBruta = 0;
  let rentSumaIvaPagar = 0;
  let rentPesoTotal = 0;
  let rentCantTotal = 0;

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

    const nombre = row.querySelector('input[placeholder="Nombre..."]')?.value || "";
    if (cant !== Math.floor(cant)) rentPesoTotal += cant; else rentCantTotal += cant;

    if (cant > 0) {
      const logisticaUnitario = calcularLogisticaUnitario(netoUnitario, cant, netoTotalLinea, tasaILA, totales);
      const ilaCompraUnit = netoUnitario * tasaILA;
      const costoReposicionUnit =
        netoUnitario + logisticaUnitario + ilaCompraUnit;

      const ivaSinILA = document.getElementById('ivaSinILA').checked;
      const ivaCompraUnit = ivaSinILA
        ? (netoUnitario + logisticaUnitario) * 0.19
        : (netoUnitario + logisticaUnitario + ilaCompraUnit) * 0.19;
      const desembolsoTotalFacturaUnit =
        netoUnitario + logisticaUnitario + ilaCompraUnit + ivaCompraUnit;

      const factorMargen = margenDeseado >= 1 ? 0.01 : 1 - margenDeseado;
      const netoVentaSugerido = costoReposicionUnit / factorMargen;
      const ivaVentaUnit = netoVentaSugerido * 0.19;
      const pvpFinal = netoVentaSugerido + ivaVentaUnit;

      const diferenciaIVA = ivaVentaUnit - ivaCompraUnit;
      const gananciaNetaUnit = netoVentaSugerido - costoReposicionUnit;

      // Acumular para resumen de rentabilidad
      rentTotalUnidades += cant;
      rentSumaCostoReposicion += costoReposicionUnit * cant;
      rentSumaVentaPVP += pvpFinal * cant;
      rentSumaVentaNeta += netoVentaSugerido * cant;
      rentSumaGananciaBruta += gananciaNetaUnit * cant;
      rentSumaIvaPagar += diferenciaIVA * cant;

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

  // === Actualizar Resumen Rentabilidad ===
  // El IVA es impuesto de paso (crédito/débito se compensan), no reduce la ganancia.
  // La ganancia neta real = sumaVentaNeta - sumaCostoReposicion (ya calculada como rentSumaGananciaBruta).
  const rentGananciaNeta = rentSumaGananciaBruta;
  const rentGananciaUnidad = rentTotalUnidades > 0 ? rentGananciaNeta / rentTotalUnidades : 0;
  const rentROI = granTotalFactura > 0 ? (rentGananciaNeta / granTotalFactura) * 100 : 0;
  const rentMargenProm = rentSumaVentaNeta > 0 ? (rentSumaGananciaBruta / rentSumaVentaNeta) * 100 : 0;

  document.getElementById("rentCantUnitarios").innerText = rentCantTotal + " uds.";
  document.getElementById("rentCantPesados").innerText = rentPesoTotal.toFixed(3).replace(/\.?0+$/, "") + " kg";
  document.getElementById("rentInversion").innerText = formatoDinero(granTotalFactura);
  document.getElementById("rentCostoReposicion").innerText = formatoDinero(rentSumaCostoReposicion);
  document.getElementById("rentVentaTotal").innerText = formatoDinero(rentSumaVentaPVP);
  document.getElementById("rentVentaNeta").innerText = formatoDinero(rentSumaVentaNeta);
  document.getElementById("rentIvaSII").innerText = formatoDinero(rentSumaIvaPagar);
  document.getElementById("rentILATotal").innerText = formatoDinero(totales.totalILA);
  document.getElementById("rentGananciaNeta").innerText = formatoDinero(rentGananciaNeta);
  document.getElementById("rentGananciaUnidad").innerText = formatoDinero(rentGananciaUnidad);
  document.getElementById("rentROI").innerText = rentROI.toFixed(1) + "%";
  document.getElementById("rentMargenProm").innerText = rentMargenProm.toFixed(1) + "%";

  // === Actualizar Resumen Factura ===
  document.getElementById("resNeto").innerText =
    formatoDinero(totales.subtotalNetoFactura);
  document.getElementById("resILAVino").innerText = formatoDinero(totales.sumaILAVino);
  document.getElementById("resILADestilado").innerText =
    formatoDinero(totales.sumaILADestilado);
  document.getElementById("resIABA").innerText = formatoDinero(totales.sumaIABA);
  document.getElementById("resILA").innerText = formatoDinero(totales.totalILA);
  document.getElementById("resIVA").innerText = formatoDinero(totales.totalIVAFactura);
  document.getElementById("resTotal").innerText =
    formatoDinero(totales.granTotalFactura);
}

function limpiar() {
  document.getElementById("fleteTotal").value = 0;
  document.getElementById("otrosCargos").value = 0;
  document.getElementById("metodoFlete").value = "proporcional";
  document.getElementById("ivaSinILA").checked = false;
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
    metodoFlete: document.getElementById("metodoFlete").value || "proporcional",
    ivaSinILA: document.getElementById("ivaSinILA").checked || false,
    productos: [],
  };

  mainRows.forEach((row) => {
    const id = row.id.split("-").pop();
    const pvpInput = document.getElementById(`det-venta-sugerida-${id}`);
    const producto = {
      nombre: row.querySelector('input[placeholder="Nombre..."]').value,
      cantidad: parseFloat(row.querySelector(".cantidad").value) || 0,
      netoTotal: parseFloat(row.querySelector(".neto-total").value) || 0,
      ilaTipo: parseFloat(row.querySelector(".ila-tipo").value) || 0,
      pvp: pvpInput ? (parseFloat(pvpInput.value) || 0) : 0,
      margen: parseFloat(row.querySelector(".margen-producto").value) || 0,
    };
    factura.productos.push(producto);
  });

  const facturasGuardadas = JSON.parse(localStorage.getItem("facturas")) || [];

  let idx = facturaEnEdicion;
  if (idx !== null) {
    facturasGuardadas[idx] = factura;
    alert("Factura actualizada exitosamente.");
  } else {
    facturasGuardadas.push(factura);
    idx = facturasGuardadas.length - 1;
    alert("Factura guardada exitosamente.");
  }

  localStorage.setItem("facturas", JSON.stringify(facturasGuardadas));
  cargarFacturas();

  if (confirm("¿Desea limpiar los datos después de guardar?")) {
    facturaEnEdicion = null;
    limpiar();
  } else {
    facturaEnEdicion = idx;
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

function procesarXMLSII(xmlText) {
  const xmlDoc = new DOMParser().parseFromString(xmlText, "text/xml");
  if (xmlDoc.querySelector("parsererror")) {
    alert("El archivo XML no es válido.");
    return;
  }
  const encabezado = xmlDoc.getElementsByTagName("Encabezado")[0];
  if (!encabezado) { alert("No se encontró estructura DTE válida en el XML."); return; }

  const idDoc = encabezado.getElementsByTagName("IdDoc")[0];
  const emisor = encabezado.getElementsByTagName("Emisor")[0];

  const folio = idDoc?.getElementsByTagName("Folio")[0]?.textContent || "";
  const fecha = idDoc?.getElementsByTagName("FchEmis")[0]?.textContent || "";
  const razonSocial = emisor?.getElementsByTagName("RznSoc")[0]?.textContent || "Empresa no especificada";

  document.getElementById("numeroFactura").value = folio;
  document.getElementById("nombreEmpresa").value = razonSocial;
  document.getElementById("fechaFactura").value = formatearFechaSII(fecha);
  document.getElementById("nombreFactura").value = `${razonSocial} - Factura N°${folio}`;

  const detalles = xmlDoc.getElementsByTagName("Detalle");
  if (detalles.length === 0) { alert("No se encontraron productos en el XML."); return; }

  const tbody = document.getElementById("cuerpoTabla");
  tbody.innerHTML = "";
  for (let i = 0; i < detalles.length; i++) {
    const det = detalles[i];
    const nombre = det.getElementsByTagName("NmbItem")[0]?.textContent || "Producto";
    const qty = parseFloat(det.getElementsByTagName("QtyItem")[0]?.textContent) || 1;
    const monto = parseFloat(det.getElementsByTagName("MontoItem")[0]?.textContent) || 0;

    let ilaTipo = 0;
    const impuestos = det.getElementsByTagName("ImptoRet");
    for (let j = 0; j < impuestos.length; j++) {
      const codImp = impuestos[j].getElementsByTagName("CodImp")[0]?.textContent;
      if (codImp === "15" || codImp === "16") ilaTipo = 0.205;
      else if (codImp === "17" || codImp === "18") ilaTipo = 0.315;
      else {
        const tasa = impuestos[j].getElementsByTagName("TasaImp")[0]?.textContent;
        if (tasa === "10") ilaTipo = 0.1;
        else if (tasa === "18") ilaTipo = 0.18;
      }
    }

    agregarFila();
    const rows = tbody.querySelectorAll('tr[id^="fila-main-"]');
    const lastRow = rows[rows.length - 1];
    if (lastRow) {
      lastRow.querySelector('input[placeholder="Nombre..."]').value = nombre;
      lastRow.querySelector(".cantidad").value = qty;
      lastRow.querySelector(".neto-total").value = monto;
      if (ilaTipo > 0) lastRow.querySelector(".ila-tipo").value = ilaTipo;
    }
  }
  calcularTodo();
  alert(`Factura SII #${folio} importada exitosamente con ${detalles.length} producto(s).`);
}

function importarXMLSII(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function (e) { procesarXMLSII(e.target.result); };
  reader.readAsText(file);
  event.target.value = "";
}

function formatearFechaSII(fechaStr) {
  if (!fechaStr) return "";
  const parts = fechaStr.split("-");
  if (parts.length === 3 && parts[0].length === 4) return fechaStr;
  if (parts.length === 3) return `${parts[2]}-${parts[1]}-${parts[0]}`;
  return fechaStr;
}

let pdfjsLib = null;
async function cargarPDFjs() {
  if (pdfjsLib) return pdfjsLib;
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js";
    script.onload = () => {
      pdfjsLib = window.pdfjsLib;
      pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
      resolve(pdfjsLib);
    };
    script.onerror = () => reject(new Error("No se pudo cargar PDF.js"));
    document.head.appendChild(script);
  });
}

async function importarPDFFactura(event) {
  const file = event.target.files[0];
  if (!file) return;
  try {
    const PDFLib = await cargarPDFjs();
    const data = new Uint8Array(await file.arrayBuffer());
    const pdf = await PDFLib.getDocument({ data }).promise;
    let textoCompleto = "";
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      const lineasY = {};
      content.items.forEach(item => {
        const y = Math.round(item.transform[5]);
        if (!lineasY[y]) lineasY[y] = [];
        lineasY[y].push(item.str);
      });
      const ys = Object.keys(lineasY).map(Number).sort((a, b) => b - a);
      ys.forEach(y => { textoCompleto += lineasY[y].join(" ") + "\n"; });
    }

    const datos = parsearTextoFactura(textoCompleto);
    if (!datos.productos || datos.productos.length === 0) {
      alert("No se pudieron extraer productos del PDF. Revisá que el archivo sea una factura válida.");
      return;
    }

    const xmlStr = generarXMLdesdePDF(datos);
    procesarXMLSII(xmlStr);

    document.getElementById("fleteTotal").value = datos.fleteTotal;
    document.getElementById("otrosCargos").value = datos.otrosCargos;
    calcularTodo();
  } catch (err) {
    alert("Error al leer el PDF: " + err.message);
  }
  event.target.value = "";
}

const MESES_ES = {enero:"01",febrero:"02",marzo:"03",abril:"04",mayo:"05",junio:"06",julio:"07",agosto:"08",septiembre:"09",octubre:"10",noviembre:"11",diciembre:"12"};

function parsearTextoFactura(texto) {
  const lineas = texto.split("\n").map(l => l.trim()).filter(l => l);
  const textoPlano = lineas.join(" ");

  const rucRut = textoPlano.match(/(\d{1,2}(?:\.\d{3}){2}-[\dkK])/);
  const folioMatch = textoPlano.match(/N[º°]\s*(\d+)/i) || textoPlano.match(/Folio[:\s]*(\d+)/i) || textoPlano.match(/N[uú]mero[:\s]*(\d+)/i) || textoPlano.match(/(\d{6,})/);

  let fechaFactura = "";
  const fechaESPatt = /(\d{1,2})\s+de\s+([a-záéíóúñ]+)\s+del?\s+(\d{4})/i;
  const fechaESMatch = textoPlano.match(fechaESPatt);
  if (fechaESMatch) {
    const mes = MESES_ES[fechaESMatch[2].toLowerCase()] || "01";
    fechaFactura = `${fechaESMatch[3]}-${mes}-${fechaESMatch[1].padStart(2,"0")}`;
  } else {
    const fechaMatch = textoPlano.match(/(\d{2})[\/-](\d{2})[\/-](\d{4})/) || textoPlano.match(/(\d{4})[\/-](\d{2})[\/-](\d{2})/);
    if (fechaMatch) {
      fechaFactura = fechaMatch[1].length === 4 ? `${fechaMatch[1]}-${fechaMatch[2]}-${fechaMatch[3]}` : `${fechaMatch[3]}-${fechaMatch[2]}-${fechaMatch[1]}`;
    }
  }

  let nombreEmpresa = "";
  for (let i = 1; i < lineas.length; i++) {
    if (/^Giro/i.test(lineas[i])) { nombreEmpresa = lineas[i - 1]; break; }
  }
  if (!nombreEmpresa || nombreEmpresa.length < 5) {
    const rznMatch = textoPlano.match(/Raz[\s]*[oó]n Social[:\s]*([A-Za-záéíóúñÑÁÉÍÓÚ][A-Za-záéíóúñÑÁÉÍÓÚ\s&,\.]+?)(?=\s+RUT|\s+Direcci[oó]n|\s+Giro|\s+Folio|\d{7,})/i);
    if (rznMatch) nombreEmpresa = rznMatch[1].trim();
  }
  if (!nombreEmpresa || nombreEmpresa.length < 5) {
    for (const l of lineas) {
      if (/^[A-ZÁÉÍÓÚÑ][A-ZÁÉÍÓÚÑ\s\.]{3,}(SPA|LTDA|S\.?A\.?|EIRL|LIMITADA)/i.test(l) && l.length > 5) {
        nombreEmpresa = l; break;
      }
    }
  }
  if (!nombreEmpresa || nombreEmpresa.length < 5) {
    nombreEmpresa = lineas[0] ? lineas[0].replace(/^(R\.?U\.?T\.?[:\s]*[\d.,-]+\s*)?/, "").trim() : "";
  }
  if (!nombreEmpresa || nombreEmpresa.length < 3) nombreEmpresa = "Empresa desde PDF";

  let numeroFactura = folioMatch ? folioMatch[1] : "";
  const nombreFactura = `${nombreEmpresa}${numeroFactura ? " - Factura N°" + numeroFactura : ""}`;

  let fleteTotal = 0;
  const costoLogMatch = textoPlano.match(/Costo\s*Logistico\s*\$?\s*([\d.,]+)/i);
  if (costoLogMatch) fleteTotal = parsearNumeroCL(costoLogMatch[1]);
  for (const l of lineas) {
    if (/\bflete\b/i.test(l) && !costoLogMatch) {
      const nums = [...l.matchAll(/[\d.,]+/g)].filter(m => !(m[0].length === 1 && (m[0] === '.' || m[0] === ',')));
      if (nums.length > 0) { fleteTotal = parsearNumeroCL(nums[nums.length - 1][0]); break; }
    }
  }
  const fleteMatch = textoPlano.match(/Flete[:\s]*\$?\s*([\d.,]+)/i);
  if (fleteMatch && fleteTotal === 0) fleteTotal = parsearNumeroCL(fleteMatch[1]);

  let otrosCargos = 0;
  const cargoMatch = textoPlano.match(/(?:Otros[:\s]*|Cargos?[:\s]*)\$?\s*([\d.,]+)/i);
  if (cargoMatch) otrosCargos = parsearNumeroCL(cargoMatch[1]);

  const productos = extraerProductosPDF(lineas, textoPlano);
  return { numeroFactura, nombreEmpresa, fechaFactura, nombreFactura, fleteTotal, otrosCargos, productos };
}

function extraerProductosPDF(lineas, textoPlano) {
  const productos = [];
  const numPatt = /[\d.,]+/g;
  const skuPatt = /^[A-Za-z0-9]+(?:[-][A-Za-z0-9]+)+\s*/;

  for (let i = 0; i < lineas.length; i++) {
    const l = lineas[i].trim();
    if (!l || l.length < 10) continue;
    if (/Neto[:\s]|IVA[:\s]|Total[:\s]|SubTotal|MONTO NETO|Costo Logistico|Timbre|Codigo Descripcion|Adic/i.test(l)) continue;
    if (/\bflete\b/i.test(l)) continue;

    const rawMatches = [...l.matchAll(numPatt)];
    const matches = rawMatches.filter(m => !(m[0].length === 1 && (m[0] === '.' || m[0] === ',')));
    if (matches.length < 4) continue;

    const ultimoConComma = matches.reduce((last, m, idx) => m[0].includes(',') ? idx : last, -1);

    let qtyMatch, totalMatch, taxMatch;

    const esILA = ultimoConComma >= 0 && parsearNumeroCL(matches[ultimoConComma][0]) < 100;
    if (esILA && ultimoConComma >= 2) {
      taxMatch = matches[ultimoConComma];
      qtyMatch = matches[ultimoConComma - 2];
    } else if (ultimoConComma >= 1) {
      qtyMatch = matches[ultimoConComma - 1];
    } else if (matches.length >= 5) {
      const rawPct = matches[matches.length - 3][0];
      const esTaxSinComma = rawPct.includes('.') || rawPct === "10" || rawPct === "18";
      if (esTaxSinComma) {
        qtyMatch = matches[matches.length - 5];
        taxMatch = matches[matches.length - 3];
      } else {
        qtyMatch = matches[matches.length - 3];
      }
    } else {
      qtyMatch = matches[1];
    }
    totalMatch = matches[matches.length - 1];

    const qtyRaw = qtyMatch[0];
    const qtyDecimal = qtyRaw.includes('.') || qtyRaw.includes(',') ? parseFloat(qtyRaw.replace(',','.')) : parseInt(qtyRaw);
    const totalVal = parsearNumeroCL(totalMatch[0]);

    let nombre = l.substring(0, qtyMatch.index).trim();
    nombre = nombre.replace(skuPatt, "").trim();
    nombre = nombre.replace(/^[^A-Za-záéíóúñÑÁÉÍÓÚ]+/, "").trim();
    nombre = nombre.replace(/\s+/g, " ");
    if (nombre.length < 3) continue;

    if (!taxMatch && ultimoConComma >= 0 && !esILA && matches.length - ultimoConComma === 3) {
      const v = parsearNumeroCL(matches[ultimoConComma + 1][0]);
      if (v === 10 || v === 18) taxMatch = matches[ultimoConComma + 1];
    }

    let taxPct = 0, taxType = "";
    if (taxMatch) {
      const raw = taxMatch[0];
      let pct = parsearNumeroCL(raw);
      if (raw.includes('.') && !raw.includes(',')) {
        const dec = parseFloat(raw);
        if (dec > 0 && dec < 100) pct = dec;
      }
      if ([20.5, 31.5].includes(pct)) { taxPct = pct === 31.5 ? 0.315 : 0.205; taxType = "ILA"; }
      else if (pct === 10 || pct === 18) { taxPct = pct / 100; taxType = "IABA"; }
    }

    productos.push({
      nombre: nombre.substring(0, 80),
      cantidad: Math.round(qtyDecimal * 1000) / 1000 || 1,
      netoTotal: Math.round(totalVal),
      ilaTipo: taxPct,
      taxType,
      margen: 30
    });
  }
  return productos;
}

function parsearNumeroCL(str) {
  if (!str) return 0;
  let s = String(str).trim();
  s = s.includes(",") ? s.replace(/\./g, "").replace(",", ".") : s.replace(/\./g, "");
  const n = parseFloat(s);
  return isNaN(n) ? 0 : n;
}

function generarXMLdesdePDF(datos) {
  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<DTE xmlns="http://www.sii.cl/SiiDte">\n  <Documento>\n    <Encabezado>\n      <IdDoc>\n        <TipoDTE>33</TipoDTE>\n        <Folio>${escXML(datos.numeroFactura || "0")}</Folio>\n        <FchEmis>${escXML(datos.fechaFactura || "2000-01-01")}</FchEmis>\n      </IdDoc>\n      <Emisor>\n        <RznSoc>${escXML(datos.nombreEmpresa || "Empresa")}</RznSoc>\n      </Emisor>\n    </Encabezado>\n`;
  datos.productos.forEach(p => {
    xml += `    <Detalle>\n      <NmbItem>${escXML(p.nombre)}</NmbItem>\n      <QtyItem>${p.cantidad}</QtyItem>\n      <MontoItem>${p.netoTotal}</MontoItem>\n`;
    if (p.ilaTipo === 0.205) {
      xml += `      <ImptoRet><CodImp>15</CodImp><TasaImp>20.5</TasaImp></ImptoRet>\n`;
    } else if (p.ilaTipo === 0.315) {
      xml += `      <ImptoRet><CodImp>17</CodImp><TasaImp>31.5</TasaImp></ImptoRet>\n`;
    } else if (p.taxType === "IABA") {
      const tasa = Math.round(p.ilaTipo * 100);
      xml += `      <ImptoRet><TasaImp>${tasa}</TasaImp></ImptoRet>\n`;
    }
    xml += `    </Detalle>\n`;
  });
  xml += `  </Documento>\n</DTE>`;
  return xml;
}

function escXML(str) {
  return String(str).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

const PESO_PATTERNS = [/kilo/i, /kg\b/i, /granel/i, /\bgrs?\b/i, /gramos/i, /deshuesad/i, /entero/i, /pechuga/i, /trutro/i, /lomo/i, /posta/i, /asado/i, /sobrecostilla/i, /\d+grs?\b/i, /chorizo/i, /mani/i];

function analizarProductosPesados() {
  const tbody = document.getElementById("cuerpoTabla");
  const mainRows = tbody.querySelectorAll('tr[id^="fila-main-"]');
  const numFactura = document.getElementById("numeroFactura").value || "S/N";
  const fecha = document.getElementById("fechaFactura").value || "";
  const fechaFormateada = fecha ? fecha.split("-").reverse().join("/") : "";

  const pesados = [], unitarios = [];
  let total = 0;

  mainRows.forEach(row => {
    const nombre = row.querySelector('input[placeholder="Nombre..."]')?.value || "";
    const cant = parseFloat(row.querySelector(".cantidad")?.value) || 0;
    const neto = parseFloat(row.querySelector(".neto-total")?.value) || 0;
    const codigo = "";
    total++;

    const tieneDecimales = cant !== Math.floor(cant);
    const keywordMatch = PESO_PATTERNS.some(p => p.test(nombre));
    const esPesado = tieneDecimales || keywordMatch;

    const item = { codigo, descripcion: nombre, cantidad: cant, valor_total: neto };

    if (esPesado) {
      const motivos = [];
      if (tieneDecimales) motivos.push("Cantidad con decimales (" + cant + ")");
      if (keywordMatch) {
        const kw = PESO_PATTERNS.find(p => p.test(nombre));
        motivos.push("Palabra clave '" + kw.source.replace(/\\/g, "").replace(/i$/, "").toUpperCase() + "'");
      }
      pesados.push({ ...item, unidad_medida: "KILO", motivo_clasificacion: motivos.join(" + ") });
    } else {
      unitarios.push({ ...item, unidad_medida: "UDS" });
    }
  });

  const resultado = {
    factura_numero: numFactura,
    fecha: fechaFormateada,
    productos_pesados: pesados,
    productos_unitarios: unitarios,
    resumen: { total_productos: total, productos_pesados_identificados: pesados.length, productos_unitarios_identificados: unitarios.length }
  };

  const msg = [
    "=== ANÁLISIS DE PRODUCTOS ===\n",
    "Factura N°: " + numFactura,
    "Fecha: " + fechaFormateada,
    "",
    "--- PRODUCTOS PESADOS (" + pesados.length + ") ---",
  ];
  if (pesados.length === 0) msg.push("  (ninguno)");
  pesados.forEach(p => msg.push("  • " + p.descripcion + " - " + p.cantidad + " " + p.unidad_medida + " ($" + p.valor_total + ")"));
  msg.push("", "--- PRODUCTOS UNITARIOS (" + unitarios.length + ") ---");
  unitarios.forEach(p => msg.push("  • " + p.descripcion + " - " + p.cantidad + " " + p.unidad_medida + " ($" + p.valor_total + ")"));
  msg.push("", "Resumen: " + pesados.length + " pesados, " + unitarios.length + " unitarios de " + total + " totales");

  console.log(msg.join("\n"));
  console.log("JSON:", JSON.stringify(resultado, null, 2));
  alert(msg.join("\n"));
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
  if (factura.metodoFlete) document.getElementById("metodoFlete").value = factura.metodoFlete;
  document.getElementById("ivaSinILA").checked = !!factura.ivaSinILA;

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

  // Restaurar PVP guardados y recalcular margen desde PVP
  const allRows = tbody.querySelectorAll('tr[id^="fila-main-"]');
  factura.productos.forEach((producto, i) => {
    if (producto.pvp && allRows[i]) {
      const id = allRows[i].id.split("-").pop();
      const pvpInput = document.getElementById(`det-venta-sugerida-${id}`);
      if (pvpInput) {
        pvpInput.value = producto.pvp;
        calcularDesdePVP(parseInt(id));
      }
    }
  });
}

// Cargar facturas al iniciar
window.onload = function () {
  if (esDispositivoMovil()) {
    document.body.classList.add('vista-movil');
    // Aquí puedes agregar más lógica específica para móviles si lo deseas
  }
  cargarProductos(); // Cargar productos para autocompletado
  agregarFila(); // Asegurar que haya al menos una fila inicial
  cargarFacturas(); // Cargar las facturas almacenadas en localStorage
};
