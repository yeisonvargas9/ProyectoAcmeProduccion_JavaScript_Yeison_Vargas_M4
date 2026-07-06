// Punto de entrada: conecta con Firebase, siembra datos demo si hace falta y controla login/rutas.

(async function bootstrap() {
  const root = document.getElementById('app-root');

  root.innerHTML = `
    <div class="auth-screen">
      <div class="panel" style="max-width:420px;text-align:center;">
        <strong>Conectando con Firebase…</strong>
        <p class="muted" style="margin-top:0.4rem;">Cargando datos de la planta.</p>
      </div>
    </div>
  `;

  try {
    await window.AcmeStore.seedIfEmpty();
    await window.AcmeStore.seedDemoData();
  } catch (err) {
    root.innerHTML = `
      <div class="auth-screen">
        <div class="panel" style="max-width:460px;">
          <strong style="color:var(--rust);">No se pudo conectar con Firebase.</strong>
          <p class="muted" style="margin-top:0.5rem;">${err.message}</p>
          <button class="btn btn-primary" id="retry-btn" style="margin-top:0.8rem;">Reintentar</button>
        </div>
      </div>
    `;
    document.getElementById('retry-btn').addEventListener('click', () => bootstrap());
    return;
  }

  const VIEWS = {
    inventario: 'inventory-view',
    produccion: 'production-view',
    usuarios: 'users-view',
  };

  function renderLogin() {
    root.innerHTML = '';
    const login = document.createElement('login-view');
    login.addEventListener('login-success', () => renderApp('inventario'));
    root.appendChild(login);
  }

  function renderApp(route) {
    if (!window.AcmeStore.SessionAPI.isAuthenticated()) {
      renderLogin();
      return;
    }
    const validRoute = VIEWS[route] ? route : 'inventario';
    root.innerHTML = `
      <div class="app-shell">
        <aside class="app-aside"><app-sidebar active="${validRoute}"></app-sidebar></aside>
        <main class="app-main" id="app-main"></main>
      </div>
    `;
    const main = root.querySelector('#app-main');
    main.appendChild(document.createElement(VIEWS[validRoute]));

    root.querySelector('app-sidebar').addEventListener('navigate', (e) => {
      renderApp(e.detail.route);
    });
    root.querySelector('app-sidebar').addEventListener('logout', () => {
      window.AcmeStore.SessionAPI.clear();
      renderLogin();
      document.querySelector('ui-toast')?.show('Sesión cerrada correctamente.', 'info');
    });
  }

  if (window.AcmeStore.SessionAPI.isAuthenticated()) {
    renderApp('inventario');
  } else {
    renderLogin();
  }
})();
