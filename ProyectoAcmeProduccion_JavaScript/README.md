# ProyectoAcmeProduccion — Gestión de producción

Aplicación web (HTML, CSS y JavaScript puro, sin frameworks ni build step) que
automatiza el proceso de producción de la planta de **ACME** en Macondo:
login, gestión de usuarios, inventario de materia prima/productos terminados
con fórmula, y ejecución de procesos productivos.

**Persistencia de datos:** usuarios, productos/inventario e historial de
producción se guardan en **Firebase Realtime Database**, en la instancia:

```
https://stock-flow-d1d59-default-rtdb.firebaseio.com/
```

La app se conecta directamente a la API REST de Firebase (`fetch` sobre
`https://.../<ruta>.json`), **sin usar el SDK de Firebase ni backend
propio**. La URL está configurada en `js/store.js` (constante
`FIREBASE_BASE_URL`); si necesitas apuntar a otra base de datos, solo debes
cambiar ese valor. La sesión de quién inició sesión en el navegador se
guarda en `localStorage` (no es información de negocio a sincronizar).

> ⚠️ **Nota sobre reglas de seguridad:** esta base de datos debe tener
> reglas de lectura/escritura abiertas (o reglas equivalentes) para que la
> app pueda leer y escribir sin autenticación de Firebase. Si ves errores
> "PERMISSION_DENIED" en la consola del navegador, revisa las reglas del
> proyecto en la consola de Firebase (Realtime Database → Reglas).

## 🚀 Cómo ejecutar el proyecto

No requiere instalación de dependencias ni backend. Solo necesitas un
servidor estático local (los módulos de JavaScript se cargan con `<script>`
normales, pero abrir `index.html` directamente con `file://` puede bloquear
`localStorage`/fuentes en algunos navegadores, por lo que se recomienda un
servidor simple):

```bash
# Opción 1: Python (ya viene instalado en la mayoría de sistemas)
cd ProyectoAcmeProduccion
python3 -m http.server 8080

# Opción 2: Node (si tienes npx disponible)
cd ProyectoAcmeProduccion
npx serve .
```

Luego abre `http://localhost:8080` en el navegador.

### Usuario de prueba (semilla inicial)

Al abrir la app por primera vez se crea automáticamente un usuario y un
pequeño inventario de ejemplo:

| Identificación | Contraseña | Cargo |
|---|---|---|
| `1000000000` | `Admin123` | Jefe de Planta |

También se siembra materia prima (harina, mantequilla, huevo, azúcar) y un
producto terminado de ejemplo, **Galleta de mantequilla (PT-001)**, con su
fórmula de producción, para que puedas probar el módulo de producción sin
capturar datos manualmente.

La primera vez que se abre la app (con la base de datos vacía) se crea este
usuario y este inventario automáticamente en Firebase; en las siguientes
veces ya no se vuelve a sembrar. Para reiniciar el sistema desde cero, borra
manualmente los nodos `users`, `products`, `productions` y `meta` desde la
consola de Firebase (Realtime Database).

## 🧱 Estructura del proyecto

```
ProyectoAcmeProduccion/
├── index.html                  # Documento principal, carga todos los módulos
├── README.md
├── wireframes/
│   └── WIREFRAMES.md           # Bocetos de las 4 pantallas principales
├── css/
│   └── styles.css              # Sistema de diseño y estilos globales
└── js/
    ├── store.js                 # Capa de datos (localStorage) + reglas de negocio
    ├── app.js                   # Enrutador y arranque de la aplicación
    ├── components/               # Web Components reutilizables (genéricos)
    │   ├── ui-modal.js           # <ui-modal>       Modal genérico
    │   ├── ui-toast.js           # <ui-toast>       Notificaciones
    │   ├── stock-badge.js        # <stock-badge>    Indicador de saldo/stock
    │   ├── batch-ticket.js       # <batch-ticket>   Ficha visual de un lote de producción
    │   └── app-sidebar.js        # <app-sidebar>    Navegación principal
    └── views/                    # Web Components de cada módulo/pantalla
        ├── login-view.js         # <login-view>
        ├── users-view.js         # <users-view>
        ├── inventory-view.js     # <inventory-view>
        └── production-view.js    # <production-view>
```

## 🔧 Arquitectura y decisiones técnicas

- **Web Components nativos** (`customElements.define`): cada módulo y cada
  pieza de UI reutilizable (modal, toast, badge de stock, ficha de lote,
  sidebar) es un elemento personalizado independiente y modular, tal como
  pide el enunciado.
- Los componentes **genéricos** (`ui-modal`, `ui-toast`, `stock-badge`,
  `batch-ticket`, `app-sidebar`) usan **Shadow DOM** para encapsular su
  estilo y ser reutilizables en cualquier contexto sin colisiones de CSS.
  Reciben color y tipografía del documento a través de variables CSS
  (custom properties), que sí atraviesan el Shadow DOM.
- Las **vistas de cada módulo** (`login-view`, `users-view`,
  `inventory-view`, `production-view`) renderizan en DOM ligero (sin Shadow
  DOM) para compartir las clases utilitarias de `css/styles.css` (tablas,
  formularios, botones) y mantener consistencia visual entre pantallas.
- **`store.js`** concentra toda la lógica de negocio y acceso a datos
  (`UsersAPI`, `ProductsAPI`, `ProductionAPI`, `SessionAPI`) para que las
  vistas solo se preocupen de presentar información y capturar eventos.
  Internamente usa un pequeño cliente `fetch` contra la API REST de
  Firebase Realtime Database (sin SDK).
- Todas las operaciones de datos (`list`, `create`, `update`, `remove`,
  `run`, etc.) son **asíncronas** (`async/await`), ya que implican una
  llamada de red a Firebase. Las vistas muestran un estado de "Cargando…"
  mientras se resuelven y notifican por `ui-toast` si ocurre un error de
  conexión.
- El proceso de producción aplica el descuento de materia prima, el
  aumento del producto terminado, el consecutivo del lote y el registro
  histórico en **una sola escritura multi-ruta** (`PATCH` a la raíz de la
  base de datos), para reducir el riesgo de que una corrida quede a medio
  aplicar.
- **Sin frameworks ni build step**: solo HTML, CSS y JavaScript de
  navegador, cargado con `<script>` estándar, según lo solicitado.

## 📋 Funcionalidades implementadas

### Login
- Autenticación por número de identificación + contraseña.
- Mensaje claro si las credenciales no coinciden.
- La contraseña se compara contra un hash SHA-256 (no se guarda en texto
  plano). *Nota: al ser un proyecto 100% frontend sin backend, este hashing
  es una medida educativa; un sistema en producción real debe autenticar y
  hashear contraseñas en el servidor.*

### Módulo de usuarios
- Crear, editar y eliminar usuarios.
- Al registrar o cambiar contraseña se solicita **doble validación**
  (contraseña + confirmar contraseña) para prevenir errores de digitación.
- No permite eliminar el usuario con el que se tiene la sesión activa.

### Módulo de inventario
- Crear productos indicando código, nombre y proveedor.
- Un producto puede ser **materia prima** o **producto a producir**; en este
  segundo caso se define su **fórmula** (qué materia prima y en qué
  cantidad se necesita por unidad fabricada).
- Ingreso de stock a un producto existente por código + cantidad
  (incrementa el saldo).
- Listado de productos con código, nombre, proveedor, tipo y saldo actual,
  con **buscador/filtro** en vivo por código, nombre o proveedor.
- Indicador visual de nivel de stock (disponible / bajo / agotado).

### Módulo de producción
- Permite seleccionar **uno o varios productos terminados** y la cantidad a
  fabricar en una misma corrida.
- Antes de aplicar cualquier cambio, valida que haya materia prima
  suficiente para **todos** los productos solicitados (operación atómica:
  si falta materia prima para alguno, no se descuenta nada).
- Al confirmar: disminuye la materia prima según la fórmula × cantidad, y
  aumenta el stock de cada producto terminado.
- Cada corrida obtiene un **código consecutivo** que inicia en 1 y se
  incrementa automáticamente.
- Se muestra un **resumen por producto** (cantidad fabricada y materia
  prima consumida) representado como una "ficha de lote" (`<batch-ticket>`),
  y se conserva un historial de todos los lotes producidos.

## 🎨 Wireframes

Ver [`wireframes/WIREFRAMES.md`](./wireframes/WIREFRAMES.md) para los
bocetos de las pantallas de Login, Usuarios, Inventario y Producción que
guiaron el diseño final.

## 📱 Responsive

El layout usa `grid`/`flex` fluidos; a partir de 860px de ancho la barra
lateral pasa a ocupar el ancho completo sobre el contenido, y los
formularios/tablas colapsan a una columna en pantallas angostas.
