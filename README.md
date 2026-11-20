# ChifaWok

**Sistema web de gestión de pedidos con asistente de voz (Mei) para el restaurante Chifa Wok.**

ChifaWok es una aplicación web en Angular que permite a los comensales consultar la carta, armar su pedido en un carrito o **dictarlo por voz a Mei**, y seguir su estado. El personal (Chef / Administrador) recibe los pedidos en un monitor de cocina (KDS), cambia su estado y gestiona productos, clientes y métricas del asistente de voz.

> **Avance académico.** Esta versión es un frontend demostrativo: funciona completamente en el navegador con datos guardados en `LocalStorage`. No incluye backend, base de datos ni motor de IA externo (ver [Estado del proyecto](#estado-del-proyecto)).

---

## Tabla de contenidos

1. [Objetivo](#objetivo)
2. [Tecnologías](#tecnologías)
3. [Requisitos previos](#requisitos-previos)
4. [Instalación y ejecución](#instalación-y-ejecución)
5. [Compilación y pruebas](#compilación-y-pruebas)
6. [Cuentas de demostración](#cuentas-de-demostración)
7. [Funcionalidades](#funcionalidades)
8. [Pedidos por voz con Mei](#pedidos-por-voz-con-mei)
9. [Recorrido sugerido para la demostración](#recorrido-sugerido-para-la-demostración)
10. [Arquitectura y estructura](#arquitectura-y-estructura)
11. [Almacenamiento local](#almacenamiento-local)
12. [Estado del proyecto](#estado-del-proyecto)
13. [Flujo de trabajo en GitHub](#flujo-de-trabajo-en-github)

---

## Objetivo

**Contexto.** Chifa Wok es un restaurante de comida fusión peruano-china en Lima cuyas líneas telefónicas se saturan en horas punta. El proyecto propone automatizar la toma de pedidos mediante una plataforma web con un asistente conversacional de voz.

**Objetivo académico de este avance.** Construir y demostrar el frontend del sistema:

- Carta digital con búsqueda y filtros, carrito y registro de pedidos.
- Toma de pedidos por voz en español con la Web Speech API del navegador.
- Panel administrativo para gestionar pedidos, productos, clientes y métricas de voz.
- Control de acceso por rol (Comensal / Chef-Administrador).

La arquitectura completa descrita en el documento del proyecto (API REST en Spring Boot, microservicio de IA en FastAPI/LangChain y PostgreSQL) corresponde a etapas posteriores y **no forma parte de este repositorio**.

---

## Tecnologías

Tecnologías y versiones realmente utilizadas en este repositorio:

| Tecnología | Versión | Uso |
|---|---|---|
| Angular (componentes standalone, Signals, Router, Forms) | 18.2.14 | Framework de la aplicación |
| Angular CLI | 18.2.21 | Servidor de desarrollo y compilación |
| TypeScript | 5.5.4 | Lenguaje |
| Tailwind CSS (+ PostCSS, Autoprefixer) | 3.4.19 | Estilos y diseño responsive |
| RxJS | 7.8.2 | Eventos del router |
| Web Speech API | Navegador | Reconocimiento (STT) y síntesis (TTS) de voz para Mei |
| Web Crypto API | Navegador | Hash SHA-256 de contraseñas de cuentas registradas |
| LocalStorage / SessionStorage | Navegador | Persistencia de la demostración |
| `node:test` + `tsc` | Node.js | Pruebas unitarias (sin dependencias adicionales) |
| GitHub Actions | — | Validación automática de PR (`npm ci`, `npm test`, `npm run build`) |

---

## Requisitos previos

| Herramienta | Versión recomendada | Notas |
|---|---|---|
| **Node.js** | **22 LTS** (también 20.11+) | Definida en `.nvmrc`. Angular 18 no incluye Node 24 en su tabla de compatibilidad: con Node 24 la app compila y se ejecuta, pero npm muestra el aviso `EBADENGINE` y el overlay de errores del servidor de desarrollo puede fallar. |
| npm | 10 o superior | Incluido con Node.js 20/22 |
| Git | Cualquier versión reciente | Para clonar el repositorio |
| Navegador | **Google Chrome** o **Microsoft Edge** actualizados | Necesarios para hablar con Mei (Web Speech API). Firefox no ofrece reconocimiento de voz y Safari no se ha probado: en ellos Mei funciona con texto. |
| Micrófono | Integrado o externo | Solo para pedidos por voz; requiere conexión a Internet (el reconocimiento de Chrome/Edge usa servicios en línea). |

---

## Instalación y ejecución

Los comandos funcionan en PowerShell (Windows), Git Bash, macOS y Linux.

```bash
# 1. Clonar el repositorio
git clone https://github.com/Casey1304/ChifaWok.git

# 2. Entrar al proyecto y usar la rama de integración
cd ChifaWok
git switch dev

# 3. Instalar dependencias exactamente como en package-lock.json
npm ci

# 4. Iniciar el servidor de desarrollo
npm start
```

5. Abrir **http://localhost:4200** en Chrome o Edge.

- No se requieren variables de entorno ni archivos `.env`.
- `npm start` escucha en `0.0.0.0:4200`, por lo que también se puede abrir desde otro dispositivo de la misma red (por IP). El micrófono solo funciona en `localhost` o en sitios `https`.
- Si cambias a una rama antigua que todavía versionaba `node_modules`, vuelve a ejecutar `npm ci` al regresar.

---

## Compilación y pruebas

| Comando | Qué hace |
|---|---|
| `npm start` | Servidor de desarrollo en http://localhost:4200 con recarga automática |
| `npm test` | Compila las pruebas (`src/**/*.spec.ts`) con `tsc` y las ejecuta con `node --test` |
| `npm run build` | Compilación de producción en `dist/chifawok/browser` |
| `npm run watch` | Compilación de desarrollo continua |

Las pruebas unitarias cubren la lógica sin interfaz:

- Intérprete de pedidos de Mei: cantidades, plurales, platos inexistentes y ambigüedades.
- Cálculo de totales con IGV incluido.
- Normalización de búsquedas sin tildes y filtros de la carta.
- Redirecciones permitidas por rol, credenciales demo, hash de contraseñas y exportación CSV.

Cada Pull Request hacia `dev` o `main` ejecuta automáticamente instalación, pruebas y compilación con Node 22 (`.github/workflows/validacion.yml`).

---

## Cuentas de demostración

Credenciales **públicas y exclusivas del entorno de demostración** (no son datos reales). También se cargan con los botones de acceso rápido de la pantalla de inicio de sesión.

| Rol | Correo | Contraseña |
|---|---|---|
| Comensal VIP | `carlos.mendoza@email.pe` | `Comensal2025` |
| Chef / Administrador | `gerencia@chifawok.pe` | `ChifaSabor2025` |

También puedes crear una cuenta de comensal en **/registro**. Su contraseña se guarda como hash SHA-256 con sal y se verifica al iniciar sesión.

---

## Funcionalidades

### Comensal

- **Carta** con buscador en vivo (ignora tildes y mayúsculas: `tallarin` encuentra «Tallarín») y filtros por categoría combinables.
- **Carrito**: agregar platos, cambiar cantidades, eliminar, elegir delivery / para llevar / salón y añadir notas.
- **Totales con IGV incluido**: el total es la suma de los precios de la carta y se desglosa la operación gravada y el IGV (18 %).
- **Confirmación del pedido**, que exige sesión de comensal; si no la hay, el carrito se conserva y se pide iniciar sesión.
- **Mis Pedidos**: pedido activo con su estado (Recibido, En wok, Listo, Entregado) e historial, solo del comensal autenticado. Incluye «Repetir pedido».
- **Hablar con Mei**: pedido por voz o por texto, con resumen previo para revisar y confirmar.
- **Registro**, inicio y cierre de sesión, con la opción «Recordarme».

### Chef / Administrador

- **Monitor de pedidos (KDS)**: columnas Nuevos, En wok y Listos. Permite pasar a cocina, marcar listo, confirmar entrega y cancelar con motivo. Muestra el canal de origen (Voice AI o Web), alertas de stock bajo y el feed de sesiones de voz enlazadas a su pedido.
- **Gestión de productos**: buscar, filtrar por categoría, crear, editar (incluidos los sinónimos de voz que usa Mei), pausar o reactivar y eliminar.
- **Clientes & CRM**: búsqueda por nombre, correo, teléfono o distrito; filtro por nivel; ficha del cliente; exportación a CSV.
- **Métricas de voz**: precisión media del reconocimiento, duración, conversión de sesión a pedido, platos más pedidos por voz, jerga detectada y pedidos por canal (todo calculado a partir de los datos guardados). Exportación de sesiones a CSV.
- **Configuración**: estado de la Web Speech API en el navegador, prueba real de conectividad con una URL de backend y restablecimiento de los datos demo.
- Las rutas `/admin/*` están protegidas por rol. El panel se adapta a tablet y móvil con un menú lateral desplegable.

---

## Pedidos por voz con Mei

**Flujo:** el comensal habla → el navegador transcribe → Mei interpreta contra la carta → el comensal revisa el resumen y confirma → se registra el pedido → aparece en «Mis Pedidos» y en el KDS del administrador, con la sesión de voz enlazada.

**Cómo usarlo**

1. Inicia sesión como comensal y pulsa **Hablar con Mei**.
2. Pulsa **Iniciar Escucha** y permite el micrófono cuando el navegador lo pida.
3. Di tu pedido, por ejemplo:
   - «Quiero dos chaufas especiales y una Inka Kola».
   - «Dame un tallarín saltado y dos gaseosas».
   - «Quiero un chaufa especial y una sopa».
4. Revisa los platos, cantidades y total, y pulsa **Confirmar Pedido**.

**Cómo interpreta Mei**

Mei usa reglas locales en `src/app/utils/interprete-pedido.util.ts`, sin modelo de lenguaje ni servicios externos. La fuente de verdad es la carta real, con los nombres y los **sinónimos de voz** de cada plato, que se editan en Gestión de Productos.

1. **Coincidencia exacta.** Normaliza tildes, mayúsculas, plurales y alias de transcripción («inca colas», «won ton», «tipa kai»). Los platos así reconocidos se agregan directamente con su cantidad («dos», «3», «par», «media docena»).
2. **Búsqueda aproximada.** Lo que no coincide exactamente se compara con una *clave fonética*: une las palabras y aplica equivalencias del español, como c/qu/k, z/s, ll/y, h muda y letras dobles. Luego mide la similitud con la distancia de Levenshtein. Así, «pollo tip packay» se acerca a «Pollo Tipa Kay».
3. **Niveles de confianza** (calibrados con la carta real en las pruebas):
   - **Alta (≥ 0,80 y ventaja ≥ 0,12 sobre la segunda opción):** Mei pregunta «¿Te refieres a…?» y el plato se agrega solo si el comensal lo elige. La máxima similitud medida entre dos platos distintos de la carta es 0,74.
   - **Media (0,60–0,80) o palabra genérica** («quiero un pollo», «dos chaufas»): muestra hasta 4 opciones de la carta.
   - **Baja (< 0,60):** no sugiere nada y pide repetir o escribir el plato.
4. **Nunca inventa platos.** Ante «tres chaufas de pollo» o «lomo saltado» informa que no están en la carta y ofrece platos parecidos. Los platos pausados no se sugieren.

**Selector de sugerencias.** Las dudas aparecen como tarjetas seleccionables dentro de la conversación, con la opción «Ninguno de estos». Al elegir una, el plato pasa al resumen con la cantidad que se entendió. Los demás platos de la frase se conservan.

En el resumen se pueden cambiar cantidades, eliminar platos o seguir hablando para agregar más. **Confirmar Pedido** solo se habilita cuando no quedan dudas, y registra el pedido una sola vez. Mei muestra «Pedido registrado», con accesos a «Ver Mis Pedidos» y a «Hacer otro pedido».

Si el micrófono está bloqueado, no hay voz o no hay conexión, Mei muestra el motivo y permite escribir el pedido.

**Requisitos:** Chrome o Edge, permiso de micrófono, conexión a Internet y abrir la app en `localhost` o `https`.

---

## Recorrido sugerido para la demostración

1. **Comensal:** abre http://localhost:4200, entra a «Ingresar» y elige **Comensal VIP** → Iniciar Sesión.
2. En **Nuestra Carta**, busca `tallarin`, filtra por **Saltados** y limpia los filtros.
3. Agrega dos platos al carrito, cambia las cantidades y muestra el total con IGV incluido. Confirma el pedido.
4. Abre **Hablar con Mei** y dicta: «Quiero dos chaufas especiales y una Inka Kola». Muestra el resumen y confirma.
5. En **Mis Pedidos** aparecen el pedido activo y su estado. Cierra sesión.
6. **Administrador:** inicia sesión como **Chef / Admin**. En el **Monitor de Pedidos** localiza el pedido «Voice AI», pásalo a cocina, márcalo listo y entrégalo. Muestra en el feed la transcripción enlazada al pedido.
7. En **Gestión de Productos**, busca un plato y pausa o edita uno. En **Clientes & CRM**, busca `carlos`.
8. En **Métricas & Voice AI**, muestra los indicadores calculados y la última sesión de voz. Cierra sesión.
9. Vuelve a entrar como comensal: el pedido muestra su nuevo estado y los datos persisten tras recargar (F5).

> El comensal y el administrador deben usar **el mismo navegador** en la demostración, porque los datos se guardan en el `LocalStorage` de ese navegador. Para empezar desde cero: botón **Modo Demo → Restaurar datos originales** (esquina inferior izquierda) o **Configuración → Reiniciar Todo**.

---

## Arquitectura y estructura

Aplicación Angular 18 de una sola página con componentes *standalone*, estado reactivo con **Signals** y servicios que persisten en `LocalStorage`.

```
ChifaWok/
├── .github/workflows/validacion.yml   # CI: npm ci, pruebas y compilación
├── public/                            # Recursos estáticos (logo)
├── src/
│   ├── index.html, main.ts, styles.css
│   └── app/
│       ├── app.config.ts / app.routes.ts / app.component.ts
│       ├── components/   # navbar, cart-drawer, voice-modal (Mei), admin-sidebar, toast, demo-badge
│       ├── pages/        # home, carta, login, registro, mis-pedidos, admin-* (pedidos, productos, clientes, métricas, configuración)
│       ├── services/     # auth, cart, pedidos, productos, clientes, métricas, voice-ai, notification, storage
│       ├── guards/       # adminGuard: protege /admin/* por rol
│       ├── interceptors/ # auth.interceptor: añade el token simulado (sin API real todavía)
│       ├── models/       # Producto, Pedido, Cliente, Usuario, SesionVoz, Categoría
│       └── utils/        # Funciones puras con pruebas: intérprete de Mei, totales/IGV, búsqueda, CSV, hash
├── tsconfig.spec.json                 # Configuración de las pruebas unitarias
├── .nvmrc                             # Node 22 LTS
└── package.json
```

**Rutas**

| Ruta | Acceso | Pantalla |
|---|---|---|
| `/` | Público | Inicio |
| `/carta` | Público (confirmar pedido requiere comensal) | Nuestra Carta |
| `/mis-pedidos` | Comensal autenticado | Seguimiento e historial |
| `/login`, `/registro` | Público | Acceso y registro |
| `/admin/pedidos`, `/admin/productos`, `/admin/clientes`, `/admin/metricas`, `/admin/configuracion` | Solo administrador (`adminGuard`) | Panel administrativo |

**Backend:** no existe en este repositorio. La pantalla de Configuración permite registrar la URL prevista y comprobar si responde, pero la aplicación no consume esa API.

---

## Almacenamiento local

`StorageService` guarda todo en el `LocalStorage` del navegador con el prefijo `chifawok_`. En la primera visita carga datos de demostración: 11 platos, pedidos, 5 clientes, sesiones de voz y las 2 cuentas demo.

| Clave | Contenido |
|---|---|
| `chifawok_productos` | Carta e inventario |
| `chifawok_pedidos` | Pedidos y sus estados |
| `chifawok_clientes` | Directorio de clientes |
| `chifawok_sesiones_voz` | Sesiones con Mei (transcripción, confianza, pedido asociado) |
| `chifawok_usuarios` / `chifawok_credenciales` | Cuentas registradas y hash con sal de sus contraseñas |
| `chifawok_current_user` | Sesión con «Recordarme» (sin marcar se usa `sessionStorage`) |
| `chifawok_cart_items` | Carrito en curso |

Consecuencias: los datos viven **solo en ese navegador y equipo**, no se comparten entre dispositivos y se pierden al borrar los datos del sitio.

---

## Estado del proyecto

### Implementado y verificado en esta versión

- Inicio y cierre de sesión repetidos con ambos roles, «Recordarme», restauración de sesión y protección de rutas por rol.
- Carta con búsqueda sin tildes, filtros combinables y barra de categorías con desplazamiento horizontal.
- Carrito, totales con IGV incluido, pedidos asociados al comensal, «Mis Pedidos» y gestión completa en el KDS.
- Mei: interpretación exacta y aproximada contra la carta, selector de sugerencias, corrección de cantidades, confirmación sin duplicados, segundo pedido sin recargar y enlace sesión→pedido. Verificado con transcripciones inyectadas en los manejadores del reconocimiento de voz y con texto. La captura con micrófono físico la validó el equipo en Chrome.
- CRUD de productos, búsqueda y exportación de clientes, métricas calculadas y panel adaptado a escritorio, tablet y móvil.

### Limitaciones conocidas

| Tema | Situación |
|---|---|
| Backend y base de datos | No implementados. Todo es local al navegador; no es una base multiusuario. |
| Seguridad | Autenticación demostrativa en el cliente: los tokens son simulados y quien controla el navegador puede leer o alterar los datos locales. El hash de contraseñas y la validación de rol al restaurar la sesión mitigan abusos simples, pero **no equivalen** a la seguridad de un servidor. |
| Mei | Interpretación por reglas locales y similitud fonética, sin LLM: comprende pedidos de la carta, no conversación libre. Los umbrales están calibrados para la carta actual; si se agregan platos con nombres muy parecidos, conviene repetir la calibración (`npm test`). La captura de voz depende de Chrome/Edge e Internet. |
| Dependencias | `npm audit` reporta vulnerabilidades en Angular ≤ 19.2.25 (8 en dependencias de producción) y en herramientas de compilación. La app no usa las funciones afectadas (i18n, SSR, `HttpClient`, `formatDate`, SVG o HTML dinámico). La corrección requiere migrar Angular a una versión mayor (tarea pendiente). |
| Datos de ejemplo | Los pedidos semilla conservan importes históricos fijos; los pedidos nuevos usan el cálculo con IGV incluido. |
| Notificaciones | El cupón del CRM genera un código; no hay envío real por SMS ni WhatsApp. |

---

## Flujo de trabajo en GitHub

| Rama | Uso |
|---|---|
| `main` | Versión estable. Solo se actualiza desde `dev` tras revisión. |
| `dev` | Integración de cambios validados. |
| `feat/<descripcion>` | Nuevas funcionalidades; nacen de `dev` actualizada. |
| `fix/<descripcion>` | Correcciones; nacen de `dev` actualizada. |

- Commits con **Conventional Commits en español**, por ejemplo: `fix(mei): corregir cantidades interpretadas`, `docs(readme): documentar instalación`.
- Todo cambio entra por **Pull Request hacia `dev`**. La validación automática (pruebas y compilación) debe pasar antes de integrar.
- Nunca se hace push directo a `main` ni a `dev`.
