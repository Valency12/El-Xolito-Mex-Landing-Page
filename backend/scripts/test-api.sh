#!/usr/bin/env bash
# Pruebas de la API (ejecutar con el servidor corriendo: npm start)
# Uso: ./scripts/test-api.sh   o   bash scripts/test-api.sh

BASE="http://localhost:3000/api"
RED='\033[0;31m'
GREEN='\033[0;32m'
NC='\033[0m'

echo "=== 1. Health ==="
curl -s "$BASE/health" | head -c 200
echo -e "\n"

echo "=== 2. Categorías ==="
curl -s "$BASE/categories" | head -c 400
echo -e "\n"

echo "=== 3. Productos ==="
curl -s "$BASE/products?activo=1" | head -c 400
echo -e "\n"

echo "=== 4. Registro ==="
REG=$(curl -s -X POST "$BASE/auth/register" -H "Content-Type: application/json" \
  -d '{"email":"test@elxolito.com","password":"test123","nombre_completo":"Usuario Prueba"}')
echo "$REG" | head -c 500
TOKEN=$(echo "$REG" | grep -o '"accessToken":"[^"]*"' | cut -d'"' -f4)
echo -e "\n"

if [ -z "$TOKEN" ]; then
  echo "=== 5. Login (por si ya existía el usuario) ==="
  LOGIN=$(curl -s -X POST "$BASE/auth/login" -H "Content-Type: application/json" \
    -d '{"email":"test@elxolito.com","password":"test123"}')
  echo "$LOGIN" | head -c 500
  TOKEN=$(echo "$LOGIN" | grep -o '"accessToken":"[^"]*"' | cut -d'"' -f4)
fi
echo -e "\n"

if [ -z "$TOKEN" ]; then
  echo -e "${RED}No se obtuvo token. Revisa registro/login.${NC}"
  exit 1
fi

echo -e "${GREEN}Token obtenido.${NC}"
echo "=== 6. Agregar al carrito (producto 1, cantidad 2) ==="
curl -s -X POST "$BASE/cart/items" -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" \
  -d '{"producto_id":1,"cantidad":2}'
echo -e "\n"

echo "=== 7. Ver carrito ==="
curl -s "$BASE/cart" -H "Authorization: Bearer $TOKEN" | head -c 800
echo -e "\n"

echo "=== 8. Checkout (crear pedido) ==="
ORDER=$(curl -s -X POST "$BASE/orders" -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" \
  -d '{"direccion_entrega":"Calle Ejemplo 123, CDMX","contacto":"test@elxolito.com"}')
echo "$ORDER"
echo -e "\n"

echo "=== 9. Listar pedidos ==="
curl -s "$BASE/orders" -H "Authorization: Bearer $TOKEN" | head -c 500
echo -e "\n"

echo -e "${GREEN}Pruebas completadas.${NC}"
