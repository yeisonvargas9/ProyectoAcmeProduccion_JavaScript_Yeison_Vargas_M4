// <reports-view>: reporte de materia prima consumida por año/mes.
const MESES = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
  ];
  
  class ReportsView extends HTMLElement {
    connectedCallback() {
      const hoy = new Date();
      this._anio = hoy.getFullYear();
      this._mes = hoy.getMonth() + 1;
      this.render(null);
      this.generarReporte();
    }
  
    toast(msg, kind) {
      document.querySelector('ui-toast')?.show(msg, kind);
    }
  
    render(resultado) {
      const anioActual = new Date().getFullYear();
      const anios = [anioActual, anioActual - 1, anioActual - 2, anioActual -3,anioActual -4,anioActual -5,anioActual -6,anioActual -7,anioActual -8,
            anioActual -9,anioActual -10,anioActual -11,anioActual -12,anioActual -13,anioActual -14,anioActual -15,anioActual -15,anioActual -16,
            anioActual -17, anioActual -18, anioActual -19, anioActual -20, anioActual -21, anioActual -22, anioActual -23, anioActual -24, anioActual -25, anioActual -26];
  
      this.innerHTML = `
        <div class="view-head">
          <div>
            <div class="eyebrow">Reportes</div>
            <h1>Materia prima consumida por mes</h1>
            <p class="lead">Elige un año y un mes para ver cuánta materia prima se consumió en los procesos de producción de ese período.</p>
          </div>
        </div>
  
        <div class="panel">
          <form id="report-form" class="field-row" style="align-items:flex-end;flex-wrap:wrap;">
            <label class="field" style="max-width:160px;">
              <span>Año</span>
              <select name="anio">
                ${anios.map((a) => `<option value="${a}" ${a === this._anio ? 'selected' : ''}>${a}</option>`).join('')}
              </select>
            </label>
            <label class="field" style="max-width:220px;">
              <span>Mes</span>
              <select name="mes">
                ${MESES.map((m, i) => `<option value="${i + 1}" ${i + 1 === this._mes ? 'selected' : ''}>${m}</option>`).join('')}
              </select>
            </label>
            <button type="submit" class="btn btn-primary">Generar reporte</button>
          </form>
        </div>
  
        <div id="report-results" class="panel" style="margin-top:1.2rem;">
          ${this.renderResultsHtml(resultado)}
        </div>
      `;
  
      this.querySelector('#report-form').addEventListener('submit', (e) => {
        e.preventDefault();
        const data = new FormData(e.target);
        this._anio = parseInt(data.get('anio'), 10);
        this._mes = parseInt(data.get('mes'), 10);
        this.generarReporte();
      });
    }
  
    renderResultsHtml(resultado) {
      if (resultado === null) {
        return `<div class="empty-state"><strong>Cargando reporte…</strong></div>`;
      }
      if (resultado.length === 0) {
        return `<div class="empty-state"><strong>No hay consumo de materia prima registrado para ese período.</strong><span>Prueba con otro mes o año.</span></div>`;
      }
      return `
        <table class="data-table">
          <thead>
            <tr><th>Código</th><th>Nombre</th><th>Cantidad consumida</th></tr>
          </thead>
          <tbody>
            ${resultado
              .map(
                (r) => `
              <tr>
                <td class="mono">${r.codigo}</td>
                <td>${r.nombre}</td>
                <td class="mono">${r.cantidad.toLocaleString('es-CO')} ${r.unidad}</td>
              </tr>`
              )
              .join('')}
          </tbody>
        </table>
      `;
    }
  
    async generarReporte() {
      const resultsBox = this.querySelector('#report-results');
      if (resultsBox) resultsBox.innerHTML = this.renderResultsHtml(null);
      try {
        const resultado = await window.AcmeStore.ProductionAPI.reporteMateriaPrima(this._anio, this._mes);
        const box = this.querySelector('#report-results');
        if (box) box.innerHTML = this.renderResultsHtml(resultado);
      } catch (err) {
        const box = this.querySelector('#report-results');
        if (box) box.innerHTML = `<div class="empty-state"><strong>No se pudo generar el reporte.</strong><span>${err.message}</span></div>`;
        this.toast(err.message, 'error');
      }
    }
  }
  
  customElements.define('reports-view', ReportsView);