# Web Tools

<p align="center">
  <img src="https://img.shields.io/badge/Vue-3.5-4FC08D?style=for-the-badge&logo=vue.js&logoColor=white" alt="Vue 3">
  <img src="https://img.shields.io/badge/Vite-7.2-646CFF?style=for-the-badge&logo=vite&logoColor=white" alt="Vite">
  <img src="https://img.shields.io/badge/Tailwind-4.1-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind">
  <img src="https://img.shields.io/badge/Three.js-0.182-000000?style=for-the-badge&logo=three.js&logoColor=white" alt="Three.js">
  <img src="https://img.shields.io/badge/CodeMirror-6-D30707?style=for-the-badge&logoColor=white" alt="CodeMirror">
</p>

<p align="center">
  <strong>Herramientas profesionales de edici&oacute;n que funcionan 100% en el navegador.</strong><br>
  Sin subir archivos, sin registro, sin l&iacute;mites.
</p>

---

## Idioma / Language

- [Espa&ntilde;ol](#español)
- [English](#english)

---

# Espa&ntilde;ol

## Descripci&oacute;n

**Web Tools** es una suite de herramientas de edici&oacute;n profesionales que se ejecutan completamente en el navegador del cliente. No se env&iacute;an datos a ning&uacute;n servidor, garantizando total privacidad.

### Herramientas disponibles

| Herramienta | Descripci&oacute;n | Tecnolog&iacute;a principal |
|-------------|-------------|---------------------|
| **Audio Editor** | Corta, une y aplica efectos a archivos de audio con visualizaci&oacute;n de ondas en tiempo real | WaveSurfer.js |
| **Image Editor** | Edita im&aacute;genes con filtros, recortes, ajustes de color y herramientas de dibujo | Canvas API |
| **PDF Editor** | Combina, divide, rota y reorganiza documentos PDF | pdf-lib, PDF.js |
| **3D Playground** | Experimenta con gr&aacute;ficos 3D, shaders y visualizaciones interactivas | Three.js |
| **Dev Tools** | Formatea JSON/YAML, playground HTML/CSS/JS con preview en vivo | CodeMirror 6, js-yaml |
| **SVG Editor** | Crea y edita gr&aacute;ficos vectoriales con herramientas de dibujo profesionales | SVG API |
| **Unit Converter** | Convierte unidades de longitud, peso, temperatura, moneda y m&aacute;s | Frankfurter API |
| **Color Picker** | Rueda de colores con armon&iacute;as crom&aacute;ticas y exportaci&oacute;n en m&uacute;ltiples formatos | Canvas API |
| **Phone Tester** | Prueba tu diseño responsive en diferentes dispositivos m&oacute;viles con simulaci&oacute;n en tiempo real | @tbisoftware/phone |

## Requisitos previos

- **Node.js** >= 18.0.0
- **npm** >= 9.0.0 (o **pnpm** / **yarn**)

## Instalaci&oacute;n

```bash
# Clonar el repositorio
git clone https://github.com/tu-usuario/web-tools.git
cd web-tools

# Instalar dependencias
npm install
```

## Scripts disponibles

| Comando | Descripci&oacute;n |
|---------|-------------|
| `npm run dev` | Inicia el servidor de desarrollo en `http://localhost:5173` |
| `npm run build` | Genera la build de producci&oacute;n en `/dist` |
| `npm run preview` | Previsualiza la build de producci&oacute;n localmente |

## Desarrollo local

```bash
# Iniciar servidor de desarrollo
npm run dev

# El servidor estar&aacute; disponible en:
# http://localhost:5173
```

## Build de producci&oacute;n

```bash
# Generar build optimizada
npm run build

# Los archivos se generan en /dist
# Para probar la build localmente:
npm run preview
```

## Estructura del proyecto

```
web-tools/
├── public/
│   └── .htaccess              # Configuraci&oacute;n Apache para SPA
├── src/
│   ├── assets/                # Recursos est&aacute;ticos
│   ├── components/            # Componentes Vue reutilizables
│   │   ├── audio/             # Componentes del editor de audio
│   │   ├── image/             # Componentes del editor de im&aacute;genes
│   │   ├── pdf/               # Componentes del editor de PDF
│   │   └── three/             # Componentes del playground 3D
│   ├── composables/           # Composables Vue (l&oacute;gica reutilizable)
│   │   └── three/             # Composables espec&iacute;ficos de Three.js
│   ├── router/                # Configuraci&oacute;n de Vue Router
│   ├── views/                 # Vistas/p&aacute;ginas principales
│   │   ├── Home.vue
│   │   ├── AudioEditor.vue
│   │   ├── ImageEditor.vue
│   │   ├── PdfEditor.vue
│   │   └── 3DPlayground.vue
│   ├── App.vue                # Componente ra&iacute;z
│   ├── main.js                # Punto de entrada
│   └── style.css              # Estilos globales
├── index.html
├── package.json
├── vite.config.js
└── README.md
```

## Stack tecnol&oacute;gico

### Frontend
- **Vue 3** (Composition API) - Framework principal
- **Vue Router 4** - Enrutamiento SPA
- **Tailwind CSS 4** - Framework de estilos

### Build Tools
- **Vite 7** - Bundler y servidor de desarrollo

### Librer&iacute;as espec&iacute;ficas
- **Three.js** - Gr&aacute;ficos 3D y WebGL
- **WaveSurfer.js** - Visualizaci&oacute;n y manipulaci&oacute;n de audio
- **pdf-lib** - Manipulaci&oacute;n de PDFs
- **PDF.js** - Renderizado de PDFs
- **CodeMirror 6** - Editor de c&oacute;digo con syntax highlighting
- **js-yaml** - Parser y serializador YAML
- **@tbisoftware/phone** - Componente de entrada de tel&eacute;fono con validaci&oacute;n internacional

## Despliegue

### Apache (con .htaccess)

El proyecto incluye un archivo `.htaccess` en `/public` que se copia autom&aacute;ticamente a `/dist` durante el build. Este archivo configura el rewrite para que Vue Router funcione correctamente con rutas en modo history.

```bash
# Build
npm run build

# Subir contenido de /dist al servidor
```

### Nginx

```nginx
location / {
    try_files $uri $uri/ /index.html;
}
```

### Vercel / Netlify

Crear archivo `vercel.json` o `netlify.toml`:

```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

## Licencia

MIT

---

# English

## Description

**Web Tools** is a suite of professional editing tools that run entirely in the client's browser. No data is sent to any server, ensuring complete privacy.

### Available tools

| Tool | Description | Main technology |
|------|-------------|-----------------|
| **Audio Editor** | Cut, merge and apply effects to audio files with real-time waveform visualization | WaveSurfer.js |
| **Image Editor** | Edit images with filters, cropping, color adjustments and drawing tools | Canvas API |
| **PDF Editor** | Merge, split, rotate and reorganize PDF documents | pdf-lib, PDF.js |
| **3D Playground** | Experiment with 3D graphics, shaders and interactive visualizations | Three.js |
| **Dev Tools** | Format JSON/YAML, HTML/CSS/JS playground with live preview | CodeMirror 6, js-yaml |
| **SVG Editor** | Create and edit vector graphics with professional drawing tools | SVG API |
| **Unit Converter** | Convert units of length, weight, temperature, currency and more | Frankfurter API |
| **Color Picker** | Color wheel with chromatic harmonies and multi-format export | Canvas API |
| **Phone Tester** | Test your responsive design on different mobile devices with real-time simulation | @tbisoftware/phone |

## Prerequisites

- **Node.js** >= 18.0.0
- **npm** >= 9.0.0 (or **pnpm** / **yarn**)

## Installation

```bash
# Clone the repository
git clone https://github.com/your-username/web-tools.git
cd web-tools

# Install dependencies
npm install
```

## Available scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Starts development server at `http://localhost:5173` |
| `npm run build` | Generates production build in `/dist` |
| `npm run preview` | Preview production build locally |

## Local development

```bash
# Start development server
npm run dev

# Server will be available at:
# http://localhost:5173
```

## Production build

```bash
# Generate optimized build
npm run build

# Files are generated in /dist
# To test the build locally:
npm run preview
```

## Project structure

```
web-tools/
├── public/
│   └── .htaccess              # Apache configuration for SPA
├── src/
│   ├── assets/                # Static resources
│   ├── components/            # Reusable Vue components
│   │   ├── audio/             # Audio editor components
│   │   ├── image/             # Image editor components
│   │   ├── pdf/               # PDF editor components
│   │   └── three/             # 3D playground components
│   ├── composables/           # Vue composables (reusable logic)
│   │   └── three/             # Three.js specific composables
│   ├── router/                # Vue Router configuration
│   ├── views/                 # Main views/pages
│   │   ├── Home.vue
│   │   ├── AudioEditor.vue
│   │   ├── ImageEditor.vue
│   │   ├── PdfEditor.vue
│   │   └── 3DPlayground.vue
│   ├── App.vue                # Root component
│   ├── main.js                # Entry point
│   └── style.css              # Global styles
├── index.html
├── package.json
├── vite.config.js
└── README.md
```

## Tech stack

### Frontend
- **Vue 3** (Composition API) - Main framework
- **Vue Router 4** - SPA routing
- **Tailwind CSS 4** - Styling framework

### Build Tools
- **Vite 7** - Bundler and development server

### Specific libraries
- **Three.js** - 3D graphics and WebGL
- **WaveSurfer.js** - Audio visualization and manipulation
- **pdf-lib** - PDF manipulation
- **PDF.js** - PDF rendering
- **CodeMirror 6** - Code editor with syntax highlighting
- **js-yaml** - YAML parser and serializer
- **@tbisoftware/phone** - Phone input component with international validation

## Deployment

### Apache (with .htaccess)

The project includes an `.htaccess` file in `/public` that is automatically copied to `/dist` during build. This file configures rewrite rules so Vue Router works correctly with history mode routes.

```bash
# Build
npm run build

# Upload /dist contents to server
```

### Nginx

```nginx
location / {
    try_files $uri $uri/ /index.html;
}
```

### Vercel / Netlify

Create `vercel.json` or `netlify.toml` file:

```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

## License

MIT

---

<p align="center">
  Made with Vue.js + Vite + Tailwind CSS
</p>
