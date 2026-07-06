// <batch-ticket>: resumen visual de un lote de producción. Uso: ticket.data = { codigo, fecha, usuario, items }
class BatchTicket extends HTMLElement {
  connectedCallback() {
    this.attachShadow({ mode: 'open' });
    if (this._data) this.render();
  }

  set data(value) {
    this._data = value;
    if (this.shadowRoot) this.render();
  }

  render() {
    const { codigo, fecha, usuario, items } = this._data;
    const fechaFmt = new Date(fecha).toLocaleString('es-CO', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });

    const itemsHtml = items
      .map(
        (it) => `
        <div class="item">
          <div class="item-head">
            <span class="pname">${it.productoNombre}</span>
            <span class="pqty">+${it.cantidadFabricada.toLocaleString('es-CO')} ${it.unidad}</span>
          </div>
          <ul class="consumo">
            ${it.materiaUsada
              .map(
                (m) =>
                  `<li><span>${m.codigo}</span><span>-${m.cantidad.toLocaleString('es-CO')} ${m.unidad}</span></li>`
              )
              .join('')}
          </ul>
        </div>`
      )
      .join('');

    this.shadowRoot.innerHTML = `
      <style>
        :host { display:block; font-family: var(--font-body, sans-serif); }
        .ticket {
          background: var(--surface, #fff);
          border: 1px solid var(--line, #ddd);
          border-radius: 3px;
          position: relative;
          overflow: hidden;
        }
        .ticket::before {
          content: '';
          position: absolute;
          left: 0; top: 0; bottom: 0;
          width: 6px;
          background: repeating-linear-gradient(
            180deg, var(--brass, #b08d57) 0 10px, transparent 10px 20px
          );
        }
        .head {
          display:flex; justify-content: space-between; align-items:flex-start;
          padding: 1rem 1.2rem 0.9rem 1.5rem;
          border-bottom: 1px dashed var(--line, #ddd);
        }
        .code-block .eyebrow {
          font-family: var(--font-mono, monospace);
          font-size: 0.68rem;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: var(--ink-soft, #6b6a63);
        }
        .code-block .code {
          font-family: var(--font-mono, monospace);
          font-size: 1.5rem;
          font-weight: 700;
          color: var(--ink, #1f2421);
          letter-spacing: 0.02em;
        }
        .meta { text-align: right; font-size: 0.78rem; color: var(--ink-soft, #6b6a63); }
        .meta strong { display:block; color: var(--ink, #1f2421); font-weight: 600; }
        .items { padding: 0.9rem 1.2rem 1.1rem 1.5rem; display:flex; flex-direction:column; gap: 0.9rem; }
        .item-head { display:flex; justify-content: space-between; font-weight: 600; color: var(--ink,#1f2421); font-size: 0.92rem; }
        .pqty { color: var(--moss, #4b6350); font-family: var(--font-mono, monospace); }
        .consumo { list-style:none; margin: 0.4rem 0 0; padding: 0; display:flex; flex-direction:column; gap:0.2rem; }
        .consumo li { display:flex; justify-content:space-between; font-size: 0.8rem; color: var(--ink-soft, #6b6a63); font-family: var(--font-mono, monospace); }
        .consumo li span:last-child { color: var(--rust, #b54834); }
      </style>
      <div class="ticket">
        <div class="head">
          <div class="code-block">
            <div class="eyebrow">Lote de producción</div>
            <div class="code">#${String(codigo).padStart(4, '0')}</div>
          </div>
          <div class="meta">
            <strong>${usuario ? usuario.nombre : 'Sistema'}</strong>
            ${fechaFmt}
          </div>
        </div>
        <div class="items">${itemsHtml}</div>
      </div>
    `;
  }
}

customElements.define('batch-ticket', BatchTicket);
