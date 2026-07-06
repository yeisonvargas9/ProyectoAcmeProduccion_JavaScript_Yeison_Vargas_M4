// <inventory-view>: catálogo de productos, buscador e ingreso de stock.
class InventoryView extends HTMLElement {
  connectedCallback() {
    this._filter = '';
    this._products = [];
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
          <div class="eyebrow">Módulo de inventario</div>
          <h1>Inventario de planta</h1>
        </div>
      </div>
      <div class="panel"><div class="empty-state"><strong>Cargando inventario…</strong><span>Conectando con Firebase.</span></div></div>
    `;
  }

  async loadAndRender(keepFocus) {
    try {
      this._products = await window.AcmeStore.ProductsAPI.list();
      this.render(keepFocus);
    } catch (err) {
      this.innerHTML = `<div class="panel"><div class="empty-state"><strong>No se pudo cargar el inventario.</strong><span>${err.message}</span></div></div>`;
      this.toast(err.message, 'error');
    }
  }

  get filteredProducts() {
    const f = this._filter.trim().toLowerCase();
    if (!f) return this._products;
    return this._products.filter(
      (p) =>
        p.codigo.toLowerCase().includes(f) ||
        p.nombre.toLowerCase().includes(f) ||
        p.proveedor.toLowerCase().includes(f)
    );
  }

  render(keepFocus) {
    const products = this.filteredProducts;

    this.innerHTML = `
      <div class="view-head">
        <div>
          <div class="eyebrow">Módulo de inventario</div>
          <h1>Inventario de planta</h1>
          <p class="lead">Consulta el saldo disponible de materia prima y productos terminados, crea nuevos ítems y registra entradas.</p>
        </div>
        <button class="btn btn-primary" id="btn-new-product">+ Nuevo producto</button>
      </div>

      <div class="panel">
        <div class="toolbar">
          <label class="search-field">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>
            <input type="search" id="search-input" placeholder="Buscar por código, nombre o proveedor…" value="${this._filter}" />
          </label>
        </div>

        ${
          products.length === 0
            ? `<div class="empty-state"><strong>No se encontraron productos.</strong><span>Ajusta la búsqueda o crea un nuevo producto.</span></div>`
            : `<table class="data-table">
                <thead>
                  <tr><th>Código</th><th>Nombre</th><th>Proveedor</th><th>Tipo</th><th>Saldo</th><th></th></tr>
                </thead>
                <tbody>
                  ${products
                    .map(
                      (p) => `
                    <tr data-codigo="${p.codigo}">
                      <td class="mono">${p.codigo}</td>
                      <td>
                        ${p.nombre}
                        ${
                          p.tipo === 'terminado'
                            ? `<button class="link-btn view-formula" data-codigo="${p.codigo}">Ver fórmula</button>`
                            : ''
                        }
                      </td>
                      <td>${p.proveedor}</td>
                      <td><span class="tag ${p.tipo === 'terminado' ? 'tag-brass' : 'tag-moss'}">${p.tipo === 'terminado' ? 'Terminado' : 'Materia prima'}</span></td>
                      <td><stock-badge stock="${p.stock}" unidad="${p.unidad}" umbral="20"></stock-badge></td>
                      <td class="row-actions">
                        <button class="btn btn-small btn-outline increase-stock" data-codigo="${p.codigo}">Ingresar stock</button>
                        <button class="icon-btn danger delete" data-codigo="${p.codigo}" title="Eliminar" aria-label="Eliminar ${p.nombre}">✕</button>
                      </td>
                    </tr>`
                    )
                    .join('')}
                </tbody>
              </table>`
        }
      </div>
    `;

    const searchInput = this.querySelector('#search-input');
    searchInput.addEventListener('input', (e) => {
      this._filter = e.target.value;
      this.render(true);
    });
    if (keepFocus) {
      searchInput.focus();
      searchInput.setSelectionRange(searchInput.value.length, searchInput.value.length);
    }

    this.querySelector('#btn-new-product').addEventListener('click', () => this.openProductForm());

    this.querySelectorAll('.increase-stock').forEach((btn) =>
      btn.addEventListener('click', (e) => this.openIncreaseStock(e.target.dataset.codigo))
    );
    this.querySelectorAll('.view-formula').forEach((btn) =>
      btn.addEventListener('click', (e) => this.openFormulaView(e.target.dataset.codigo))
    );
    this.querySelectorAll('.delete').forEach((btn) =>
      btn.addEventListener('click', (e) => this.confirmDeleteProduct(e.target.dataset.codigo))
    );
  }

  confirmDeleteProduct(codigo) {
    const producto = this._products.find((p) => p.codigo === codigo);
    const modal = document.createElement('ui-modal');
    document.body.appendChild(modal);
    const body = document.createElement('div');
    body.className = 'stack';
    body.innerHTML = `
      <p>¿Eliminar <strong>${producto.nombre}</strong> (${producto.codigo}) del inventario? Esta acción no se puede deshacer.</p>
      <div class="modal-actions">
        <button class="btn btn-ghost" id="cancel">Cancelar</button>
        <button class="btn btn-danger" id="confirm">Eliminar</button>
      </div>
    `;
    modal.setContent('Eliminar producto', body);
    modal.open();
    body.querySelector('#cancel').addEventListener('click', () => modal.close());
    body.querySelector('#confirm').addEventListener('click', async () => {
      const confirmBtn = body.querySelector('#confirm');
      confirmBtn.disabled = true;
      confirmBtn.textContent = 'Eliminando…';
      try {
        await window.AcmeStore.ProductsAPI.remove(codigo);
        modal.close();
        this.toast(`Producto ${codigo} eliminado.`, 'success');
        this.loadAndRender();
      } catch (err) {
        this.toast(err.message, 'error');
        confirmBtn.disabled = false;
        confirmBtn.textContent = 'Eliminar';
      }
    });
    modal.addEventListener('modal-close', () => modal.remove());
  }

  openFormulaView(codigo) {
    const producto = this._products.find((p) => p.codigo === codigo);
    const modal = document.createElement('ui-modal');
    document.body.appendChild(modal);
    const body = document.createElement('div');
    body.innerHTML = `
      <p class="lead" style="margin-top:0">Fórmula para fabricar <strong>1 ${producto.unidad}</strong> de ${producto.nombre}:</p>
      <ul class="formula-list">
        ${producto.formula
          .map((ing) => {
            const mp = this._products.find((p) => p.codigo === ing.codigo);
            return `<li><span>${mp ? mp.nombre : ing.codigo} <span class="muted mono">(${ing.codigo})</span></span><span class="mono">${ing.cantidad} ${ing.unidad}</span></li>`;
          })
          .join('')}
      </ul>
    `;
    modal.setContent(`Fórmula · ${producto.codigo}`, body);
    modal.open();
    modal.addEventListener('modal-close', () => modal.remove());
  }

  openIncreaseStock(codigo) {
    const producto = this._products.find((p) => p.codigo === codigo);
    const modal = document.createElement('ui-modal');
    document.body.appendChild(modal);
    const body = document.createElement('div');
    body.innerHTML = `
      <form class="stack" novalidate>
        <p class="lead" style="margin-top:0">Vas a ingresar existencias de <strong>${producto.nombre}</strong> (${producto.codigo}). Saldo actual: <strong>${producto.stock} ${producto.unidad}</strong>.</p>
        <label class="field">
          <span>Cantidad a ingresar (${producto.unidad})</span>
          <input type="number" name="cantidad" min="0.01" step="any" required placeholder="0" />
        </label>
        <p class="field-error" role="alert" aria-live="polite"></p>
        <div class="modal-actions">
          <button type="button" class="btn btn-ghost" id="cancel">Cancelar</button>
          <button type="submit" class="btn btn-primary">Ingresar al inventario</button>
        </div>
      </form>
    `;
    modal.setContent('Ingresar stock', body);
    modal.open();
    body.querySelector('#cancel').addEventListener('click', () => modal.close());
    modal.addEventListener('modal-close', () => modal.remove());

    const form = body.querySelector('form');
    const errorEl = body.querySelector('.field-error');
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const cantidad = parseFloat(new FormData(form).get('cantidad'));
      const submitBtn = form.querySelector('button[type="submit"]');
      submitBtn.disabled = true;
      submitBtn.textContent = 'Guardando…';
      try {
        await window.AcmeStore.ProductsAPI.increaseStock(codigo, cantidad);
        modal.close();
        this.toast(`Se agregaron ${cantidad} ${producto.unidad} a ${producto.nombre}.`, 'success');
        this.loadAndRender();
      } catch (err) {
        errorEl.textContent = err.message;
        submitBtn.disabled = false;
        submitBtn.textContent = 'Ingresar al inventario';
      }
    });
  }

  openProductForm() {
    const modal = document.createElement('ui-modal');
    document.body.appendChild(modal);
    const body = document.createElement('div');
    const rawMaterials = this._products.filter((p) => p.tipo === 'materia_prima');

    body.innerHTML = `
      <form class="stack" novalidate>
        <label class="field">
          <span>Código</span>
          <input type="text" name="codigo" required placeholder="Ej. MP-005 o PT-002" />
        </label>
        <label class="field">
          <span>Nombre</span>
          <input type="text" name="nombre" required placeholder="Nombre del producto" />
        </label>
        <label class="field">
          <span>Proveedor</span>
          <input type="text" name="proveedor" required placeholder="Nombre del proveedor" />
        </label>
        <div class="field-row">
          <label class="field">
            <span>Unidad de medida</span>
            <select name="unidad" required>
              <option value="g">Gramos (g)</option>
              <option value="kg">Kilogramos (kg)</option>
              <option value="ml">Mililitros (ml)</option>
              <option value="l">Litros (l)</option>
              <option value="un">Unidades (un)</option>
            </select>
          </label>
          <label class="field">
            <span>Tipo de producto</span>
            <select name="tipo" id="tipo-select" required>
              <option value="materia_prima">Materia prima</option>
              <option value="terminado">Producto a producir (con fórmula)</option>
            </select>
          </label>
        </div>

        <div id="formula-section" hidden>
          <div class="field-header">
            <span>Fórmula de producción</span>
            <button type="button" class="link-btn" id="add-ingredient">+ Agregar ingrediente</button>
          </div>
          <p class="muted" style="margin:0 0 0.6rem;font-size:0.82rem;">Indica cuánta materia prima se necesita para producir <strong>1 unidad</strong> de este producto.</p>
          <div id="ingredient-rows" class="stack" style="gap:0.6rem;"></div>
        </div>

        <p class="field-error" role="alert" aria-live="polite"></p>
        <div class="modal-actions">
          <button type="button" class="btn btn-ghost" id="cancel">Cancelar</button>
          <button type="submit" class="btn btn-primary">Crear producto</button>
        </div>
      </form>
    `;
    modal.setContent('Nuevo producto', body);
    modal.open();

    body.querySelector('#cancel').addEventListener('click', () => modal.close());
    modal.addEventListener('modal-close', () => modal.remove());

    const formulaSection = body.querySelector('#formula-section');
    const ingredientRows = body.querySelector('#ingredient-rows');
    const tipoSelect = body.querySelector('#tipo-select');

    const ingredientRowTemplate = () => {
      if (rawMaterials.length === 0) {
        return `<p class="muted">No hay materia prima registrada todavía. Crea materia prima primero para poder definir fórmulas.</p>`;
      }
      const row = document.createElement('div');
      row.className = 'ingredient-row';
      row.innerHTML = `
        <select class="ing-codigo">
          ${rawMaterials.map((m) => `<option value="${m.codigo}">${m.nombre} (${m.codigo})</option>`).join('')}
        </select>
        <input type="number" class="ing-cantidad" min="0.001" step="any" placeholder="Cantidad" required />
        <span class="ing-unidad mono muted"></span>
        <button type="button" class="icon-btn danger remove-ingredient" aria-label="Quitar ingrediente">✕</button>
      `;
      const updateUnidad = () => {
        const mp = rawMaterials.find((m) => m.codigo === row.querySelector('.ing-codigo').value);
        row.querySelector('.ing-unidad').textContent = mp ? mp.unidad : '';
      };
      row.querySelector('.ing-codigo').addEventListener('change', updateUnidad);
      row.querySelector('.remove-ingredient').addEventListener('click', () => row.remove());
      updateUnidad();
      return row;
    };

    body.querySelector('#add-ingredient').addEventListener('click', () => {
      const row = ingredientRowTemplate();
      if (typeof row === 'string') {
        ingredientRows.innerHTML = row;
      } else {
        ingredientRows.appendChild(row);
      }
    });

    tipoSelect.addEventListener('change', () => {
      const isTerminado = tipoSelect.value === 'terminado';
      formulaSection.hidden = !isTerminado;
      if (isTerminado && ingredientRows.children.length === 0) {
        body.querySelector('#add-ingredient').click();
      }
    });

    const form = body.querySelector('form');
    const errorEl = body.querySelector('.field-error');

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      errorEl.textContent = '';
      const data = new FormData(form);
      const codigo = data.get('codigo').trim();
      const nombre = data.get('nombre').trim();
      const proveedor = data.get('proveedor').trim();
      const unidad = data.get('unidad');
      const tipo = data.get('tipo');

      let formula = [];
      if (tipo === 'terminado') {
        const rows = ingredientRows.querySelectorAll('.ingredient-row');
        if (rows.length === 0) {
          errorEl.textContent = 'Agrega al menos un ingrediente a la fórmula.';
          return;
        }
        formula = Array.from(rows).map((row) => {
          const ingCodigo = row.querySelector('.ing-codigo').value;
          const cantidad = parseFloat(row.querySelector('.ing-cantidad').value);
          const mp = rawMaterials.find((m) => m.codigo === ingCodigo);
          return { codigo: ingCodigo, cantidad, unidad: mp ? mp.unidad : '' };
        });
        if (formula.some((f) => !f.cantidad || f.cantidad <= 0)) {
          errorEl.textContent = 'Todas las cantidades de la fórmula deben ser mayores que cero.';
          return;
        }
      }

      const submitBtn = form.querySelector('button[type="submit"]');
      submitBtn.disabled = true;
      submitBtn.textContent = 'Guardando…';

      try {
        await window.AcmeStore.ProductsAPI.create({ codigo, nombre, proveedor, tipo, unidad, formula });
        modal.close();
        this.toast(`Producto ${codigo} creado correctamente.`, 'success');
        this.loadAndRender();
      } catch (err) {
        errorEl.textContent = err.message;
        submitBtn.disabled = false;
        submitBtn.textContent = 'Crear producto';
      }
    });
  }
}

customElements.define('inventory-view', InventoryView);
