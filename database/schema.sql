-- ============================================================
-- El Xolito Mex - Base de datos SQLite para tienda de joyería
-- ============================================================

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

-- ============================================================
-- Migración: si ya tenías la tabla productos sin activo/destacado
-- (ejecutar solo una vez si la base ya existía)
-- ============================================================
-- ALTER TABLE productos ADD COLUMN activo INTEGER NOT NULL DEFAULT 1;
-- ALTER TABLE productos ADD COLUMN destacado INTEGER NOT NULL DEFAULT 0;

-- ============================================================
-- INSERT de ejemplo - Productos (para probar que la BD refleja datos)
-- ============================================================

INSERT INTO productos (nombre, descripcion, precio, imagen_path, material, stock, categoria, activo, destacado) VALUES
('Broqueles Colibrí', 'Broqueles inspirados en el colibrí. Pieza artesanal, ideal para uso diario.', 320.00, 'assets/Dormilonas/broqueles-colibri.jpg', 'Plata .925', 8, 'Dormilonas', 1, 1),
('Broqueles Catarina', 'Broqueles con motivo de catarina. Diseño delicado y versátil.', 280.00, 'assets/Dormilonas/broqueles-catarina.jpg', 'Plata .925', 12, 'Dormilonas', 1, 0),
('Broqueles Koala Azul', 'Broqueles Koala en tono azul. Detalle único y cómodos para dormir.', 350.00, 'assets/Dormilonas/broqueles-koala-azul.jpg', 'Plata .925 con esmalte', 5, 'Dormilonas', 1, 1),
('Broqueles Medalla Colibrí', 'Broqueles tipo medalla con colibrí. Elegancia y simbolismo mexicano.', 380.00, 'assets/Dormilonas/broqueles-medalla-colibri.jpg', 'Plata .925', 6, 'Dormilonas', 1, 0),
('Broqueles Solitario Brillante', 'Broqueles solitario con piedra brillante. Perfectos para ocasiones especiales.', 420.00, 'assets/Dormilonas/broqueles-solitario-brillante.jpg', 'Plata .925, Cristal', 4, 'Dormilonas', 1, 1),
('Pulsera Curb Chain', 'Pulsera tipo curb chain en plata. Un clásico que combina con todo.', 650.00, 'assets/Pulseras/pulsera-curb.jpg', 'Plata .925', 10, 'Pulseras', 1, 1),
('Collar Colgante Corazón', 'Collar con dije corazón en plata. Ideal para regalo.', 480.00, 'assets/Collares/collar-corazon.jpg', 'Plata .925', 7, 'Collares', 1, 0),
('Anillo Sello', 'Anillo tipo sello con diseño artesanal. Acabado mate.', 520.00, 'assets/Anillos/anillo-sello.png', 'Plata .925', 3, 'Anillos', 1, 1),
('Aretes Hoops Pequeños', 'Aretes tipo hoop en plata. Tamaño discreto para uso diario.', 290.00, 'assets/Aretes/hoops-pequenos.jpg', 'Plata .925', 15, 'Aretes', 1, 0),
('Dije Colibrí', 'Dije colibrí para cadena. Simbolismo mexicano.', 220.00, 'assets/Collares/dije-colibri.jpg', 'Plata .925', 20, 'Collares', 1, 0);
