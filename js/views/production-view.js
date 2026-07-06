// <production-view>: fabricar productos según su fórmula e historial de lotes.
class ProductionView extends HTMLElement {
  connectedCallback() {
    this.renderLoading();
    this.loadAndRender();
  }

  toast(msg, kind) {
    document.querySelector('ui-toast')?.show(msg, kind);
  }

  renderLoading() {
    this.innerHTML = `
      <div class="view-head">
        <div>
          <div class="eyebrow">Módulo de producción</div>
          <h1>Correr proceso de producción</h1>
        </div>
      </div>
      <div class="panel"><div class="empty-state"><strong>Cargando datos de producción…</strong><span>Conectando con Firebase.</span></div></div>
    `;
  }

  async loadAndRender() {
    try {
      const [finished, history] = await Promise.all([
        window.AcmeStore.ProductsAPI.finished(),
        window.AcmeStore.ProductionAPI.list(),
      ]);
      this.render(finished, history);
    } catch (err) {
      this.innerHTML = `<div class="panel"><div class="empty-state"><strong>No se pudo cargar la información.</strong><span>${err.message}</span></div></div>`;
      this.toast(err.message, 'error');
    }
  }

  render(finished, history) {
    this.innerHTML = `
      <div class="view-head">
        <div>
          <div class="eyebrow">Módulo de producción</div>
          <h1>Correr proceso de producción</h1>
          <p class="lead">Selecciona el o los productos a fabricar y la cantidad. El sistema descuenta la materia prima según la fórmula y aumenta el producto terminado.</p>
        </div>
      </div>

      <div class="panel">
        ${
          finished.length === 0
            ? `<div class="empty-state"><strong>No hay productos con fórmula definida.</strong><span>Ve al módulo de inventario y crea un producto de tipo "a producir".</span></div>`
            : `
            <form id="production-form" class="stack">
              <div id="production-rows" class="stack" style="gap:0.7rem;"></div>
              <button type="button" class="link-btn" id="add-row">+ Agregar otro producto</button>
              <p class="field-error" role="alert" aria-live="polite"></p>
              <div>
                <button type="submit" class="btn btn-primary">Fabricar</button>
              </div>
            </form>`
        }
      </div>

      <div class="view-head" style="margin-top:2.2rem;">
        <div>
          <div class="eyebrow">Historial</div>
          <h1 style="font-size:1.3rem;">Lotes de producción</h1>
        </div>
      </div>
      <div id="history-list" class="stack" style="gap:1rem;">
        ${history.length === 0 ? `<div class="panel"><div class="empty-state"><strong>Todavía no se ha corrido ningún lote.</strong><span>Los resúmenes de producción aparecerán aquí.</span></div></div>` : ''}
      </div>
    `;

    if (finished.length > 0) {
      const rowsContainer = this.querySelector('#production-rows');
      rowsContainer.appendChild(this.buildRow(finished));

      this.querySelector('#add-row').addEventListener('click', () => {
        rowsContainer.appendChild(this.buildRow(finished));
      });

      this.querySelector('#production-form').addEventListener('submit', (e) => this.submitProduction(e));
    }

    const historyList = this.querySelector('#history-list');
    history.forEach((registro) => {
      const ticket = document.createElement('batch-ticket');
      ticket.data = registro;
      historyList.appendChild(ticket);
    });
  }

  buildRow(finished) {
    const row = document.createElement('div');
    row.className = 'production-row';
    row.innerHTML = `
      <select class="prod-select">
        ${finished.map((p) => `<option value="${p.codigo}">${p.nombre} (${p.codigo})</option>`).join('')}
      </select>
      <input type="number" class="prod-cantidad" min="0.001" step="any" placeholder="Cantidad a fabricar" required />
      <span class="prod-unidad mono muted"></span>
      <button type="button" class="icon-btn danger remove-row" aria-label="Quitar producto">✕</button>
    `;
    const updateUnidad = () => {
      const p = finished.find((f) => f.codigo === row.querySelector('.prod-select').value);
      row.querySelector('.prod-unidad').textContent = p ? p.unidad : '';
    };
    row.querySelector('.prod-select').addEventListener('change', updateUnidad);
    row.querySelector('.remove-row').addEventListener('click', () => {
      if (row.parentElement.children.length > 1) row.remove();
    });
    updateUnidad();
    return row;
  }

  async submitProduction(e) {
    e.preventDefault();
    const form = e.target;
    const errorEl = form.querySelector('.field-error');
    errorEl.textContent = '';

    const rows = form.querySelectorAll('.production-row');
    const items = Array.from(rows).map((row) => ({
      productoCodigo: row.querySelector('.prod-select').value,
      cantidad: parseFloat(row.querySelector('.prod-cantidad').value),
    }));

    const submitBtn = form.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Fabricando…';

    try {
      const session = window.AcmeStore.SessionAPI.get();
      const registro = await window.AcmeStore.ProductionAPI.run(items, session);
      this.toast(`Lote #${String(registro.codigo).padStart(4, '0')} registrado correctamente.`, 'success');
      this.loadAndRender();
    } catch (err) {
      errorEl.textContent = err.message;
      this.toast(err.message, 'error');
      submitBtn.disabled = false;
      submitBtn.textContent = 'Fabricar';
    }
  }
}

customElements.define('production-view', ProductionView);
