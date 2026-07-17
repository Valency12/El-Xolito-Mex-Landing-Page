# Restablecer contraseña — El Xolito Mex

## Flujo

1. Cliente: «¿Olvidaste tu contraseña?» → ingresa su email  
2. API envía correo desde `hola@elxolitomex.com` (SMTP Hostinger)  
3. Cliente abre el enlace → `/reset-password?token=...`  
4. Elige nueva contraseña e inicia sesión  

El enlace caduca en **1 hora**.

---

## Variables en Render (Environment)

```
SITE_URL=https://www.elxolitomex.com
SMTP_HOST=smtp.hostinger.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=hola@elxolitomex.com
SMTP_PASS=LA_CONTRASEÑA_DEL_CORREO
MAIL_FROM=hola@elxolitomex.com
```

En Hostinger → Emails → tu cuenta `hola@...` → usa la misma contraseña en `SMTP_PASS`.  
Puerto alternativo: `587` con `SMTP_SECURE=false` si 465 falla.

Después de guardar: **Save, rebuild and deploy**.

---

## Archivos a subir (Hostinger)

- `main.js`
- `services/authService.js`
- `reset-password.html` *(nuevo)*
- `.htaccess`

## Backend

`git push` + variables SMTP en Render.

---

## Probar

1. Cuenta de prueba con email/contraseña (no solo Google)  
2. Olvidé contraseña → revisa bandeja / spam de `hola@elxolitomex.com`  
3. Abre el enlace → nueva contraseña → login  

Cuentas **solo Google** no reciben enlace (deben usar Continuar con Google).
