# Wireframes — ACME Gestión de producción

Bocetos de baja fidelidad usados como base para el diseño final
(ver `css/styles.css` y los componentes en `js/`).

## 1. Login

```
┌───────────────────────────────────────────┐
│ ▐▐  ACCESO RESTRINGIDO · PLANTA MACONDO    │
│ ▐▐                                         │
│ ▐▐  ACME                                   │
│ ▐▐  Gestión de producción                  │
│ ▐▐                                         │
│ ▐▐  Texto de apoyo breve...                │
│ ▐▐                                         │
│ ▐▐  Número de identificación                │
│ ▐▐  [_________________________]            │
│ ▐▐                                         │
│ ▐▐  Contraseña                              │
│ ▐▐  [_________________________]            │
│ ▐▐                                         │
│ ▐▐  [        Ingresar        ]              │
│ ▐▐                                         │
│ ▐▐  ⓘ Usuario demo: ...                     │
└───────────────────────────────────────────┘
   ↑ franja lateral tipo "ticket de fábrica"
```

## 2. Módulo de usuarios

```
┌─────────┬─────────────────────────────────────────────┐
│ ACME    │  Usuarios del sistema        [+ Nuevo usuario]│
│ Macondo │  Texto de apoyo...                            │
│         ├─────────────────────────────────────────────┤
│ ▸Invent │  ID           Nombre        Cargo      ⋮      │
│  Produc │  1000000000   Admin Acme    Jefe Planta ✎ ✕   │
│  Usuar. │  ...                                          │
│         │                                               │
│ [Salir] │                                               │
└─────────┴─────────────────────────────────────────────┘

Modal "Nuevo/Editar usuario":
┌──────────────────────────────┐
│ Nuevo usuario              ×  │
│ Identificación [______]       │
│ Nombre completo [______]      │
│ Cargo [______]                 │
│ Contraseña [______]            │
│ Confirmar contraseña [______]  │  ← doble validación
│           [Cancelar] [Crear]   │
└──────────────────────────────┘
```

## 3. Módulo de inventario

```
┌─────────┬─────────────────────────────────────────────┐
│ ACME    │  Inventario de planta       [+ Nuevo producto]│
│ Macondo │  Texto de apoyo...                            │
│         ├─────────────────────────────────────────────┤
│  Invent▸│  🔍 [ Buscar por código, nombre o proveedor ] │
│  Produc │                                               │
│  Usuar. │  Código  Nombre        Prov.  Tipo   Saldo    │
│         │  MP-001  Harina...     ...    MatPr  ●4500g   │
│ [Salir] │  PT-001  Galleta...    ...    Termi  ●5un      │
│         │           [ver fórmula]      [Ingresar stock]✕│
└─────────┴─────────────────────────────────────────────┘

Modal "Nuevo producto":
┌──────────────────────────────┐
│ Nuevo producto              × │
│ Código [____]  Nombre [____]  │
│ Proveedor [____]               │
│ Unidad [▾]     Tipo [▾]        │
│ (si tipo = terminado)          │
│  Fórmula de producción         │
│  [Materia ▾][Cant.] ✕          │
│  + Agregar ingrediente         │
│           [Cancelar] [Crear]   │
└──────────────────────────────┘
```

## 4. Módulo de producción

```
┌─────────┬─────────────────────────────────────────────┐
│ ACME    │  Correr proceso de producción                 │
│ Macondo │  Texto de apoyo...                             │
│         ├─────────────────────────────────────────────┤
│  Invent │  [Producto ▾] [Cantidad] ✕                      │
│  Produc▸│  + Agregar otro producto                        │
│  Usuar. │                        [ Fabricar ]              │
│         ├─────────────────────────────────────────────┤
│ [Salir] │  Historial                                      │
│         │  ▌#0002   Nombre usuario · fecha                │
│         │  ▌ Galleta de mantequilla      +5 un             │
│         │  ▌  MP-001            -500 g                    │
│         │  ▌  MP-002            -500 g                    │
│         │  ▌  MP-003            -5 un                     │
└─────────┴─────────────────────────────────────────────┘
   ↑ "ficha de lote" (batch-ticket): franja punteada + código consecutivo
```
