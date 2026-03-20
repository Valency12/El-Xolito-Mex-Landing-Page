# Landing Page - El Xolito Mex

Esta es una copia independiente de la landing page con todos sus estilos y funcionalidades.

## Estructura

```
landing-page/
├── index.html          # Página principal
├── style.css           # Estilos
├── main.js             # Funcionalidades JavaScript
├── config.js           # URL base de la API (producción: __EL_XOLITO_API__)
├── services/           # Servicios (auth, productos)
│   ├── authService.js
│   └── productService.js
└── assets/             # Imágenes, videos, logos
    ├── Anillos/
    ├── Conjuntos/
    ├── Pulseras/
    ├── Reels/
    ├── Taller/
    └── ...
```

## Cómo usar

1. Abre esta carpeta en Cursor/VS Code
2. Abre `index.html`
3. Usa "Go Live" para ver la página

## Notas

- Esta es una copia independiente, los cambios aquí no afectan la carpeta original `ElXolitoMex/`
- Para productos reales y checkout, el backend debe estar accesible; en local por defecto es `http://localhost:3000/api`. En producción configura `config.js` o `window.__EL_XOLITO_API__` (ver `../DEPLOYMENT.md`).
- Todos los assets (imágenes, videos) están incluidos

