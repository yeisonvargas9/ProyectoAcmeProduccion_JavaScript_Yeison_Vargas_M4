// <users-view>: crear, editar y eliminar usuarios.
const CARGOS_DISPONIBLES = ['Administrador', 'Supervisor', 'Operario', 'Auxiliar'];

class UsersView extends HTMLElement {
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
          <div class="eyebrow">Módulo de usuarios</div>
          <h1>Usuarios del sistema</h1>
        </div>
      </div>
      <div class="panel"><div class="empty-state"><strong>Cargando usuarios…</strong><span>Conectando con Firebase.</span></div></div>
    `;
  }

  async loadAndRender() {
    try {
      const users = await window.AcmeStore.UsersAPI.list();
      this.render(users);
    } catch (err) {
      this.innerHTML = `<div class="panel"><div class="empty-state"><strong>No se pudo cargar la información.</strong><span>${err.message}</span></div></div>`;
      this.toast(err.message, 'error');
    }
  }

  render(users) {
    this.innerHTML = `
      <div class="view-head">
        <div>
          <div class="eyebrow">Módulo de usuarios</div>
          <h1>Usuarios del sistema</h1>
          <p class="lead">Registra a las personas autorizadas para operar la planta. El número de identificación es la llave de acceso.</p>
        </div>
        <button class="btn btn-primary" id="btn-new-user">+ Nuevo usuario</button>
      </div>

      <div class="panel">
        ${
          users.length === 0
            ? `<div class="empty-state"><strong>Aún no hay usuarios registrados.</strong><span>Crea el primero para habilitar el acceso al sistema.</span></div>`
            : `<table class="data-table">
                <thead>
                  <tr><th>Identificación</th><th>Nombre completo</th><th>Cargo</th><th>Registrado</th><th></th></tr>
                </thead>
                <tbody>
                  ${users
                    .map(
                      (u) => `
                    <tr data-id="${u.id}">
                      <td class="mono">${u.identificacion}</td>
                      <td>${u.nombre}</td>
                      <td>${u.cargo}</td>
                      <td class="muted">${new Date(u.creadoEn).toLocaleDateString('es-CO')}</td>
                      <td class="row-actions">
                        <button class="icon-btn edit" title="Editar" aria-label="Editar ${u.nombre}">✎</button>
                        <button class="icon-btn danger delete" title="Eliminar" aria-label="Eliminar ${u.nombre}">✕</button>
                      </td>
                    </tr>`
                    )
                    .join('')}
                </tbody>
              </table>`
        }
      </div>
    `;

    this.querySelector('#btn-new-user').addEventListener('click', () => this.openForm());
    this.querySelectorAll('.edit').forEach((btn) =>
      btn.addEventListener('click', (e) => {
        const id = e.target.closest('tr').dataset.id;
        const user = users.find((u) => u.id === id);
        this.openForm(user);
      })
    );
    this.querySelectorAll('.delete').forEach((btn) =>
      btn.addEventListener('click', (e) => {
        const row = e.target.closest('tr');
        const id = row.dataset.id;
        const user = users.find((u) => u.id === id);
        this.confirmDelete(user);
      })
    );
  }

  confirmDelete(user) {
    const modal = document.createElement('ui-modal');
    document.body.appendChild(modal);
    const body = document.createElement('div');
    body.className = 'stack';
    body.innerHTML = `
      <p>¿Eliminar a <strong>${user.nombre}</strong> (${user.identificacion})? Esta acción no se puede deshacer.</p>
      <div class="modal-actions">
        <button class="btn btn-ghost" id="cancel">Cancelar</button>
        <button class="btn btn-danger" id="confirm">Eliminar</button>
      </div>
    `;
    modal.setContent('Eliminar usuario', body);
    modal.open();
    body.querySelector('#cancel').addEventListener('click', () => modal.close());
    body.querySelector('#confirm').addEventListener('click', async () => {
      const session = window.AcmeStore.SessionAPI.get();
      if (session && session.id === user.id) {
        this.toast('No puedes eliminar el usuario con el que iniciaste sesión.', 'error');
        modal.close();
        return;
      }
      const confirmBtn = body.querySelector('#confirm');
      confirmBtn.disabled = true;
      confirmBtn.textContent = 'Eliminando…';
      try {
        await window.AcmeStore.UsersAPI.remove(user.id);
        modal.close();
        this.toast(`Usuario ${user.nombre} eliminado.`, 'success');
        this.loadAndRender();
      } catch (err) {
        this.toast(err.message, 'error');
        confirmBtn.disabled = false;
        confirmBtn.textContent = 'Eliminar';
      }
    });
    modal.addEventListener('modal-close', () => modal.remove());
  }

  openForm(user) {
    const isEdit = !!user;
    const modal = document.createElement('ui-modal');
    document.body.appendChild(modal);

    const body = document.createElement('div');
    body.innerHTML = `
      <form class="stack" novalidate>
        <label class="field">
          <span>Número de identificación</span>
          <input type="text" name="identificacion" inputmode="numeric" required value="${isEdit ? user.identificacion : ''}" ${isEdit ? 'disabled' : ''} placeholder="Ej. 1000000000" />
        </label>
        <label class="field">
          <span>Nombre completo</span>
          <input type="text" name="nombre" required value="${isEdit ? user.nombre : ''}" placeholder="Nombre y apellidos" />
        </label>
        <label class="field">
          <span>Cargo</span>
          <select name="cargo" required>
            <option value="" disabled ${isEdit ? '' : 'selected'}>Selecciona un cargo…</option>
            ${CARGOS_DISPONIBLES.map(
              (c) => `<option value="${c}" ${isEdit && user.cargo === c ? 'selected' : ''}>${c}</option>`
            ).join('')}
            ${
              isEdit && !CARGOS_DISPONIBLES.includes(user.cargo)
                ? `<option value="${user.cargo}" selected>${user.cargo} (actual)</option>`
                : ''
            }
          </select>
        </label>
        <label class="field">
          <span>${isEdit ? 'Nueva contraseña (opcional)' : 'Contraseña'}</span>
          <input type="password" name="password" ${isEdit ? '' : 'required'} placeholder="Mínimo 6 caracteres" />
        </label>
        <label class="field">
          <span>Confirmar contraseña</span>
          <input type="password" name="password2" ${isEdit ? '' : 'required'} placeholder="Repite la contraseña" />
        </label>
        <p class="field-error" role="alert" aria-live="polite"></p>
        <div class="modal-actions">
          <button type="button" class="btn btn-ghost" id="cancel">Cancelar</button>
          <button type="submit" class="btn btn-primary">${isEdit ? 'Guardar cambios' : 'Crear usuario'}</button>
        </div>
      </form>
    `;
    modal.setContent(isEdit ? 'Editar usuario' : 'Nuevo usuario', body);
    modal.open();

    body.querySelector('#cancel').addEventListener('click', () => modal.close());
    modal.addEventListener('modal-close', () => modal.remove());

    const form = body.querySelector('form');
    const errorEl = body.querySelector('.field-error');

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      errorEl.textContent = '';
      const data = new FormData(form);
      // El campo de identificación está deshabilitado al editar, así que el navegador no lo manda en el FormData: usamos el valor original.
      const identificacion = isEdit ? user.identificacion : (data.get('identificacion') || '').trim();
      const nombre = (data.get('nombre') || '').trim();
      const cargo = data.get('cargo');
      const password = (data.get('password') || '').trim();
      const password2 = (data.get('password2') || '').trim();

      if (!isEdit && !identificacion) {
        errorEl.textContent = 'El número de identificación no puede estar vacío.';
        return;
      }
      
      if (!nombre) {
        errorEl.textContent = 'El nombre completo no puede estar vacío ni contener solo espacios.';
        return;
      }
      if (!cargo) {
        errorEl.textContent = 'Selecciona un cargo.';
        return;
      }

      if (!isEdit || password) {
        if (password.length < 6) {
          errorEl.textContent = 'La contraseña debe tener al menos 6 caracteres.';
          return;
        }
        if (password !== password2) {
          errorEl.textContent = 'Las contraseñas no coinciden. Verifica ambos campos.';
          return;
        }
      }

      const submitBtn = form.querySelector('button[type="submit"]');
      submitBtn.disabled = true;
      submitBtn.textContent = 'Guardando…';

      try {
        if (isEdit) {
          await window.AcmeStore.UsersAPI.update(user.id, { nombre, cargo, password });
          this.toast('Usuario actualizado correctamente.', 'success');
        } else {
          await window.AcmeStore.UsersAPI.create({ identificacion, nombre, cargo, password });
          this.toast('Usuario creado correctamente.', 'success');
        }
        modal.close();
        this.loadAndRender();
      } catch (err) {
        errorEl.textContent = err.message;
        submitBtn.disabled = false;
        submitBtn.textContent = isEdit ? 'Guardar cambios' : 'Crear usuario';
      }
    });
  }
}

customElements.define('users-view', UsersView);
