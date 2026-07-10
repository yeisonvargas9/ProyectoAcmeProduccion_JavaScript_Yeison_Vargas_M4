// Capa de datos: usuarios, inventario y producción viven en Firebase (API REST, sin SDK). La sesión del navegador se guarda aparte en localStorage.

const FIREBASE_BASE_URL = 'https://stock-flow-d1d59-default-rtdb.firebaseio.com';
const SESSION_KEY = 'acme_session';

async function fbRequest(path, options = {}) {
  // Evita que el navegador reutilice una respuesta vieja tras un F5.
  const separator = path.includes('?') ? '&' : '?';
  const url = `${FIREBASE_BASE_URL}/${path}.json${separator}_=${Date.now()}`;
  const fetchOptions = { ...options, cache: 'no-store' };
  let res;
  try {
    res = await fetch(url, fetchOptions);
  } catch (networkErr) {
    throw new Error('No se pudo conectar con Firebase. Verifica tu conexión a internet.');
  }
  if (!res.ok) {
    let detail = '';
    try {
      detail = (await res.json())?.error || '';
    } catch (_) {}
    throw new Error(`Firebase respondió con error ${res.status} al acceder a "${path || '/'}". ${detail}`);
  }
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

const fbGet = (path) => fbRequest(path);
const fbSet = (path, value) =>
  fbRequest(path, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(value) });
const fbDelete = (path) => fbRequest(path, { method: 'DELETE' });
const fbPatchRoot = (updates) =>
  fbRequest('', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(updates) });

function toArray(obj) {
  if (!obj) return [];
  const values = Array.isArray(obj) ? obj : Object.values(obj);
  return values.filter((v) => v !== null && v !== undefined);
}

const INVALID_KEY_CHARS = /[.#$\[\]/]/;
function assertValidKey(value, label) {
  if (!value || INVALID_KEY_CHARS.test(value)) {
    throw new Error(`${label} no es válido: no puede estar vacío ni contener los caracteres . # $ [ ] /`);
  }
}

// Hash SHA-256 en el cliente; en un backend real se usaría bcrypt/argon2.
async function hashPassword(plain) {
  const enc = new TextEncoder().encode(plain);
  const digest = await crypto.subtle.digest('SHA-256', enc);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

async function seedIfEmpty() {
  return true;
}

async function seedDemoData() {
  const users = toArray(await fbGet('users'));
  if (users.length === 0) {
    const passwordHash = await hashPassword('Admin123');
    await fbSet('users/1000000000', {
      id: '1000000000',
      identificacion: '1000000000',
      nombre: 'Administrador Acme',
      cargo: 'Administrador',
      passwordHash,
      creadoEn: new Date().toISOString(),
    });
  }

  const products = toArray(await fbGet('products'));
  if (products.length === 0) {
    const materiaPrima = [
      { codigo: 'MP-001', nombre: 'Harina de trigo', proveedor: 'Molinos Macondo', unidad: 'g', stock: 5000 },
      { codigo: 'MP-002', nombre: 'Mantequilla', proveedor: 'Lácteos Buendía', unidad: 'g', stock: 3000 },
      { codigo: 'MP-003', nombre: 'Huevo', proveedor: 'Granja Aureliano', unidad: 'un', stock: 120 },
      { codigo: 'MP-004', nombre: 'Azúcar', proveedor: 'Ingenio del Río', unidad: 'g', stock: 4000 },
    ].map((p) => ({ id: p.codigo, tipo: 'materia_prima', formula: [], creadoEn: new Date().toISOString(), ...p }));

    const terminados = [
      {
        id: 'PT-001',
        codigo: 'PT-001',
        nombre: 'Galleta de mantequilla',
        proveedor: 'Producción interna',
        unidad: 'un',
        stock: 0,
        tipo: 'terminado',
        formula: [
          { codigo: 'MP-001', cantidad: 100, unidad: 'g' },
          { codigo: 'MP-002', cantidad: 100, unidad: 'g' },
          { codigo: 'MP-003', cantidad: 1, unidad: 'un' },
        ],
        creadoEn: new Date().toISOString(),
      },
    ];

    const updates = {};
    [...materiaPrima, ...terminados].forEach((p) => {
      updates[`products/${p.codigo}`] = p;
    });
    await fbPatchRoot(updates);
  }
}

const UsersAPI = {
  async list() {
    return toArray(await fbGet('users'));
  },
  async findByIdentificacion(identificacion) {
    return fbGet(`users/${identificacion}`);
  },
  async create({ identificacion, nombre, cargo, password }) {
    assertValidKey(identificacion, 'El número de identificación');
    const existing = await this.findByIdentificacion(identificacion);
    if (existing) {
      throw new Error('Ya existe un usuario registrado con ese número de identificación.');
    }
    const user = {
      id: identificacion,
      identificacion,
      nombre,
      cargo,
      passwordHash: await hashPassword(password),
      creadoEn: new Date().toISOString(),
    };
    await fbSet(`users/${identificacion}`, user);
    return user;
  },
  async update(identificacion, { nombre, cargo, password }) {
    const existing = await this.findByIdentificacion(identificacion);
    if (!existing) throw new Error('Usuario no encontrado.');
    existing.nombre = nombre;
    existing.cargo = cargo;
    if (password) {
      existing.passwordHash = await hashPassword(password);
    }
    await fbSet(`users/${identificacion}`, existing);
    return existing;
  },
  async remove(identificacion) {
    await fbDelete(`users/${identificacion}`);
  },
  async verifyLogin(identificacion, password) {
    const user = await this.findByIdentificacion(identificacion);
    if (!user) return null;
    const hash = await hashPassword(password);
    return hash === user.passwordHash ? user : null;
  },
};

const SessionAPI = {
  get() {
    try {
      const raw = localStorage.getItem(SESSION_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (_) {
      return null;
    }
  },
  set(user) {
    localStorage.setItem(
      SESSION_KEY,
      JSON.stringify({ id: user.id, nombre: user.nombre, cargo: user.cargo, identificacion: user.identificacion })
    );
  },
  clear() {
    localStorage.removeItem(SESSION_KEY);
  },
  isAuthenticated() {
    return !!this.get();
  },
};

const ProductsAPI = {
  async list() {
    return toArray(await fbGet('products'));
  },
  async rawMaterials() {
    return (await this.list()).filter((p) => p.tipo === 'materia_prima');
  },
  async finished() {
    return (await this.list()).filter((p) => p.tipo === 'terminado');
  },
  async findByCodigo(codigo) {
    return fbGet(`products/${codigo}`);
  },
  async create({ codigo, nombre, proveedor, tipo, unidad, formula }) {
    assertValidKey(codigo, 'El código de producto');
    const existing = await this.findByCodigo(codigo);
    if (existing) {
      throw new Error('Ya existe un producto con ese código.');
    }
    if (tipo === 'terminado' && (!formula || formula.length === 0)) {
      throw new Error('Un producto a producir necesita al menos un ingrediente en su fórmula.');
    }
    const product = {
      id: codigo,
      codigo,
      nombre,
      proveedor,
      tipo,
      unidad,
      stock: 0,
      formula: tipo === 'terminado' ? formula : [],
      creadoEn: new Date().toISOString(),
    };
    await fbSet(`products/${codigo}`, product);
    return product;
  },
  async increaseStock(codigo, cantidad) {
    if (!cantidad || cantidad <= 0) throw new Error('La cantidad a ingresar debe ser mayor que cero.');
    const product = await this.findByCodigo(codigo);
    if (!product) throw new Error('Producto no encontrado.');
    const currentStock = Number.isFinite(product.stock) ? product.stock : 0;
    product.stock = currentStock + cantidad;
    await fbSet(`products/${codigo}`, product);
    return product;
  },
  async remove(codigo) {
    await fbDelete(`products/${codigo}`);
  },
};

const ProductionAPI = {
  async list() {
    return toArray(await fbGet('productions')).sort((a, b) => b.codigo - a.codigo);
  },
  // Valida stock para todos los items y aplica todo en una sola escritura (evita cambios a medias).
  async run(items, usuario) {
    if (!items || items.length === 0) {
      throw new Error('Debes seleccionar al menos un producto a fabricar.');
    }

    const products = await ProductsAPI.list();
    const productByCodigo = Object.fromEntries(products.map((p) => [p.codigo, p]));
    const consumoTotal = {};
    const resumenItems = [];

    items.forEach(({ productoCodigo, cantidad }) => {
      if (!cantidad || cantidad <= 0) {
        throw new Error('La cantidad a fabricar debe ser mayor que cero.');
      }
      const producto = productByCodigo[productoCodigo];
      if (!producto) throw new Error(`Producto ${productoCodigo} no encontrado.`);
      if (producto.tipo !== 'terminado' || !producto.formula || producto.formula.length === 0) {
        throw new Error(`El producto ${producto.nombre} no tiene una fórmula de producción definida.`);
      }

      const materiaUsada = producto.formula.map((ing) => {
        const requerido = ing.cantidad * cantidad;
        consumoTotal[ing.codigo] = (consumoTotal[ing.codigo] || 0) + requerido;
        return { codigo: ing.codigo, cantidad: requerido, unidad: ing.unidad };
      });

      resumenItems.push({
        productoCodigo: producto.codigo,
        productoNombre: producto.nombre,
        cantidadFabricada: cantidad,
        unidad: producto.unidad,
        materiaUsada,
      });
    });

    const faltantes = [];
    Object.entries(consumoTotal).forEach(([codigo, requerido]) => {
      const mp = productByCodigo[codigo];
      if (!mp || mp.stock < requerido) {
        faltantes.push({
          codigo,
          nombre: mp ? mp.nombre : codigo,
          disponible: mp ? mp.stock : 0,
          requerido,
          unidad: mp ? mp.unidad : '',
        });
      }
    });

    if (faltantes.length > 0) {
      const detalle = faltantes
        .map((f) => `${f.nombre} (disponible: ${f.disponible}${f.unidad}, requerido: ${f.requerido}${f.unidad})`)
        .join('; ');
      const err = new Error(`Stock insuficiente de materia prima: ${detalle}`);
      err.faltantes = faltantes;
      throw err;
    }

    const stockDeltas = {};
    Object.entries(consumoTotal).forEach(([codigo, requerido]) => {
      stockDeltas[codigo] = (stockDeltas[codigo] || 0) - requerido;
    });
    resumenItems.forEach((item) => {
      stockDeltas[item.productoCodigo] = (stockDeltas[item.productoCodigo] || 0) + item.cantidadFabricada;
    });

    const seqActual = (await fbGet('meta/productionSeq')) || 0;
    const nuevoCodigo = seqActual + 1;

    const registro = {
      codigo: nuevoCodigo,
      fecha: new Date().toISOString(),
      usuario: usuario ? { id: usuario.id, nombre: usuario.nombre } : null,
      items: resumenItems,
    };

    const updates = { 'meta/productionSeq': nuevoCodigo, [`productions/${nuevoCodigo}`]: registro };
    Object.entries(stockDeltas).forEach(([codigo, delta]) => {
      updates[`products/${codigo}/stock`] = productByCodigo[codigo].stock + delta;
    });

    await fbPatchRoot(updates);
    return registro;
  },

async reporteMateriaPrima(anio, mes) {
  const producciones = await this.list();
  const consumo = {};

  producciones.forEach((registro) => {
    const fecha = new Date(registro.fecha);
    if (fecha.getFullYear() === anio && fecha.getMonth() + 1 === mes) {
      registro.items.forEach((item) => {
        item.materiaUsada.forEach((m) => {
          if (!consumo[m.codigo]) {
            consumo[m.codigo] = { codigo: m.codigo, cantidad: 0, unidad: m.unidad };
          }
          consumo[m.codigo].cantidad += m.cantidad;
        });
      });
    }
  });

  const productos = await ProductsAPI.list();
  const nombrePorCodigo = Object.fromEntries(productos.map((p) => [p.codigo, p.nombre]));

  return Object.values(consumo)
    .map((c) => ({
      codigo: c.codigo,
      nombre: nombrePorCodigo[c.codigo] || c.codigo,
      cantidad: c.cantidad,
      unidad: c.unidad,
    }))
    .sort((a, b) => a.nombre.localeCompare(b.nombre));
},
};
window.AcmeStore = {
  FIREBASE_BASE_URL,
  seedIfEmpty,
  seedDemoData,
  UsersAPI,
  SessionAPI,
  ProductsAPI,
  ProductionAPI,
};
