// <ui-toast>: notificaciones. Uso: toast.show(mensaje, 'success' | 'error' | 'info')
class UiToast extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          position: fixed;
          top: 1.25rem;
          right: 1.25rem;
          z-index: 300;
          display: flex;
          flex-direction: column;
          gap: 0.6rem;
          font-family: var(--font-body, sans-serif);
          pointer-events: none;
        }
        .toast {
          min-width: 260px;
          max-width: 360px;
          padding: 0.85rem 1rem;
          border-radius: 3px;
          background: var(--ink, #1f2421);
          color: #f7f5f1;
          box-shadow: 0 12px 28px rgba(0,0,0,0.25);
          font-size: 0.88rem;
          line-height: 1.4;
          border-left: 4px solid var(--brass, #b08d57);
          animation: in 0.2s ease-out;
          pointer-events: auto;
        }
        .toast.success { border-left-color: var(--moss, #4b6350); }
        .toast.error { border-left-color: var(--rust, #b54834); }
        .toast strong { display:block; font-family: var(--font-display, sans-serif); font-size:0.78rem; text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 0.15rem; opacity:0.85;}
        @keyframes in { from { opacity: 0; transform: translateX(12px);} to { opacity: 1; transform: translateX(0);} }
        @media (prefers-reduced-motion: reduce) { .toast { animation: none; } }
      </style>
    `;
  }

  show(message, kind = 'info', label) {
    const labels = { success: 'Listo', error: 'Atención', info: 'Aviso' };
    const el = document.createElement('div');
    el.className = `toast ${kind}`;
    el.innerHTML = `<strong>${label || labels[kind] || 'Aviso'}</strong>${message}`;
    this.shadowRoot.appendChild(el);
    setTimeout(() => {
      el.style.transition = 'opacity 0.25s ease, transform 0.25s ease';
      el.style.opacity = '0';
      el.style.transform = 'translateX(12px)';
      setTimeout(() => el.remove(), 260);
    }, 3800);
  }
}

customElements.define('ui-toast', UiToast);
