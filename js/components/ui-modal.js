// <ui-modal>: modal genérico. Uso: modal.setContent(titulo, nodo); modal.open();
class UiModal extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          position: fixed;
          inset: 0;
          display: none;
          z-index: 200;
          font-family: var(--font-body, sans-serif);
        }
        :host([open]) { display: block; }
        .backdrop {
          position: absolute;
          inset: 0;
          background: rgba(24, 26, 22, 0.55);
          backdrop-filter: blur(2px);
          animation: fade 0.15s ease-out;
        }
        .panel {
          position: relative;
          max-width: 560px;
          width: calc(100% - 2.5rem);
          margin: 6vh auto 0;
          background: var(--surface, #fff);
          border: 1px solid var(--line, #ddd);
          border-radius: 4px;
          box-shadow: 0 24px 48px rgba(24,26,22,0.28);
          max-height: 86vh;
          display: flex;
          flex-direction: column;
          animation: rise 0.18s ease-out;
        }
        header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 1.1rem 1.4rem;
          border-bottom: 1px solid var(--line, #ddd);
        }
        h2 {
          margin: 0;
          font-family: var(--font-display, sans-serif);
          font-size: 1.05rem;
          letter-spacing: 0.01em;
          color: var(--ink, #1f2421);
        }
        button.close {
          border: none;
          background: transparent;
          font-size: 1.3rem;
          line-height: 1;
          cursor: pointer;
          color: var(--ink-soft, #6b6a63);
          padding: 0.2rem 0.4rem;
          border-radius: 3px;
        }
        button.close:hover { background: var(--bg, #f2f0ea); }
        button.close:focus-visible, .backdrop:focus-visible { outline: 2px solid var(--brass, #b08d57); }
        .body { padding: 1.4rem; overflow-y: auto; }
        @keyframes fade { from { opacity: 0 } to { opacity: 1 } }
        @keyframes rise { from { opacity: 0; transform: translateY(8px);} to { opacity: 1; transform: translateY(0);} }
        @media (prefers-reduced-motion: reduce) {
          .backdrop, .panel { animation: none; }
        }
      </style>
      <div class="backdrop" part="backdrop"></div>
      <div class="panel" role="dialog" aria-modal="true">
        <header>
          <h2 id="modal-title"></h2>
          <button class="close" aria-label="Cerrar">&times;</button>
        </header>
        <div class="body"></div>
      </div>
    `;
    this.shadowRoot.querySelector('.backdrop').addEventListener('click', () => this.close());
    this.shadowRoot.querySelector('.close').addEventListener('click', () => this.close());
    this._escHandler = (e) => {
      if (e.key === 'Escape' && this.hasAttribute('open')) this.close();
    };
  }

  setContent(title, bodyNode) {
    this.shadowRoot.querySelector('h2').textContent = title;
    const body = this.shadowRoot.querySelector('.body');
    body.innerHTML = '';
    body.appendChild(bodyNode);
  }

  open() {
    this.setAttribute('open', '');
    document.addEventListener('keydown', this._escHandler);
  }

  close() {
    this.removeAttribute('open');
    document.removeEventListener('keydown', this._escHandler);
    this.dispatchEvent(new CustomEvent('modal-close'));
  }
}

customElements.define('ui-modal', UiModal);
