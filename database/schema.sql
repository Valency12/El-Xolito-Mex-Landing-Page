-- ============================================================
-- El Xolito Mex - Base de datos SQLite para tienda de joyería
-- ============================================================

-- Lista canónica de categorías: Anillos, Brazaletes, Collares, Aretes, Broqueles, Pulseras, Dijes, Conjuntos
CREATE TABLE IF NOT EXISTS categorias (
    id      INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre  TEXT    NOT NULL UNIQUE,
    slug    TEXT    NOT NULL UNIQUE,
    orden   INTEGER NOT NULL DEFAULT 0
);

INSERT OR IGNORE INTO categorias (id, nombre, slug, orden) VALUES
(1, 'Anillos',      'anillos',      1),
(2, 'Brazaletes',   'brazaletes',   2),
(3, 'Collares',     'collares',     3),
(4, 'Aretes',       'aretes',       4),
(5, 'Broqueles',    'broqueles',    5),
(6, 'Pulseras',     'pulseras',     6),
(7, 'Dijes',        'dijes',        7),
(8, 'Conjuntos',    'conjuntos',    8);

-- Tabla: productos (catálogo de joyería)
CREATE TABLE IF NOT EXISTS productos (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre          TEXT    NOT NULL,
    descripcion     TEXT,
    precio          REAL    NOT NULL CHECK (precio >= 0),
    imagen_path     TEXT,
    material        TEXT,
    stock           INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
    categoria       TEXT,
    activo          INTEGER NOT NULL DEFAULT 1 CHECK (activo IN (0, 1)),
    destacado       INTEGER NOT NULL DEFAULT 0 CHECK (destacado IN (0, 1)),
    created_at      TEXT    DEFAULT (datetime('now', 'localtime'))
);

CREATE INDEX IF NOT EXISTS idx_productos_categoria ON productos(categoria);
CREATE INDEX IF NOT EXISTS idx_productos_material ON productos(material);
CREATE INDEX IF NOT EXISTS idx_productos_nombre ON productos(nombre);
CREATE INDEX IF NOT EXISTS idx_productos_activo ON productos(activo);
CREATE INDEX IF NOT EXISTS idx_productos_destacado ON productos(destacado);

-- Tabla: usuarios (clientes que se registran en la tienda)
CREATE TABLE IF NOT EXISTS usuarios (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    email           TEXT    NOT NULL UNIQUE,
    password_hash   TEXT    NOT NULL,
    nombre_completo TEXT,
    telefono        TEXT,
    created_at      TEXT    DEFAULT (datetime('now', 'localtime'))
);

CREATE INDEX IF NOT EXISTS idx_usuarios_email ON usuarios(email);

-- Tabla: carrito_items (carrito por usuario, backend)
CREATE TABLE IF NOT EXISTS carrito_items (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    usuario_id  INTEGER NOT NULL,
    producto_id INTEGER NOT NULL,
    cantidad    INTEGER NOT NULL DEFAULT 1 CHECK (cantidad > 0),
    created_at  TEXT    DEFAULT (datetime('now', 'localtime')),
    UNIQUE(usuario_id, producto_id),
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    FOREIGN KEY (producto_id) REFERENCES productos(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_carrito_usuario ON carrito_items(usuario_id);

-- Tabla: pedidos (órdenes de compra)
CREATE TABLE IF NOT EXISTS pedidos (
    id                  INTEGER PRIMARY KEY AUTOINCREMENT,
    usuario_id          INTEGER NOT NULL,
    total               REAL    NOT NULL CHECK (total >= 0),
    estado              TEXT    NOT NULL DEFAULT 'pendiente_pago',
    direccion_entrega   TEXT,
    contacto            TEXT,
    created_at          TEXT    DEFAULT (datetime('now', 'localtime')),
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);

CREATE INDEX IF NOT EXISTS idx_pedidos_usuario ON pedidos(usuario_id);
CREATE INDEX IF NOT EXISTS idx_pedidos_estado ON pedidos(estado);

-- Tabla: pedido_items (líneas de cada pedido)
CREATE TABLE IF NOT EXISTS pedido_items (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    pedido_id       INTEGER NOT NULL,
    producto_id     INTEGER NOT NULL,
    cantidad        INTEGER NOT NULL CHECK (cantidad > 0),
    precio_unitario REAL    NOT NULL CHECK (precio_unitario >= 0),
    FOREIGN KEY (pedido_id) REFERENCES pedidos(id) ON DELETE CASCADE,
    FOREIGN KEY (producto_id) REFERENCES productos(id)
);

CREATE INDEX IF NOT EXISTS idx_pedido_items_pedido ON pedido_items(pedido_id);

-- ============================================================
-- INSERT de ejemplo - Productos (categorías: ver lista arriba)
-- ============================================================

INSERT INTO productos (nombre, descripcion, precio, imagen_path, material, stock, categoria, activo, destacado) VALUES
('Broqueles Colibrí', 'Broqueles inspirados en el colibrí. Pieza artesanal, ideal para uso diario.', 320.00, 'assets/Broqueles/broqueles-colibri.jpg', 'Plata .925', 8, 'Broqueles', 1, 1),
('Broqueles Catarina', 'Broqueles con motivo de catarina. Diseño delicado y versátil.', 280.00, 'assets/Broqueles/broqueles-catarina.jpg', 'Plata .925', 12, 'Broqueles', 1, 0),
('Broqueles Koala Azul', 'Broqueles Koala en tono azul. Detalle único y cómodos para dormir.', 350.00, 'assets/Broqueles/broqueles-koala-azul.jpg', 'Plata .925 con esmalte', 5, 'Broqueles', 1, 1),
('Broqueles Medalla Colibrí', 'Broqueles tipo medalla con colibrí. Elegancia y simbolismo mexicano.', 380.00, 'assets/Broqueles/broqueles-medalla-colibri.jpg', 'Plata .925', 6, 'Broqueles', 1, 0),
('Broqueles Solitario Brillante', 'Broqueles solitario con piedra brillante. Perfectos para ocasiones especiales.', 420.00, 'assets/Broqueles/broqueles-solitario-brillante.jpg', 'Plata .925', 4, 'Broqueles', 1, 1),
('Pulsera Curb Chain', 'Pulsera tipo curb chain en plata. Un clásico que combina con todo.', 650.00, 'assets/Pulseras/pulsera-curb.jpg', 'Plata .925', 10, 'Pulseras', 1, 1),
('Collar Colgante Corazón', 'Collar con dije corazón en plata. Ideal para regalo.', 480.00, 'assets/Collares/collar-corazon.jpg', 'Plata .925', 7, 'Collares', 1, 0),
('Anillo Sello', 'Anillo tipo sello con diseño artesanal. Acabado mate.', 520.00, 'assets/Anillos/anillo-sello.png', 'Plata .925', 3, 'Anillos', 1, 1),
('Aretes Hoops Pequeños', 'Aretes tipo hoop en plata. Tamaño discreto para uso diario.', 290.00, 'assets/Aretes/hoops-pequenos.jpg', 'Plata .925', 15, 'Aretes', 1, 0),
('Dije Colibrí', 'Dije colibrí para cadena. Simbolismo mexicano.', 220.00, 'assets/Dijes/dije-colibri.jpg', 'Plata .925', 20, 'Dijes', 1, 0),
('Brazalete Canasta', 'Brazalete tipo canasta en plata. Diseño clásico.', 580.00, 'assets/Brazaletes/brazalete-canasta.jpg', 'Plata .925', 6, 'Brazaletes', 1, 1);
