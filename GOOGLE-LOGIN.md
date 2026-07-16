# Login con Google – El Xolito Mex

## Qué quedó listo en el código

- Botón **Apple** eliminado
- Botón **Continuar con Google** conectado a la API
- Backend: `POST /api/auth/google` verifica el token de Google y crea/vincula usuario
- Frontend: `config.js` → `__EL_XOLITO_GOOGLE_CLIENT_ID__`

Sin el **Client ID** de Google Cloud, el botón mostrará un aviso de “no configurado”.

---

## 1. Crear el Client ID (Google Cloud)

1. Entra a [Google Cloud Console](https://console.cloud.google.com/)
2. Crea un proyecto (o usa uno existente), ej. `El Xolito Mex`
3. Menú → **APIs y servicios** → **Credenciales**
4. **Crear credenciales** → **ID de cliente de OAuth**
5. Tipo: **Aplicación web**
6. Nombre: `El Xolito Web`
7. **Orígenes de JavaScript autorizados** (sin barra final):
   - `https://www.elxolitomex.com`
   - `https://elxolitomex.com`
   - `http://localhost:57230` (o el puerto local de `serve`, solo para pruebas)
8. **URI de redirección autorizados** (pueden ir vacíos con GIS popup; si pide uno):
   - `https://www.elxolitomex.com`
9. Copia el **ID de cliente** (`….apps.googleusercontent.com`)

Si pide configurar la pantalla de consentimiento OAuth: tipo **Externo**, app en prueba, agrega tu Gmail como usuario de prueba.

---

## 2. Pegar el Client ID en dos lugares

### A) Frontend (`landing-page/config.js`) — Hostinger

```js
window.__EL_XOLITO_GOOGLE_CLIENT_ID__ = 'PEGA_AQUI.apps.googleusercontent.com';
```

### B) Backend (Render)

En el dashboard de Render → servicio `elxolito-api` → **Environment**:

```
GOOGLE_CLIENT_ID=866671007298-vc61a6u6i9phoh0vmd9gua4ktrd83km1.apps.googleusercontent.com
```

(Debe ser **el mismo** Client ID.)

Luego **Manual Deploy** para que tome la variable.

---

## 3. Archivos a subir / desplegar

### Hostinger (`public_html`)

| Archivo |
|---------|
| `config.js` (con Client ID) |
| `main.js` |
| `index.html` |
| `tienda.html` |
| `producto.html` |
| `mi-cuenta.html` |
| `services/authService.js` |
| `services/whatsappService.js` (si aún no lo subiste) |

### Render (backend)

Haz `git push` y redeploy, o Manual Deploy. Asegura:

- `GOOGLE_CLIENT_ID` en Environment
- Dependencia nueva: `google-auth-library` (viene en `package.json`)

---

## 4. Probar

1. Abre `https://www.elxolitomex.com`
2. Icono de perfil → Continuar con Google
3. Elige cuenta → debe cerrar el modal y saludarte
4. Si One Tap está bloqueado, aparece el botón oficial de Google debajo

---

## Notas

- Cuentas solo-Google no pueden entrar con contraseña (el mensaje lo indica).
- Si ya existía un usuario con ese email + contraseña, Google **vincula** la cuenta.
- Apple queda fuera por ahora.
