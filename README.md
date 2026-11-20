# 🍜 ChifaWok

### Sistema web de gestión de pedidos con asistente de voz inteligente

**ChifaWok** es una plataforma web diseñada para digitalizar y optimizar la gestión de pedidos de un restaurante de gastronomía peruano-china. Integra una experiencia de compra para clientes, herramientas administrativas para el personal y un asistente de voz denominado **Mei**, orientado a facilitar la interacción con el sistema mediante lenguaje natural.

El proyecto combina una interfaz moderna y adaptable con una arquitectura preparada para integrar servicios backend e inteligencia artificial.

---

## Descripción del proyecto

La gestión de pedidos en establecimientos gastronómicos requiere procesos rápidos, organizados y confiables. ChifaWok propone una solución tecnológica que centraliza la atención al cliente y la administración operativa en una misma plataforma.

El sistema permite explorar una carta digital, seleccionar productos, gestionar pedidos y consultar su estado. Asimismo, proporciona al personal administrativo herramientas para supervisar pedidos, administrar platos, consultar clientes y visualizar indicadores de rendimiento.

Como elemento diferenciador, incorpora **Mei**, un asistente de voz diseñado para interpretar solicitudes gastronómicas en español peruano y facilitar la creación de pedidos.

## Objetivos

**Objetivo general**

Desarrollar una plataforma web para optimizar la gestión de pedidos de ChifaWok mediante la digitalización de procesos y la incorporación de un asistente conversacional.

**Objetivos específicos**

- Facilitar la consulta y selección de productos mediante una carta digital.
- Centralizar el registro, seguimiento y administración de pedidos.
- Proporcionar herramientas para la gestión de productos y clientes.
- Incorporar interacción por voz para mejorar la experiencia del comensal.
- Ofrecer información operativa mediante un panel administrativo.
- Establecer una base tecnológica escalable para futuras integraciones.

---

## Tecnologías utilizadas

### Frontend

| Tecnología | Versión | Propósito |
|---|---|---|
| Angular | 18.2 | Framework principal |
| TypeScript | 5.5 | Desarrollo de lógica y componentes |
| Tailwind CSS | 3.4 | Diseño y estilos responsivos |
| Angular Router | 18.2 | Navegación y enrutamiento |
| RxJS | 7.8 | Programación reactiva |
| Angular Signals | Angular 18 | Gestión reactiva del estado |
| Web Speech API | API del navegador | Reconocimiento y síntesis de voz |
| LocalStorage | API del navegador | Persistencia local en modo demo |

### Tecnologías contempladas en la arquitectura

| Tecnología | Función prevista |
|---|---|
| Java 17 | Lenguaje del backend |
| Spring Boot 3.3.5 | Servicios REST y lógica de negocio |
| Spring Security / JWT | Seguridad y autenticación |
| PostgreSQL | Persistencia de datos |
| Python / FastAPI | Servicios de inteligencia artificial |
| LangChain | Orquestación de componentes de IA |

**Nota:** La implementación disponible corresponde al frontend Angular con funcionamiento demostrativo. La integración completa con los servicios externos forma parte de la arquitectura prevista.

---

## Módulos del sistema

### 1. Portal del cliente

Proporciona una interfaz intuitiva para explorar los servicios del restaurante y realizar pedidos.

**Funcionalidades principales:**

- Página de inicio con presentación del restaurante.
- Carta digital organizada por categorías.
- Visualización de información y precios de productos.
- Búsqueda y filtrado de platos.
- Carrito de compras.
- Selección de modalidad de atención.
- Registro e inicio de sesión.
- Consulta del historial de pedidos.
- Seguimiento de estados.
- Repetición de pedidos anteriores.

**Modalidades de atención:**

- Delivery.
- Para llevar.
- Consumo en salón.

### 2. Asistente de voz Mei

**Mei** es el asistente conversacional integrado en la experiencia del cliente.

Utiliza las capacidades de reconocimiento y síntesis de voz del navegador para permitir interacciones habladas.

**Características:**

- Reconocimiento de voz en español peruano (`es-PE`).
- Conversión de voz a texto.
- Interpretación demostrativa de solicitudes gastronómicas.
- Reconocimiento de nombres de platos, cantidades y preferencias.
- Confirmación del pedido antes de registrarlo.
- Generación de respuestas habladas.
- Alternativa de interacción mediante teclado.

El modo demostración incorpora reglas locales para interpretar expresiones habituales de los comensales.

La integración con un servicio avanzado de procesamiento de lenguaje natural está contemplada para futuras etapas.

### 3. Panel administrativo

El área administrativa centraliza la supervisión de las operaciones del restaurante.

**Gestión de pedidos**

- Visualización de pedidos recibidos.
- Organización de pedidos mediante un tablero Kanban.
- Actualización de estados de preparación.
- Seguimiento del flujo operativo.
- Consulta de detalles y observaciones.

**Gestión de productos**

- Registro de nuevos platos.
- Edición de información.
- Organización por categorías.
- Administración de precios.
- Control de disponibilidad.
- Configuración de información relacionada con el reconocimiento por voz.

**Gestión de clientes**

- Consulta del directorio de comensales.
- Visualización de perfiles.
- Segmentación de clientes.
- Consulta de preferencias e historial.

**Métricas y analítica**

- Indicadores de actividad.
- Información sobre pedidos.
- Estadísticas relacionadas con el asistente de voz.
- Visualización de datos para apoyar decisiones administrativas.

**Configuración**

- Panel de configuración del sistema.
- Referencias de conectividad con servicios backend.
- Herramientas de administración del entorno demostrativo.

---

## Arquitectura del sistema

ChifaWok contempla una arquitectura modular que separa la presentación, los servicios de negocio, la persistencia y los componentes de inteligencia artificial.

```text
                    CHIFAWOK
                        |
                 Angular Frontend
                        |
                  HTTP / REST
                        |
                Spring Boot API
                   /         \
                  /           \
            PostgreSQL      FastAPI
                                |
                         Servicios de IA
```

### Frontend

El cliente web está desarrollado con Angular y utiliza componentes reutilizables, servicios y rutas para organizar la aplicación.

### Backend previsto

Spring Boot se encargará de la lógica de negocio, autenticación, procesamiento de pedidos y comunicación con la base de datos.

### Servicio de inteligencia artificial previsto

FastAPI permitirá integrar servicios de interpretación de lenguaje natural y procesamiento de solicitudes conversacionales.

### Persistencia actual

Durante la etapa demostrativa, la información se gestiona mediante `LocalStorage`, permitiendo conservar cambios en el navegador sin depender de un servidor externo.

---

## Estructura del proyecto

La aplicación sigue una organización modular basada en Angular.

```text
chifawok/
│
├── public/
│
├── src/
│   ├── app/
│   │   ├── components/
│   │   ├── guards/
│   │   ├── interceptors/
│   │   ├── models/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── app.component.ts
│   │   ├── app.config.ts
│   │   └── app.routes.ts
│   │
│   └── ...
│
├── angular.json
├── package.json
├── package-lock.json
├── tailwind.config.js
├── postcss.config.js
├── tsconfig.json
└── README.md
```

**Organización principal:**

- `components/`: elementos reutilizables de interfaz.
- `pages/`: pantallas de clientes y administración.
- `services/`: lógica compartida y acceso a datos.
- `models/`: estructuras y tipos de datos.
- `guards/`: protección de rutas.
- `interceptors/`: procesamiento transversal de solicitudes HTTP.
- `app.routes.ts`: definición de las rutas de navegación.

---

## Instalación y ejecución

### Requisitos previos

Antes de ejecutar el proyecto, se recomienda contar con:

- Node.js 20 LTS compatible con Angular 18.
- npm.
- Visual Studio Code o un editor equivalente.
- Git para clonar el repositorio.
- Un navegador moderno compatible con Angular.

### 1. Clonar el repositorio

```bash
git clone https://github.com/Casey1304/ChifaWok.git
```

### 2. Acceder al directorio

```bash
cd ChifaWok
```

### 3. Instalar dependencias

```bash
npm install
```

### 4. Configurar PowerShell (Windows)

Si PowerShell restringe la ejecución de scripts, ejecutar:

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
```

Este comando modifica la política de ejecución únicamente durante la sesión actual de PowerShell.

No es necesario ejecutarlo si el entorno ya permite utilizar npm normalmente.

### 5. Iniciar la aplicación

```bash
npm start
```

El script inicia el servidor de desarrollo Angular en el puerto `4200`.

### 6. Acceder desde el navegador

```text
http://localhost:4200
```

Para detener el servidor, presionar `Ctrl + C` en la terminal.

---

## Rutas principales

### Cliente

| Ruta | Descripción |
|---|---|
| `/` | Página principal |
| `/carta` | Carta digital |
| `/mis-pedidos` | Seguimiento e historial |
| `/login` | Inicio de sesión |
| `/registro` | Registro de usuarios |

### Administración

| Ruta | Descripción |
|---|---|
| `/admin/pedidos` | Gestión operativa de pedidos |
| `/admin/productos` | Administración de productos |
| `/admin/clientes` | Directorio de clientes |
| `/admin/metricas` | Indicadores y analítica |
| `/admin/configuracion` | Configuración del sistema |

Las rutas administrativas incorporan un guard de acceso para restringir su navegación según el rol.

---

## Modo demostración

El frontend incorpora un entorno de demostración que permite explorar las funcionalidades sin configurar un backend externo.

**Características del modo demo:**

- Datos iniciales de prueba.
- Cuentas demostrativas para clientes y administradores.
- Registro y actualización local de pedidos.
- Administración local de productos.
- Simulación de cambios de estado.
- Interacciones demostrativas con Mei.
- Persistencia mediante LocalStorage.
- Restauración de información inicial.

### Consideraciones

Los datos almacenados en LocalStorage pertenecen al navegador donde se utiliza la aplicación.

Este mecanismo es adecuado para demostraciones y pruebas funcionales, pero no sustituye una base de datos centralizada.

Las credenciales demostrativas y los mecanismos de autenticación locales no deben utilizarse como solución de seguridad en producción.

---

## Identidad visual y experiencia de usuario

La interfaz toma como referencia el diseño del proyecto realizado en Google Stitch.

### Paleta de colores

| Color | Código | Aplicación |
|---|---|---|
| Carmesí | `#AF101A` | Identidad principal |
| Rojo Wok | `#D32F2F` | Acciones y elementos destacados |
| Dorado Andino | `#FEC330` | Acentos visuales |

### Tipografía

- **Montserrat:** títulos y encabezados.
- **Inter:** textos, navegación y formularios.

### Principios de diseño

- Navegación intuitiva.
- Consistencia visual.
- Componentes reutilizables.
- Diferenciación de interfaces por rol.
- Diseño adaptable a distintos tamaños de pantalla.
- Retroalimentación visual en acciones importantes.

---

## Comandos disponibles

| Comando | Descripción |
|---|---|
| `npm install` | Instala dependencias |
| `npm start` | Inicia el servidor de desarrollo |
| `npm run build` | Genera una compilación de la aplicación |
| `npm run watch` | Compila y observa cambios en desarrollo |

La compilación de producción puede generarse mediante:

```bash
npm run build
```

---

## Estado del desarrollo

El repositorio contiene una implementación frontend de ChifaWok orientada a demostración funcional.

**Componentes desarrollados:**

- Interfaz pública del restaurante.
- Carta digital y carrito.
- Registro e inicio de sesión demostrativos.
- Seguimiento de pedidos.
- Panel administrativo.
- Gestión de pedidos, productos y clientes.
- Módulo de métricas.
- Asistente Mei con capacidades de voz del navegador.
- Persistencia local.

**Integraciones pendientes de validación o desarrollo:**

- Backend Spring Boot conectado.
- Persistencia real mediante PostgreSQL.
- Autenticación JWT de producción.
- Servicio avanzado de IA mediante FastAPI.
- Pruebas automatizadas completas.
- Despliegue en un entorno productivo.

---

## Mejoras futuras

El proyecto contempla las siguientes líneas de evolución:

1. Integración de servicios REST con Spring Boot.
2. Implementación de autenticación y autorización segura mediante JWT.
3. Persistencia centralizada con PostgreSQL.
4. Integración de un motor de procesamiento de lenguaje natural.
5. Sincronización de pedidos en tiempo real.
6. Ampliación de métricas y reportes.
7. Implementación de pruebas unitarias y de integración.
8. Optimización de accesibilidad y experiencia móvil.
9. Preparación de entornos de despliegue y producción.

---

## Consideraciones de seguridad

El proyecto se encuentra en una etapa de desarrollo y demostración.

Antes de utilizarlo en producción se deberán implementar medidas adicionales, incluyendo autenticación segura, validación de datos en el servidor, control de permisos, protección de información sensible y almacenamiento centralizado.

No deben publicarse claves privadas, tokens, contraseñas reales ni archivos de configuración con secretos.

---

## Repositorio

**GitHub:** https://github.com/Casey1304/ChifaWok

**Proyecto:** ChifaWok

**Tipo:** Aplicación web de gestión de pedidos con asistente conversacional

**Año:** 2026

---

*ChifaWok — Innovación tecnológica al servicio de la gastronomía peruano-china.*
