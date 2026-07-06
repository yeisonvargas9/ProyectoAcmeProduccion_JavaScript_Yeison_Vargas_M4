// <app-sidebar active="inventario">: navegación principal. Emite 'navigate' y 'logout'.
class AppSidebar extends HTMLElement {
  static get observedAttributes() {
    return ['active'];
  }

  connectedCallback() {
    this.attachShadow({ mode: 'open' });
    this.render();
  }

  attributeChangedCallback() {
    if (this.shadowRoot) this.render();
  }

  render() {
    const active = this.getAttribute('active') || '';
    const session = window.AcmeStore.SessionAPI.get();
    const items = [
      { route: 'inventario', label: 'Inventario', icon: this.iconInventory() },
      { route: 'produccion', label: 'Producción', icon: this.iconProduction() },
      { route: 'usuarios', label: 'Usuarios', icon: this.iconUsers() },
    ];

    this.shadowRoot.innerHTML = `
      <style>
        :host { display:block; font-family: var(--font-body, sans-serif); height: 100%; }
        .side {
          height: 100%;
          background: var(--ink, #1f2421);
          color: #ece8de;
          display: flex;
          flex-direction: column;
          padding: 1.4rem 0;
        }
        .brand {
          padding: 0 1.4rem 1.3rem;
          border-bottom: 1px solid rgba(255,255,255,0.1);
          margin-bottom: 1rem;
        }
        .brand .name {
          font-family: var(--font-display, sans-serif);
          font-size: 1.15rem;
          font-weight: 700;
          letter-spacing: 0.01em;
          color: #fff;
        }
        .brand .sub {
          font-family: var(--font-mono, monospace);
          font-size: 0.68rem;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: var(--brass, #c8a06a);
          margin-top: 0.2rem;
        }
        nav { display: flex; flex-direction: column; gap: 0.15rem; padding: 0 0.7rem; flex: 1; }
        button.nav-item {
          display: flex; align-items: center; gap: 0.7rem;
          background: transparent; border: none; cursor: pointer;
          color: #cfcbc0; text-align: left;
          padding: 0.65rem 0.7rem; border-radius: 4px;
          font-size: 0.88rem; font-family: var(--font-body, sans-serif);
          transition: background 0.12s ease, color 0.12s ease;
        }
        button.nav-item svg { flex-shrink: 0; opacity: 0.85; }
        button.nav-item:hover { background: rgba(255,255,255,0.06); color: #fff; }
        button.nav-item:focus-visible { outline: 2px solid var(--brass, #b08d57); outline-offset: 2px; }
        button.nav-item.active { background: var(--brass, #b08d57); color: #201c15; font-weight: 600; }
        button.nav-item.active svg { opacity: 1; }
        .footer { padding: 1rem 1.4rem 0; border-top: 1px solid rgba(255,255,255,0.1); margin-top: 1rem; }
        .user { font-size: 0.82rem; margin-bottom: 0.7rem; }
        .user .u-name { color: #fff; font-weight: 600; display:block; }
        .user .u-role { color: #9c988e; font-size: 0.74rem; }
        button.logout {
          width: 100%; padding: 0.55rem 0.7rem; border-radius: 4px;
          border: 1px solid rgba(255,255,255,0.18); background: transparent;
          color: #ece8de; font-size: 0.82rem; cursor: pointer;
        }
        button.logout:hover { background: rgba(181,72,52,0.25); border-color: var(--rust, #b54834); }
      </style>
      <div class="side">
        <div class="brand">
          <div class="name">ACME · Macondo</div>
          <div class="sub">Gestión de producción</div>
        </div>
        <nav>
          ${items
            .map(
              (it) => `
            <button class="nav-item ${active === it.route ? 'active' : ''}" data-route="${it.route}">
              ${it.icon}
              <span>${it.label}</span>
            </button>`
            )
            .join('')}
        </nav>
        <div class="footer">
          <div class="user">
            <span class="u-name">${session ? session.nombre : ''}</span>
            <span class="u-role">${session ? session.cargo : ''}</span>
          </div>
          <button class="logout">Cerrar sesión</button>
        </div>
      </div>
    `;

    this.shadowRoot.querySelectorAll('.nav-item').forEach((btn) => {
      btn.addEventListener('click', () => {
        this.dispatchEvent(new CustomEvent('navigate', { detail: { route: btn.dataset.route }, bubbles: true, composed: true }));
      });
    });
    this.shadowRoot.querySelector('.logout').addEventListener('click', () => {
      this.dispatchEvent(new CustomEvent('logout', { bubbles: true, composed: true }));
    });
  }

  iconInventory() {
    return `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M3 7l9-4 9 4-9 4-9-4Z"/><path d="M3 7v10l9 4 9-4V7"/><path d="M12 11v10"/></svg>`;
  }
  iconProduction() {
    return `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 21V10l5 3V10l5 3V10l5 3v8H4Z"/><path d="M9 21v-4h4v4"/></svg>`;
  }
  iconUsers() {
    return `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="9" cy="8" r="3.2"/><path d="M2.5 20c0-3.6 2.9-6 6.5-6s6.5 2.4 6.5 6"/><circle cx="17.5" cy="8.5" r="2.4"/><path d="M16 14.2c2.6.4 4.5 2.3 4.5 5.3"/></svg>`;
  }
}

customElements.define('app-sidebar', AppSidebar);
