// <stock-badge stock="120" umbral="20" unidad="g">: color según nivel de stock
class StockBadge extends HTMLElement {
  static get observedAttributes() {
    return ['stock', 'umbral', 'unidad'];
  }

  connectedCallback() {
    this.attachShadow({ mode: 'open' });
    this.render();
  }

  attributeChangedCallback() {
    if (this.shadowRoot) this.render();
  }

  render() {
    const rawStock = parseFloat(this.getAttribute('stock'));
    const stock = Number.isFinite(rawStock) ? rawStock : 0;
    const umbral = parseFloat(this.getAttribute('umbral') || '10');
    const unidad = this.getAttribute('unidad') || '';
    let level = 'ok';
    if (stock <= 0) level = 'empty';
    else if (stock <= umbral) level = 'low';
  
    const colors = {
      ok: 'var(--moss, #4b6350)',
      low: 'var(--brass, #b08d57)',
      empty: 'var(--rust, #b54834)',
    };
    const text = {
      ok: 'Disponible',
      low: 'Stock bajo',
      empty: 'Agotado',
    };
  
    this.shadowRoot.innerHTML = `
      <style>
        :host { display: inline-flex; align-items:center; gap: 0.4rem; font-family: var(--font-mono, monospace); }
        .dot { width: 8px; height: 8px; border-radius: 50%; background: ${colors[level]}; flex-shrink:0; }
        .num { font-weight: 600; color: var(--ink, #1f2421); }
        .label { font-size: 0.72rem; color: ${colors[level]}; text-transform: uppercase; letter-spacing: 0.04em; }
      </style>
      <span class="dot" title="${text[level]}"></span>
      <span class="num">${stock.toLocaleString('es-CO')}${unidad ? ' ' + unidad : ''}</span>
      <span class="label">${text[level]}</span>
    `;
  }
}

customElements.define('stock-badge', StockBadge);
