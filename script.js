let rowCount = 0;

function agregarFila() {
    const tbody = document.getElementById('cuerpoTabla');
    const rowId = rowCount;

    const mainRow = document.createElement('tr');
    mainRow.id = `fila-main-${rowId}`;
    mainRow.className = "border-t border-gray-100 hover:bg-gray-50/50 transition-colors text-sm align-middle";

    mainRow.innerHTML = `
        <td class="p-2">
            <input type="text" placeholder="Nombre..." class="w-full p-2 border-gray-200 border rounded-md focus:ring-1 focus:ring-indigo-400 outline-none">
        </td>
        <td class="p-2 text-center">
            <input type="number" value="1" min="1" class="w-16 p-2 border-gray-200 border rounded-md cantidad text-center" oninput="calcularTodo()">
        </td>
        <td class="p-2">
            <input type="number" value="0" min="0" class="w-full p-2 border-gray-200 border rounded-md neto-total text-right" oninput="calcularTodo()">
        </td>
        <td class="p-2 bg-indigo-50/30">
            <input type="text" readonly class="w-full p-2 border-transparent bg-transparent font-bold text-indigo-700 neto-unitario-display text-right outline-none" value="$0">
        </td>
        <td class="p-2">
            <select class="w-full p-2 border-gray-200 border rounded-md ila-tipo text-xs" onchange="calcularTodo()">
                <option value="0">Sin ILA</option>
                <option value="0.205">Vino/Cer. (20,5%)</option>
                <option value="0.315">Destilado (31,5%)</option>
            </select>
        </td>
        <td class="p-2">
            <input type="number" value="30" min="0" max="99" class="w-full p-2 border-gray-200 border rounded-md margen-producto text-center font-semibold text-green-600" oninput="calcularTodo()">
        </td>
        <td class="p-2 text-center">
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

    const detailsRow = document.createElement('tr');
    detailsRow.id = `fila-details-${rowId}`;
    detailsRow.className = "bg-white";
    detailsRow.innerHTML = `
        <td colspan="7" class="p-0 border-b border-gray-100">
            <div id="container-details-${rowId}" class="details-panel expanded px-4 py-3">
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
                            <span class="text-gray-500">Costo Reposición (Neto+Log+ILA):</span>
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
                            <span class="text-base font-bold text-indigo-900" id="det-venta-sugerida-${rowId}">$0</span>
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
    if (container.classList.contains('expanded')) {
        container.classList.remove('expanded');
        container.classList.add('collapsed');
        btn.classList.add('rotate-180');
    } else {
        container.classList.remove('collapsed');
        container.classList.add('expanded');
        btn.classList.remove('rotate-180');
    }
}

function eliminarFila(id) {
    if (document.getElementById(`fila-main-${id}`)) document.getElementById(`fila-main-${id}`).remove();
    if (document.getElementById(`fila-details-${id}`)) document.getElementById(`fila-details-${id}`).remove();
    calcularTodo();
}

function formatoDinero(valor) {
    return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(Math.round(valor));
}

function calcularTodo() {
    const fleteTotal = parseFloat(document.getElementById('fleteTotal').value) || 0;
    const otrosCargos = parseFloat(document.getElementById('otrosCargos').value) || 0;
    const tbody = document.getElementById('cuerpoTabla');
    const mainRows = tbody.querySelectorAll('tr[id^="fila-main-"]');

    let totalUnidades = 0;
    mainRows.forEach(row => totalUnidades += parseFloat(row.querySelector('.cantidad').value) || 0);

    const logisticaUnitario = totalUnidades > 0 ? (fleteTotal + otrosCargos) / totalUnidades : 0;

    let sumaNetosFactura = 0;
    let sumaILAVino = 0;
    let sumaILADestilado = 0;

    mainRows.forEach(row => {
        const id = row.id.split('-').pop();
        const cant = parseFloat(row.querySelector('.cantidad').value) || 0;
        const netoTotalLinea = parseFloat(row.querySelector('.neto-total').value) || 0;
        const tasaILA = parseFloat(row.querySelector('.ila-tipo').value) || 0;
        const margenDeseado = (parseFloat(row.querySelector('.margen-producto').value) || 0) / 100;

        const netoUnitario = cant > 0 ? netoTotalLinea / cant : 0;
        row.querySelector('.neto-unitario-display').value = formatoDinero(netoUnitario);

        sumaNetosFactura += netoTotalLinea;

        const ilaLinea = netoTotalLinea * tasaILA;
        if (tasaILA === 0.205) sumaILAVino += ilaLinea;
        else if (tasaILA === 0.315) sumaILADestilado += ilaLinea;

        if (cant > 0) {
            const ilaCompraUnit = netoUnitario * tasaILA;
            // El costo de reposición real incluye el ILA pagado ya que no se recupera
            const costoReposicionUnit = netoUnitario + logisticaUnitario + ilaCompraUnit;

            const ivaCompraUnit = (netoUnitario + logisticaUnitario) * 0.19;
            const desembolsoTotalFacturaUnit = netoUnitario + logisticaUnitario + ilaCompraUnit + ivaCompraUnit;

            // Cálculo Venta: Basado en costo de reposición (que ya tiene el ILA)
            const factorMargen = margenDeseado >= 1 ? 0.01 : (1 - margenDeseado);
            const netoVentaSugerido = costoReposicionUnit / factorMargen;
            const ivaVentaUnit = netoVentaSugerido * 0.19;
            const pvpFinal = netoVentaSugerido + ivaVentaUnit;

            const diferenciaIVA = ivaVentaUnit - ivaCompraUnit;
            const gananciaNetaUnit = netoVentaSugerido - costoReposicionUnit;

            // Bloque 1
            document.getElementById(`det-neto-base-${id}`).innerText = formatoDinero(netoUnitario);
            document.getElementById(`det-flete-unit-${id}`).innerText = formatoDinero(logisticaUnitario);
            document.getElementById(`det-ila-pago-${id}`).innerText = formatoDinero(ilaCompraUnit);
            document.getElementById(`det-costo-iva-compra-${id}`).innerText = formatoDinero(ivaCompraUnit);
            document.getElementById(`det-costo-final-${id}`).innerText = formatoDinero(desembolsoTotalFacturaUnit);

            // Bloque 2
            document.getElementById(`det-iva-compra-${id}`).innerText = formatoDinero(ivaCompraUnit);
            document.getElementById(`det-iva-venta-${id}`).innerText = formatoDinero(ivaVentaUnit);
            document.getElementById(`det-dif-iva-${id}`).innerText = formatoDinero(diferenciaIVA);

            // Bloque 3
            document.getElementById(`det-costo-reposicion-${id}`).innerText = formatoDinero(costoReposicionUnit);
            document.getElementById(`det-neto-venta-${id}`).innerText = formatoDinero(netoVentaSugerido);
            document.getElementById(`det-iva-venta-val-${id}`).innerText = formatoDinero(ivaVentaUnit);
            document.getElementById(`det-venta-sugerida-${id}`).innerText = formatoDinero(pvpFinal);
            document.getElementById(`det-ganancia-${id}`).innerText = formatoDinero(gananciaNetaUnit);
        }
    });

    const subtotalNetoFactura = sumaNetosFactura + fleteTotal + otrosCargos;
    const totalILA = sumaILAVino + sumaILADestilado;
    const totalIVAFactura = subtotalNetoFactura * 0.19;
    const granTotalFactura = subtotalNetoFactura + totalILA + totalIVAFactura;

    document.getElementById('resNeto').innerText = formatoDinero(subtotalNetoFactura);
    document.getElementById('resILAVino').innerText = formatoDinero(sumaILAVino);
    document.getElementById('resILADestilado').innerText = formatoDinero(sumaILADestilado);
    document.getElementById('resILA').innerText = formatoDinero(totalILA);
    document.getElementById('resIVA').innerText = formatoDinero(totalIVAFactura);
    document.getElementById('resTotal').innerText = formatoDinero(granTotalFactura);
}

function limpiar() {
    if (confirm("¿Limpiar todos los datos?")) {
        document.getElementById('fleteTotal').value = 0;
        document.getElementById('otrosCargos').value = 0;
        document.getElementById('cuerpoTabla').innerHTML = "";
        agregarFila();
    }
}

window.onload = agregarFila;
