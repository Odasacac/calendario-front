# CalendarioVAU · front

Front de Angular 18 (standalone, señales) para convertir fechas del calendario
gregoriano al calendario VAU.

## Arrancar

```bash
npm start
```

Servidor de desarrollo en `http://localhost:4200`. También sirve `exeFront.bat`.

| Comando | Qué hace |
| --- | --- |
| `npm start` | Servidor de desarrollo con recarga en caliente |
| `npm run build` | Build de producción en `dist/calendario-front` |
| `npm test` | Tests unitarios (Karma + Jasmine) |

## Configuración de la API

La URL del backend vive en `src/environments/`:

- `environment.development.ts` → `http://localhost:8081/api` (lo usa `ng serve`).
- `environment.ts` → `/api` (producción: se espera un reverse proxy hacia el
  backend en el mismo origen).

El cambio entre ambos lo hace `fileReplacements` en `angular.json`. Ya no hay
URLs escritas a mano en los servicios.

## Estructura

```
src/app
├── componentes
│   ├── layout/cabecera        cabecera con tema, idioma y sesión
│   ├── home                   pantalla principal (fecha VAU / descargas)
│   ├── login, registro, recovery, forbidden, no-encontrado
│   └── utiles
│       ├── date-vau           tarjeta de la fecha VAU
│       ├── descargas          manual y calendario en PDF
│       ├── icono              iconos SVG en línea
│       └── notificaciones     avisos efímeros (toasts)
├── guardias/auth.guard.ts     protege /home
├── i18n                       diccionarios es / en / ca
├── interfaces                 contratos de la API
├── servicios                  datos, descargas, sesión, tema, idioma, título
└── utiles/fechas.ts           aritmética y formato de fechas ISO
```

## Tema claro / oscuro

- El tema efectivo se escribe en `document.documentElement.dataset.theme`
  (`light` o `dark`) y todos los colores salen de las variables CSS de
  `src/styles.css`.
- Un script en línea de `src/index.html` resuelve el tema **antes** del primer
  pintado, así no hay parpadeo al recargar. Si se cambian las claves de
  `localStorage`, hay que tocar ese script y `TemaService` a la vez.
- Sin elección guardada se sigue `prefers-color-scheme`, y se reacciona en
  caliente si el sistema cambia.

## Internacionalización

Implementación propia basada en señales, sin dependencias (`I18nService`):

- Los diccionarios están en `src/app/i18n/`. `es.ts` es la fuente de verdad;
  `en.ts` y `ca.ts` se declaran como `Diccionario`, de modo que **falta o sobra
  una clave = error de compilación**.
- En las plantillas se usa `t('seccion.clave')`. Las claves están tipadas con
  notación de puntos, así que hay autocompletado y no se pueden inventar.
- Interpolación: `t('descargas.exito', { fichero: 'manual.pdf' })`.
- Las fechas se formatean con `Intl` usando el locale del idioma activo.
- El `title` de cada ruta también es una clave (`TituloTraducidoStrategy`).

### Añadir un idioma

1. Copiar `src/app/i18n/es.ts` a `xx.ts` y traducir los valores.
2. Añadir el código a `Idioma`, `DICCIONARIOS` e `IDIOMAS` en `idiomas.ts`.

Los textos que devuelve la API (nombres de estaciones, meses, festividades…)
llegan ya traducidos por el backend y no pasan por el diccionario.

## Notas de rendimiento

- Todas las rutas usan `loadComponent`, así que el bundle inicial solo lleva el
  login.
- Todos los componentes son `OnPush` y el estado son señales.
- `DatesService` cachea las fechas ya consultadas (los fallos no se cachean) y
  reintenta dos veces con espera creciente; `switchMap` cancela la petición
  anterior al navegar rápido con las flechas.
- Sin fuentes externas ni librerías de iconos: tipografía del sistema e iconos
  SVG en línea.
- `provideHttpClient(withFetch())` y sin `@angular/material` (que estaba
  instalado y sin usar, cargando un tema completo de CSS).

## Accesibilidad y UX

- Navegación por teclado: `←` / `→` cambian de día, `Esc` cierra menús.
- Gesto de deslizamiento horizontal en móvil para cambiar de día.
- Enlace «saltar al contenido», foco visible, `aria-label` / `aria-expanded`
  en los controles y `aria-live` en avisos y estado de carga.
- Se respeta `prefers-reduced-motion`.
- Estilos de impresión: al imprimir una fecha se ocultan los controles.
