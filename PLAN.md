# Plan de acción: app de intercambio de regalos

Una app para intercambios estilo drawnames, con el lenguaje visual de Instagram. El admin crea el grupo, la gente entra por un enlace, descubre a quién le regala con una animación tipo *story* y arma una wishlist que tiene que encajar con la temática del grupo.

Base actual: Vite 8, React 19 (con React Compiler), JS, pnpm y oxlint. Es el scaffold limpio.

---

## 1. Producto

### Roles

| Rol | Qué hace |
|---|---|
| **Admin** (creador) | Crea el grupo con nombre, fecha, presupuesto, temática y participantes. Comparte el enlace, ve quién ya entró (pero no quién le toca a quién) y puede editar o re-sortear mientras nadie haya visto su resultado. El admin también participa. |
| **Participante** | Abre el enlace, elige su nombre de la lista, ve a quién le regala (animación), arma su wishlist y consulta la de la persona que le tocó. |

### Flujos

**A. Crear grupo (wizard de 4 pasos, uno por pantalla)**
1. **Datos:** nombre del grupo, fecha (p. ej. 4 dic 2026) y presupuesto (p. ej. $300 MXN).
2. **Temática:** texto libre (p. ej. "Pijamas") más una descripción opcional ("De preferencia afelpadas, talla real"). También se pueden escoger *sugerencias de categoría* (ver §1.3).
3. **Participantes:** se agregan uno por uno con un input y Enter. Aparecen como avatares con iniciales en fila (como la barra de stories). Mínimo 3.
4. **Revisar y sortear:** resumen y botón "Hacer sorteo". El sorteo se hace en el servidor.

Al terminar, el admin recibe **dos enlaces**:
- Enlace de invitación (`/g/:slug`), que se comparte con todos.
- Enlace de admin (`/g/:slug/admin?k=<adminToken>`), que es privado y se guarda en localStorage del creador.

**B. Unirse y revelar**
1. El participante abre `/g/:slug` y ve la "cabecera de perfil" del grupo (fecha, presupuesto, temática).
2. Toca **"¿Quién eres?"** y elige su nombre. Los nombres ya reclamados salen en gris y deshabilitados.
3. Crea un **PIN de 4 dígitos** para poder volver a entrar desde otro dispositivo. Además se guarda un `claimToken` en localStorage.
4. **Revelación:** una story a pantalla completa (ver §3.5) que termina en "Le regalas a **Ana**".
5. Después pasa al home del grupo.

**C. Wishlist temática**
- Cada participante agrega productos con: título, link opcional, precio aproximado, foto opcional (o la imagen OG del link) y nota.
- **Temática y categorías:** el admin define las categorías al crear el grupo (por ejemplo, para "Pijamas": Pijama completa, Pantuflas, Antifaz), pero son **opcionales**: sirven de atajos de búsqueda y de etiqueta, nadie está obligado a elegir una. En el buscador, "Agregar" agrega de un clic; si la búsqueda es justo una categoría del grupo, el producto se etiqueta con ella. Un precio sobre el tope solo avisa.
- Cada participante ve **solo su wishlist y la de su persona asignada**.

### Fuera del MVP (v2)
- **Reglas de broma (hecho):** el organizador puede decidir a mano un regalo ("a José le toca Ana") al crear el grupo o desde el panel, mientras nadie haya visto su resultado. Solo el admin las ve. Pueden combinarse con exclusiones.
- ~~Exclusiones ("Ana y Luis son pareja, que no se toquen").~~ Hecho en la fase 9: se definen al crear el grupo (con 4+ personas) o desde el panel de admin mientras nadie haya visto su resultado.
- Recordatorios por correo o WhatsApp.
- Chat anónimo con tu persona asignada ("¿qué talla eres?").
- Avatar con foto.

---

## 2. Arquitectura técnica

### Stack
| Capa | Elección | Por qué |
|---|---|---|
| Frontend | React 19 + Vite (lo que ya hay) | — |
| Rutas | `react-router` v7 | Rutas `/nuevo`, `/g/:slug`, `/g/:slug/admin` |
| Animación | `motion` (Framer Motion) | Story de revelación y transiciones de pasos |
| Backend/DB | **Laravel 13** (solo API, en `../../php/Laravel/13/gift-exchange-api`) + SQLite | API REST `/api/v1`, solo JSON (sin Blade, sesiones ni usuarios). El sorteo y los secretos viven en el servidor; en desarrollo Vite redirige `/api` a `php artisan serve` |
| Estilos | **Tailwind CSS v4** (`@tailwindcss/vite`), tokens en `@theme` (§3) | Todo el estilo se escribe con utilidades en el JSX; no se escribe CSS a mano. Los tokens de Instagram viven en `src/index.css` y se usan como `bg-bg`, `text-text-2`, `bg-action`, `bg-ig-gradient`, `rounded-ig` |
| Deploy | Vercel o Netlify | SPA estática |

Para la fecha no hace falta librería: con `Intl.DateTimeFormat('es-MX')` basta.

### Modelo de datos (Laravel + SQLite, ids ULID)

```
groups        slug (único), name, event_date, budget (pesos), theme, theme_description,
              admin_token_hash (sha256), drawn_at
categories    group_id, label                      -- categorías permitidas de la temática
participants  group_id, name, pin (hash), claim_token (único), claimed_at, revealed_at,
              receiver_id (único, → participants)  -- el sorteo: a quién le regala
wishlist_items  (fase 6) participant_id, category_id, title, url, price, image_url, note
```

La asignación vive en `participants.receiver_id` (único): cada persona recibe de exactamente una.

### API `/api/v1` (17 endpoints hechos, 187 tests con Pest)

| Método y ruta | Auth | Qué hace |
|---|---|---|
| `POST /groups` | — (10/min por IP) | Crea el grupo, hace el sorteo y devuelve `slug` y `admin_token` (una sola vez) |
| `GET /groups/{slug}` | — | Datos públicos: temática, tope, nombres y si ya entraron. **Nunca asignaciones** |
| `GET /groups/{slug}/admin` | Bearer admin | Vista de admin: quién entró y quién vio su resultado, y si se puede volver a sortear. **Sin asignaciones** |
| `PUT /groups/{slug}/admin` | Bearer admin | Edita nombre, fecha, tope, temática y categorías (no participantes ni sorteo) |
| `PUT /groups/{slug}/admin/fixed-assignments` | Bearer admin | Reemplaza los regalos decididos a mano ("reglas de broma": quién le regala a quién) y vuelve a sortear. 409 si alguien ya vio su resultado; 422 `NO_VALID_DRAW` si las reglas no dejan un sorteo posible |
| `POST /groups/{slug}/admin/draw` | Bearer admin | Vuelve a sortear; responde 409 si alguien ya vio su resultado |
| `PUT /groups/{slug}/admin/exclusions` | Bearer admin | Reemplaza las parejas que no deben tocarse y vuelve a sortear (409 si alguien ya vio su resultado, 422 si no hay sorteo posible) |
| `POST /groups/{slug}/participants/{id}/claim` | — (5/min) | Reclama el nombre con un PIN de 4 dígitos y devuelve `claim_token` |
| `POST /groups/{slug}/participants/{id}/session` | — (5/min) | Con el PIN, devuelve el `claim_token` (otro dispositivo) |
| `GET /groups/{slug}/me` | Bearer participante | Quién soy y si ya vi mi resultado |
| `GET /groups/{slug}/me/assignment` | Bearer participante | **Solo mi** receptor; lo marca como visto |
| `GET /groups/{slug}/me/wishlist` | Bearer participante | Mi wishlist |
| `POST /groups/{slug}/me/wishlist` | Bearer participante | Agrega un producto (categoría opcional; máx. 30; enlaces solo http/https) |
| `PUT /DELETE /groups/{slug}/me/wishlist/{id}` | Bearer participante | Edita o quita un producto mío (el de otra persona responde 404) |
| `GET /groups/{slug}/me/assignment/wishlist` | Bearer participante | Wishlist de **mi** receptor |
| `GET /groups/{slug}/me/products?q=&min_price=&max_price=&audience=&page=` | Bearer participante (30/min) | Busca productos para la wishlist; `page` de 1 a 5 (cada página trae hasta 40 productos y cuesta 2 créditos; `meta.has_more` indica si hay otra). Responde 503 `SEARCH_UNAVAILABLE` si no hay proveedor real configurado |

### Seguridad (lo que hace que el sorteo siga siendo secreto)
- Ningún endpoint devuelve `receiver_id`, PIN ni tokens salvo `me/assignment` con *tu propio* token.
- `admin_token` se guarda hasheado; el PIN con `Hash::make`; límite de intentos en PIN para frenar la fuerza bruta.
- El nombre se reclama con un `UPDATE ... WHERE claimed_at IS NULL`, así dos personas no pueden quedarse con el mismo.
- El token viaja como `Authorization: Bearer`. El `claim_token` se guarda tal cual para poder devolverlo al volver a entrar con el PIN.

### Algoritmo de sorteo
Se usa una **permutación cíclica aleatoria** (algoritmo de Sattolo) en `Group::drawAssignments()`, con `random_int`: se barajan los participantes y cada uno le regala al siguiente, y el último al primero. Así nadie se toca a sí mismo y no hay parejas cerradas. Con exclusiones y regalos fijos (hecho en la fase 9) las parejas fijas se pegan en cadenas (José→Ana→Luis es un bloque) y el azar solo ordena los bloques; se prueban barajadas al azar y, si no basta, una búsqueda con presupuesto de pasos (ordena por menos salidas); si no encuentra ciclo responde 422 `NO_VALID_DRAW`.

### Estructura de carpetas
```
src/
  main.jsx, App.jsx (router)
  lib/api.js (cliente fetch de la API), lib/session.js (tokens en localStorage), lib/format.js
  components/  Avatar.jsx (con anillo), StoryRing.jsx, Button.jsx, Field.jsx, Sheet.jsx (bottom sheet), StatRow.jsx
  features/
    create/   CreateWizard.jsx, StepDetails, StepTheme, StepPeople, StepReview
    group/    GroupHome.jsx (perfil del grupo), WhoAreYou.jsx, PinSheet.jsx
    reveal/   RevealStory.jsx
    wishlist/ WishlistGrid.jsx, ItemForm.jsx, ItemDetail.jsx
    admin/    AdminPanel.jsx, ShareCard.jsx
(backend en el proyecto Laravel aparte; la validación de temática con IA, v2, sería un endpoint ahí)
```

---

## 3. Dirección de diseño: "Instagram"

> **Dirección vigente (reemplaza el estilo Instagram descrito abajo, que queda como historial).**
> Estilo gráfico del manual de marca de Choumi + distribución de drawnames:
> - **Color:** cacao `#573A32`, rosa `#BF7E82`, rosa claro `#FFDCE8`, crema `#F5ECE3` y papel `#FAF6F3`. El modo oscuro usa el mismo cacao como fondo (`#2B1D19`) con texto crema.
> - **Tipografía:** Itim para títulos, nombres y notas; Alpino para lectura; Gaegu solo en el logotipo y los números grandes. Gaegu (la del manual) **no tiene vocales acentuadas, ñ, ¿ ni ¡**, así que no sirve para texto en español; Itim es la manuscrita más parecida con español completo.
> - **Formas:** manchas orgánicas, ilustraciones de línea café hechas en SVG (regalos, corazones, destellos, lazos), avatares en forma de mancha y tarjetas redondeadas con sombra suave.
> - **Distribución:** en escritorio, dos columnas (tarjeta de formulario a la izquierda, ilustración a la derecha). El progreso del asistente es una fila de regalitos sobre una barra. El panel de admin usa secciones numeradas.
> - **Marca provisional:** "lazito". No se usa ningún logo, ilustración ni marca de las referencias.


### 3.1 Lo que encontré de Instagram
- **El gradiente es la base del sistema de color** (visual refresh de 2022) y dentro de la app aparece sobre todo en los **anillos de stories** y en Create Mode. Instagram no publica los hex oficiales. Los valores que se usan abajo son la paleta de 5 colores que más se cita.
- **Tipografía:** Instagram Sans (Colophon Foundry), un remix de grotesca y geométrica. Después se agregaron **Instagram Pen** (manuscrita) e Instagram Mono. **No tienen licencia para usarse en web**, así que hay que sustituirlas.
- **UI de la app:** casi monocromática (blanco/negro y grises). El color se reserva para el **azul de acción `#0095F6`**, el rojo del like y el gradiente en los anillos. El modo oscuro usa negro puro `#000` con superficies `#121212`/`#262626`.
- **Patrones reconocibles:** fila de stories con anillo, cabecera de perfil con stats en columnas, grid de 3 columnas, bottom sheets, story a pantalla completa con barras de progreso arriba y botones sólidos azules con radio de 8px.

### 3.2 Tokens de color

| Token | Claro | Oscuro | Uso |
|---|---|---|---|
| `--bg` | `#FFFFFF` | `#000000` | Fondo |
| `--surface` | `#FAFAFA` | `#121212` | Inputs, sheets |
| `--separator` | `#DBDBDB` | `#262626` | Bordes de 1px |
| `--text` | `#000000` | `#F5F5F5` | Texto principal |
| `--text-2` | `#737373` | `#A8A8A8` | Texto secundario |
| `--action` | `#0095F6` | `#0095F6` | Botón primario y links |
| `--action-press` | `#1877F2` | `#1877F2` | Hover/pressed |
| `--danger` | `#ED4956` | `#ED4956` | Errores, "pasa del tope" |

**Gradiente de marca (solo anillos y revelación):**
```css
--ig-gradient: linear-gradient(45deg,
  #FEDA75 0%, #FA7E1E 25%, #D62976 50%, #962FBF 75%, #4F5BD5 100%);
```

### 3.3 Tipografía
- **UI y títulos: `Plus Jakarta Sans`** (Google Fonts), con pesos 400, 600 y 800. Es lo más parecido a Instagram Sans que se puede usar gratis: una grotesca con aperturas geométricas y un 800 con personalidad para los titulares. Fallback: `-apple-system, Roboto, system-ui`.
- **Manuscrita: `Caveat`**, en lugar de Instagram Pen. Se usa **solo** en las notas de la wishlist ("talla M porfa 🙏") y en el nombre revelado de la story, como el texto que alguien escribe sobre una story.
- **Escala** (base 16px, razón 1.25): 13 (meta) / 14 (UI densa, como Instagram) / 16 (cuerpo) / 20 / 25 / 31 / 39 (titular de la revelación: 48–64px en Caveat).
- Todo en *sentence case* y sin etiquetas en mayúsculas.

### 3.4 Layout
Mobile-first, con una columna de **máx. 470px centrada** (el ancho del feed de Instagram) y alineación a la izquierda, salvo la story de revelación, que va centrada. En desktop la columna se queda centrada sobre `--bg` y no se estira.

**Home del grupo (como un perfil):**
```
┌─────────────────────────────┐
│ Navidad oficina        ⋯    │  ← header 44px, nombre en 600
├─────────────────────────────┤
│ ◉◉   12          $300   11  │  ← avatar del grupo con anillo gradiente
│ ◉◉  personas     tope   días│     + 3 stats en columnas (como posts/seguidores)
│ Temática: Pijamas 🎄         │
│ "Afelpadas, talla real"     │
│ [   Ver a quién le regalo  ]│  ← botón azul sólido
├─────────────────────────────┤
│ (A)(L)(M)(R)(S)(T) →        │  ← fila tipo stories: anillo gradiente = ya entró,
│ Ana Luis Mar Rob Sof Tere   │     anillo gris = todavía no
├─────────────────────────────┤
│  ▦ Mi wishlist │ ♡ Su wishlist│ ← tabs con ícono, como el perfil
├────────┬────────┬───────────┤
│  img   │  img   │   img     │  ← grid de 3 columnas, gap 2px, cuadros 1:1
├────────┼────────┼───────────┤
│  img   │   +    │           │  ← el "+" agrega un item
└────────┴────────┴───────────┘
```

**Wizard de creación:** una pregunta por pantalla, barra de progreso segmentada arriba (reutilizando el lenguaje de la story) y botón "Siguiente" fijo abajo.

**Agregar item:** bottom sheet con handle y chip de temática fijo arriba.

### 3.5 El momento memorable: la story de revelación
Es el único lugar donde el diseño se permite ser ruidoso; el resto de la app queda en monocromo disciplinado.

1. Pantalla negra a pantalla completa con **barras de progreso** arriba, como una story real (3 segmentos).
2. **Segmento 1 (2s):** "Navidad oficina" junto con la fecha, sobre un fondo que poco a poco se llena del gradiente.
3. **Segmento 2 (mantener para revelar):** un regalo o círculo con el texto "Mantén presionado". Al presionar, el **anillo gradiente gira y se va cerrando**. Si se suelta antes, se pausa, igual que pausar una story.
4. **Segmento 3:** el anillo explota en confetti con los 5 colores del gradiente y aparece el avatar de la persona con "Le regalas a" en Plus Jakarta y **el nombre en Caveat a 56px**, ligeramente rotado (−3°), como texto escrito sobre una story.
5. Botón al final: "Ver su wishlist".

Respetar `prefers-reduced-motion`: en ese caso se omiten el giro y el confetti, y se usa un fade simple.

### 3.6 Revisión del plan contra el brief (y qué cambié)
- **Primer borrador:** el gradiente en todos los botones y tarjetas. Era el "kit SaaS con gradientes" genérico y además **no es Instagram**, que es casi todo blanco y negro. **Lo cambié:** el gradiente vive solo en los anillos y en la revelación, y las acciones usan el azul sólido.
- **Primer borrador:** tarjetas con sombra para cada item de la wishlist. **Lo cambié:** un grid 3×N sin sombras ni radio con gap de 2px, que es el grid de perfil y se reconoce al instante.
- **Primer borrador:** stats "12 personas · $300 · 4 dic" en una línea con puntos medios. **Lo cambié:** columnas de stats como el perfil de Instagram (número en 600 y etiqueta debajo).
- Para no caer en una copia: no se usan el logo, el nombre ni los íconos de Instagram, solo su gramática visual. El nombre y el ícono de la app son propios.

### 3.7 Microcopy (español MX)
- Botones: "Crear intercambio", "Agregar participante", "Hacer sorteo", "Copiar enlace", "Compartir por WhatsApp", "Agregar a mi wishlist".
- Vacío de la wishlist: "Agrega lo que te gustaría recibir. Que sea de *Pijamas* y no pase de $300."
- Error de temática: "Esto no parece de la temática Pijamas. Elige una categoría o cambia el item."
- Nombre ya reclamado: "Luis ya entró. Si eres Luis, entra con tu PIN."

---

## 4. Fases de implementación

| # | Fase | Entregable | Est. |
|---|---|---|---|
| 0 | **Setup** | Limpiar el scaffold, instalar `react-router motion`, instalar Tailwind v4 y definir los tokens en `@theme` dentro de `src/index.css` (claro/oscuro), cargar fuentes, poner `lang="es"`, proxy `/api` de Vite hacia Laravel | 0.5 d |
| 1 | **Backend (Laravel API)** | Migraciones, modelos, API `/api/v1`, sorteo en el servidor y tests (hecho hasta la fase 5; la wishlist y el panel admin agregan endpoints) | 1 d |
| 2 | **Componentes base** | Avatar con anillo (gradiente/gris), Button, Field, Sheet, StatRow y barra de progreso segmentada | 1 d |
| 3 | **Crear grupo** | Wizard de 4 pasos, alta de participantes uno por uno, categorías de temática, `create_group` + `draw` y pantalla de "¡Listo!" con los 2 enlaces | 1.5 d |
| 4 | **Compartir** | Copiar enlace, Web Share API (`navigator.share`), `wa.me/?text=` y meta tags OG para que el preview en WhatsApp se vea bien | 0.5 d |
| 5 | **Unirse y revelar** | "¿Quién eres?", PIN, sesión en localStorage, **story de revelación** y re-login desde otro dispositivo | 2 d |
| 6 | **Wishlist** | Grid, formulario en sheet con categoría obligatoria y aviso de presupuesto, detalle del item y la vista de la wishlist de tu asignado | 1.5 d |
| 7 | **Panel admin** | Quién ha entrado y quién ha visto, editar datos, re-sortear (solo si nadie ha revelado) y reenviar el enlace | 1 d |
| 8 | **Pulido** | Modo oscuro, foco visible, `prefers-reduced-motion`, estados vacíos y de error, prueba en un móvil real y deploy | 1 d |
| 9 | *(v2)* | **Exclusiones: hecho.** Pendientes: validación de temática con Claude y recordatorios (necesitan clave de API y proveedor de envío) | — |

**Total MVP: unos 10 días de trabajo.**

### Criterios de "listo" del MVP
- [ ] Crear un grupo de 3+ personas y obtener el enlace.
- [ ] Abrir el enlace en otro dispositivo, reclamar un nombre y ver la revelación.
- [ ] Ninguna petición desde el navegador regresa asignaciones ajenas (verificado en Network).
- [ ] La wishlist rechaza items sin categoría de la temática y avisa si pasan del tope.
- [ ] Se ve bien a 360px y en modo oscuro, y funciona con teclado.

---

## 5. Decisiones pendientes (con mi recomendación)
1. **¿Cuentas de usuario?** No: los enlaces con token y el PIN bastan y quitan fricción, como en drawnames.
2. **¿Cómo validar la temática?** Con categorías definidas por el admin en el MVP y la IA como mejora.
3. **¿Backend?** Laravel 13 solo-API con SQLite (ya existía el proyecto). Se descartó Supabase para mantener la lógica del sorteo en PHP y no depender de cuentas externas.
4. **¿El admin puede ver el sorteo completo?** No por defecto. Si se necesita, se puede agregar "revelar todo" después de la fecha del evento.

---

## 6. Convención de estilos (Tailwind)
- **Solo utilidades de Tailwind en el JSX.** No hay CSS Modules ni archivos `.css` por componente; `src/index.css` solo contiene `@import 'tailwindcss'` y los tokens.
- Modo oscuro: los tokens de color cambian solos con `prefers-color-scheme` (variables en `:root`), así que casi nunca hace falta `dark:`.
- Animaciones de la revelación con `motion`; para el resto, `motion-reduce:` y `transition` de Tailwind.
- Cuando un patrón se repite (botón, campo), se extrae a un **componente React**, no a una clase con `@apply`.
- Los keyframes que Tailwind no trae (giro del anillo) se declaran en `@theme` como `--animate-*`.

---

## 7. Estado (fases 0 a 8 hechas)

Hecho y verificado: asistente de creación, sorteo en el servidor, unirse con PIN, revelación tipo story, wishlist con temática, panel de admin y pulido (modo oscuro, foco visible, `prefers-reduced-motion`, estados de carga y de error, página 404, títulos de página, contraste AA). Backend: 70 tests con Pest; el frontend se revisó con capturas en móvil (390px), claro y oscuro.

### Pendiente para publicar
- **Hosting.** La web (SPA) y la API (Laravel) pueden ir en el mismo dominio o en dos. Con dominios distintos: `VITE_API_URL` en el frontend y `FRONTEND_URL` en Laravel (CORS ya está configurado). La SPA necesita que el hosting redirija cualquier ruta a `index.html`.
- **Laravel en producción:** `APP_ENV=production`, `APP_DEBUG=false`, base de datos con disco persistente (SQLite) o MySQL/Postgres, y `php artisan migrate --force`.
- **Vista previa en WhatsApp:** al ser una SPA, el enlace de invitación muestra el título genérico. Personalizarla exige renderizar las meta tags en el servidor.
- **Probar en un móvil real** (teclado, safe-area, gesto de mantener presionado).

### Límites conocidos
- La asignación se marca como "vista" al abrir la story, no al terminar el gesto de mantener presionado. Quien cierre la pestaña a la mitad va directo al home la próxima vez (puede repetirla con "Ver a quién le regalo").
- No se pueden agregar ni quitar participantes después de sortear.
- Las imágenes de la wishlist se pegan por URL; no hay subida de archivos.

### Buscador de productos (estado)
- **Hecho:** interfaz `ProductSearchProvider`, endpoint con caché de 10 min, límite de uso y una **página propia `/g/:slug/buscar`** (búsqueda y filtro de precio arriba, loader de esqueletos, cuadrícula de resultados con "Ver más resultados", chips "Para quién es" (Todos/Hombre/Mujer/Niños, que se agrega a la búsqueda) y rango de precio ("Hasta" arranca en el tope del grupo; cambiarlo no gasta créditos), botón "Agregar" de un clic en cada tarjeta, panel "Mi wishlist" al lado y la búsqueda guardada en `?q=`). El formulario del modal quedó solo para agregar o editar "a mano".
- **Proveedor actual:** Google Shopping vía **serper.dev** (`PRODUCT_SEARCH_DRIVER=serper`, clave en `SERPER_API_KEY` del `.env`). Con driver `fake` queda el catálogo de ejemplo, solo en `local` y `testing`; con cualquier otro valor o sin clave, el buscador responde 503 y la app sigue con "A mano".
- **Enlaces:** Serper no entrega enlaces directos a la tienda. Los resultados traen un enlace de Google a la ficha del producto (unos 2 de cada 3) y para el resto se arma una búsqueda en Google Shopping por el nombre. El `productId` de Serper **no** abre una página de producto, así que no se usa. Los botones dicen "Ver en Google Shopping".
- **Consumo:** cada llamada real se registra en `product_search_logs`; los resultados se guardan 10 min por búsqueda (cambiar el filtro de precio no gasta créditos). Tope duro: `PRODUCT_SEARCH_CREDIT_LIMIT` (2000); al llegar, el buscador deja de llamar al proveedor. Para ver el uso: `php artisan product-search:usage` (muestra lo gastado por la app, lo que queda y el saldo real de serper.dev).
- **Alternativa pendiente:** Mercado Libre. Pide registrar una aplicación y la cuenta no tenía permiso de desarrollador (su panel responde "No tenés permiso para crear aplicaciones"); la alternativa es Google Shopping vía SerpApi. Se elige con `PRODUCT_SEARCH_DRIVER` en el `.env` del servidor y una clase nueva en `app/Services/ProductSearch/`.
