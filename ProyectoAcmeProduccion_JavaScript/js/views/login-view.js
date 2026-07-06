// <login-view>: pantalla de autenticación. Emite 'login-success' con { user }.
class LoginView extends HTMLElement {
  connectedCallback() {
    this.render();
  }

  render() {
    this.innerHTML = `
      <div class="auth-screen">
        <div class="auth-card">
          <div class="auth-ticket-strip" aria-hidden="true"></div>
          <div class="auth-content">
            <div class="auth-eyebrow">Planta Macondo · Acceso restringido</div>
            <h1 class="auth-title">ACME<br>Gestión de producción</h1>
            <p class="auth-copy">Inicia sesión con tu número de identificación para registrar inventario y correr procesos productivos.</p>

            <form id="login-form" class="stack" novalidate>
              <label class="field">
                <span>Número de identificación</span>
                <input type="text" name="identificacion" inputmode="numeric" autocomplete="username" required placeholder="Ej. 1000000000" />
              </label>
              <label class="field">
                <span>Contraseña</span>
                <input type="password" name="password" autocomplete="current-password" required placeholder="••••••••" />
              </label>
              <p class="field-error" id="login-error" role="alert" aria-live="polite"></p>
              <button type="submit" class="btn btn-primary btn-block">Ingresar</button>
            </form>

            <div class="auth-hint">
              <strong>Usuario demo:</strong> 1000000000 · <strong>Contraseña:</strong> Admin123
            </div>
          </div>
        </div>
      </div>
    `;

    const form = this.querySelector('#login-form');
    const errorEl = this.querySelector('#login-error');

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      errorEl.textContent = '';
      const data = new FormData(form);
      const identificacion = data.get('identificacion').trim();
      const password = data.get('password');

      const submitBtn = form.querySelector('button[type="submit"]');
      submitBtn.disabled = true;
      submitBtn.textContent = 'Verificando…';

      try {
        const user = await window.AcmeStore.UsersAPI.verifyLogin(identificacion, password);
        if (!user) {
          errorEl.textContent = 'Identificación o contraseña incorrecta.';
          submitBtn.disabled = false;
          submitBtn.textContent = 'Ingresar';
          return;
        }
        window.AcmeStore.SessionAPI.set(user);
        this.dispatchEvent(new CustomEvent('login-success', { detail: { user }, bubbles: true, composed: true }));
      } catch (err) {
        errorEl.textContent = err.message || 'No fue posible iniciar sesión.';
        submitBtn.disabled = false;
        submitBtn.textContent = 'Ingresar';
      }
    });
  }
}

customElements.define('login-view', LoginView);
