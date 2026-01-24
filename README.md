<div align="center">

# 🛠️ Web Tools

<p>
  <img src="https://img.shields.io/badge/Vue-3.5-4FC08D?style=for-the-badge&logo=vue.js&logoColor=white" alt="Vue 3.5">
  <img src="https://img.shields.io/badge/Vite-7.2-646CFF?style=for-the-badge&logo=vite&logoColor=white" alt="Vite 7.2">
  <img src="https://img.shields.io/badge/Tailwind-4.1-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind 4.1">
  <img src="https://img.shields.io/badge/Three.js-0.182-000000?style=for-the-badge&logo=three.js&logoColor=white" alt="Three.js">
</p>

<p>
  <img src="https://img.shields.io/github/license/christianpasinrey/tools?style=flat-square&color=22c55e" alt="License">
  <img src="https://img.shields.io/github/stars/christianpasinrey/tools?style=flat-square&color=22c55e" alt="Stars">
  <img src="https://img.shields.io/github/forks/christianpasinrey/tools?style=flat-square&color=22c55e" alt="Forks">
  <img src="https://img.shields.io/github/issues/christianpasinrey/tools?style=flat-square&color=22c55e" alt="Issues">
  <img src="https://img.shields.io/badge/PRs-welcome-22c55e?style=flat-square" alt="PRs Welcome">
</p>

**Suite de herramientas profesionales con cifrado zero-knowledge.**<br>
Cifrado en cliente • Sync entre dispositivos • Open Source • Privacidad total

<p>
  <a href="#-inicio-rápido"><strong>Inicio Rápido</strong></a> •
  <a href="#-herramientas"><strong>Herramientas</strong></a> •
  <a href="#-contribuir"><strong>Contribuir</strong></a> •
  <a href="#english"><strong>English</strong></a>
</p>

</div>

---

## 🌐 Idioma / Language

<table>
<tr>
<td align="center" width="50%">

### 🇪🇸 [Español](#español)

</td>
<td align="center" width="50%">

### 🇬🇧 [English](#english)

</td>
</tr>
</table>

---

# Español

## 📖 Descripción

**Web Tools** es una colección de herramientas de edición y productividad con cifrado zero-knowledge. Tus datos se cifran con AES-256-GCM directamente en el navegador antes de guardarse o sincronizarse.

<table>
<tr>
<td>🔒</td>
<td><strong>Zero-Knowledge</strong></td>
<td>Cifrado AES-256-GCM en cliente. El servidor solo almacena blobs cifrados</td>
</tr>
<tr>
<td>🔄</td>
<td><strong>Sync Cross-Device</strong></td>
<td>Sincroniza datos cifrados entre dispositivos via API REST</td>
</tr>
<tr>
<td>🚀</td>
<td><strong>Sin Instalación</strong></td>
<td>Accede desde cualquier dispositivo con navegador</td>
</tr>
<tr>
<td>🌐</td>
<td><strong>Open Source</strong></td>
<td>Código abierto, transparente y auditable</td>
</tr>
<tr>
<td>🎨</td>
<td><strong>UI Moderna</strong></td>
<td>Interfaz Liquid Glass inspirada en macOS</td>
</tr>
</table>

---

## 🧰 Herramientas

### 📸 Multimedia

| Herramienta | Descripción | Tecnología |
|:------------|:------------|:-----------|
| **🖼️ Image Editor** | Filtros, recortes, ajustes de color, rotación, volteo y herramientas de dibujo | Canvas API |
| **🎵 Audio Editor** | Corta, une y aplica efectos. Visualización de ondas en tiempo real | WaveSurfer.js |
| **🎮 3D Playground** | Escenas 3D interactivas, shaders personalizados, controles orbitales | Three.js |
| **✏️ SVG Editor** | Crea y edita gráficos vectoriales con herramientas profesionales | SVG API |

### 📄 Documentos

| Herramienta | Descripción | Tecnología |
|:------------|:------------|:-----------|
| **📕 PDF Editor** | Combina, divide, rota, reordena y anota documentos PDF | pdf-lib, PDF.js |
| **📊 Spreadsheet Editor** | Hojas de cálculo con fórmulas, estilos y exportación a Excel | ExcelJS |
| **📝 Markdown Editor** | Editor con preview en vivo, syntax highlighting y exportación | Marked, DOMPurify |

### 💻 Technology

| Herramienta | Descripción | Tecnología |
|:------------|:------------|:-----------|
| **🔧 Dev Tools** | Formatea JSON/YAML, playground HTML/CSS/JS con preview en vivo | CodeMirror 6, js-yaml |
| **📱 Phone Tester** | Prueba llamadas SIP WebRTC, genera código para Vue y React | @tbisoftware/phone |
| **🔐 CyberSecurity** | JWT Debugger, Base64 Encoder/Decoder, Hash Generator | Web Crypto API |

### 🛠️ Tools

| Herramienta | Descripción | Tecnología |
|:------------|:------------|:-----------|
| **📏 Unit Converter** | Convierte longitud, peso, temperatura, tiempo y monedas en tiempo real | Frankfurter API |
| **🎨 Color Picker** | Rueda de colores, armonías cromáticas, gradientes, múltiples formatos | Canvas API |

### 📚 Reference

| Herramienta | Descripción |
|:------------|:------------|
| **📖 CheatSheets** | +50 guías rápidas: macOS, Windows, Linux, Bash, Git, Python, TypeScript, Docker, Kubernetes, Laravel, Vue, React, Tailwind, Photoshop, y más |

---

## 🚀 Inicio Rápido

```bash
# Clonar el repositorio
git clone https://github.com/christianpasinrey/tools.git

# Entrar al directorio
cd tools

# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm run dev
```

> [!TIP]
> El servidor estará disponible en `http://localhost:5173`

### Scripts Disponibles

| Comando | Descripción |
|:--------|:------------|
| `npm run dev` | Servidor de desarrollo con HMR |
| `npm run build` | Build de producción en `/dist` |
| `npm run preview` | Preview de la build localmente |
| `npm test` | Ejecuta tests en modo watch |
| `npm run test:run` | Ejecuta todos los tests una vez |

---

## 🏗️ Stack Tecnológico

<details>
<summary><strong>📦 Ver todas las dependencias</strong></summary>

### Frontend Framework
| Paquete | Versión | Descripción |
|:--------|:--------|:------------|
| [Vue](https://vuejs.org/) | 3.5.24 | Framework progresivo para UI |
| [Vue Router](https://router.vuejs.org/) | 4.6.4 | Enrutamiento oficial para Vue |
| [VueUse](https://vueuse.org/) | 14.1.0 | Colección de utilidades para Composition API |

### Build & Styling
| Paquete | Versión | Descripción |
|:--------|:--------|:------------|
| [Vite](https://vitejs.dev/) | 7.2.4 | Build tool ultrarrápido |
| [Tailwind CSS](https://tailwindcss.com/) | 4.1.18 | Framework CSS utility-first |

### Editores & Media
| Paquete | Versión | Descripción |
|:--------|:--------|:------------|
| [CodeMirror](https://codemirror.net/) | 6.x | Editor de código extensible |
| [WaveSurfer.js](https://wavesurfer-js.org/) | 7.12.1 | Visualización de audio |
| [Three.js](https://threejs.org/) | 0.182.0 | Gráficos 3D con WebGL |

### Documentos
| Paquete | Versión | Descripción |
|:--------|:--------|:------------|
| [pdf-lib](https://pdf-lib.js.org/) | 1.17.1 | Crear y modificar PDFs |
| [PDF.js](https://mozilla.github.io/pdf.js/) | 5.4.530 | Renderizar PDFs |
| [ExcelJS](https://github.com/exceljs/exceljs) | 4.4.0 | Leer y escribir Excel |
| [Marked](https://marked.js.org/) | 17.0.1 | Parser de Markdown |
| [DOMPurify](https://github.com/cure53/DOMPurify) | 3.3.1 | Sanitización de HTML |

### Utilidades
| Paquete | Versión | Descripción |
|:--------|:--------|:------------|
| [js-yaml](https://github.com/nodeca/js-yaml) | 4.1.1 | Parser YAML |
| [@tbisoftware/phone](https://github.com/Tu-buen-camino/phone) | 2.0.6 | Componente teléfono SIP |

</details>

---

## 📁 Estructura del Proyecto

```
tools/
├── 📂 public/
│   └── .htaccess                 # Config Apache para SPA
├── 📂 src/
│   ├── 📂 components/
│   │   ├── 📂 audio/             # Editor de audio
│   │   ├── 📂 image/             # Editor de imagen
│   │   ├── 📂 pdf/               # Editor de PDF
│   │   ├── 📂 three/             # Playground 3D
│   │   ├── 📂 common/            # Componentes compartidos
│   │   │   ├── SyncAccountButton.vue   # Botón cloud sync
│   │   │   ├── AuthForm.vue            # Login/registro
│   │   │   └── SyncStatusPanel.vue     # Estado de sync
│   │   ├── Dock.vue              # Navegación principal
│   │   ├── DockButton.vue        # Botones del dock
│   │   ├── DockSubmenu.vue       # Submenús interactivos
│   │   └── BentoGrid.vue         # Grid estilo bento
│   ├── 📂 composables/
│   │   ├── useAppCrypto.js       # Cifrado AES-256-GCM
│   │   ├── useAuth.js            # Autenticación JWT
│   │   ├── useCloudSync.js       # Sync zero-knowledge
│   │   ├── useVault.js           # IndexedDB + sync hooks
│   │   ├── useCheatsheets.js     # Lógica de cheatsheets
│   │   ├── useMultimedia.js      # Navegación multimedia
│   │   ├── useTechnology.js      # Navegación technology
│   │   └── useTools.js           # Navegación tools
│   ├── 📂 data/
│   │   └── 📂 cheatsheets/       # +50 archivos JSON
│   ├── 📂 views/                 # Páginas principales
│   ├── 📂 router/                # Configuración rutas
│   ├── App.vue
│   ├── main.js
│   └── style.css
├── index.html
├── package.json
├── vite.config.js
└── README.md
```

---

## 🚢 Deployment

<details>
<summary><strong>Apache (con .htaccess)</strong></summary>

El proyecto incluye `.htaccess` en `/public` que se copia a `/dist` durante el build.

```bash
npm run build
# Subir contenido de /dist al servidor
```

</details>

<details>
<summary><strong>Nginx</strong></summary>

```nginx
server {
    listen 80;
    server_name tu-dominio.com;
    root /var/www/tools/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

</details>

<details>
<summary><strong>Vercel / Netlify</strong></summary>

**vercel.json:**
```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

**netlify.toml:**
```toml
[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

</details>

---

## 🔐 Cifrado y Sync

### Arquitectura Zero-Knowledge

Los datos se cifran en el navegador con **AES-256-GCM** antes de guardarse en IndexedDB o sincronizarse con el backend. El servidor nunca tiene acceso a los datos en claro.

```
Password del usuario
  ├─ PBKDF2 (salt fijo) ──→ authKey ──→ servidor (autenticación)
  └─ PBKDF2 (salt aleatorio/item) ──→ AES key ──→ cifra datos localmente
```

| Concepto | Detalle |
|:---------|:--------|
| Cifrado | AES-256-GCM con PBKDF2 (100k iteraciones) |
| Auth | JWT (access 15min + refresh 7d con rotación) |
| Sync | Last-Write-Wins basado en timestamps del cliente |
| Offline | Cola de cambios en localStorage, flush al reconectar |
| Backend | Node.js + Express + MongoDB ([tools-sync-api](../tools-sync-api)) |

> [!NOTE]
> El servidor solo almacena blobs `{ salt, iv, data }` en Base64. La clave de cifrado nunca sale del navegador.

---

## 🤝 Contribuir

> [!NOTE]
> ¡Las contribuciones son bienvenidas! Este proyecto crece gracias a la comunidad.

### Cómo Contribuir

1. **Fork** el repositorio
2. **Crea** una rama para tu feature (`git checkout -b feature/nueva-herramienta`)
3. **Commit** tus cambios (`git commit -m 'feat: añadir nueva herramienta'`)
4. **Push** a la rama (`git push origin feature/nueva-herramienta`)
5. **Verifica** que los tests pasan (`npm run test:run`)
6. **Abre** un Pull Request

> [!IMPORTANT]
> Todos los Pull Requests deben pasar la suite de tests antes de ser mergeados. Si tu PR añade nueva funcionalidad, incluye tests que la cubran. Ejecuta `npm run test:run` antes de abrir tu PR para verificar que todo funciona correctamente.

### Tipos de Contribución

| Tipo | Descripción |
|:-----|:------------|
| 🐛 **Bug Fix** | Corrige errores existentes |
| ✨ **Feature** | Añade nueva funcionalidad |
| 📝 **Docs** | Mejora la documentación |
| 🌐 **i18n** | Traducciones y localización |
| 🎨 **UI/UX** | Mejoras de interfaz |
| ⚡ **Performance** | Optimizaciones de rendimiento |
| 🧪 **Tests** | Añade o mejora tests |

### Convención de Commits

```
feat: nueva funcionalidad
fix: corrección de bug
docs: cambios en documentación
style: formato, sin cambios de código
refactor: refactorización de código
perf: mejoras de rendimiento
test: añadir o corregir tests
chore: tareas de mantenimiento
```

## 📄 Licencia

Este proyecto está bajo la licencia **MIT**. Ver el archivo [LICENSE](LICENSE) para más detalles.

---

# English

## 📖 Description

**Web Tools** is a collection of editing and productivity tools with zero-knowledge encryption. Your data is encrypted with AES-256-GCM directly in the browser before being stored or synced.

<table>
<tr>
<td>🔒</td>
<td><strong>Zero-Knowledge</strong></td>
<td>Client-side AES-256-GCM encryption. The server only stores encrypted blobs</td>
</tr>
<tr>
<td>🔄</td>
<td><strong>Cross-Device Sync</strong></td>
<td>Sync encrypted data across devices via REST API</td>
</tr>
<tr>
<td>🚀</td>
<td><strong>No Installation</strong></td>
<td>Access from any device with a browser</td>
</tr>
<tr>
<td>🌐</td>
<td><strong>Open Source</strong></td>
<td>Open, transparent and auditable code</td>
</tr>
<tr>
<td>🎨</td>
<td><strong>Modern UI</strong></td>
<td>Liquid Glass interface inspired by macOS</td>
</tr>
</table>

---

## 🧰 Tools

### 📸 Multimedia

| Tool | Description | Technology |
|:-----|:------------|:-----------|
| **🖼️ Image Editor** | Filters, cropping, color adjustments, rotation, flip and drawing tools | Canvas API |
| **🎵 Audio Editor** | Cut, merge and apply effects. Real-time waveform visualization | WaveSurfer.js |
| **🎮 3D Playground** | Interactive 3D scenes, custom shaders, orbital controls | Three.js |
| **✏️ SVG Editor** | Create and edit vector graphics with professional tools | SVG API |

### 📄 Documents

| Tool | Description | Technology |
|:-----|:------------|:-----------|
| **📕 PDF Editor** | Merge, split, rotate, reorder and annotate PDF documents | pdf-lib, PDF.js |
| **📊 Spreadsheet Editor** | Spreadsheets with formulas, styles and Excel export | ExcelJS |
| **📝 Markdown Editor** | Editor with live preview, syntax highlighting and export | Marked, DOMPurify |

### 💻 Technology

| Tool | Description | Technology |
|:-----|:------------|:-----------|
| **🔧 Dev Tools** | Format JSON/YAML, HTML/CSS/JS playground with live preview | CodeMirror 6, js-yaml |
| **📱 Phone Tester** | Test SIP WebRTC calls, generate code for Vue and React | @tbisoftware/phone |
| **🔐 CyberSecurity** | JWT Debugger, Base64 Encoder/Decoder, Hash Generator | Web Crypto API |

### 🛠️ Tools

| Tool | Description | Technology |
|:-----|:------------|:-----------|
| **📏 Unit Converter** | Convert length, weight, temperature, time and currencies in real-time | Frankfurter API |
| **🎨 Color Picker** | Color wheel, chromatic harmonies, gradients, multiple formats | Canvas API |

### 📚 Reference

| Tool | Description |
|:-----|:------------|
| **📖 CheatSheets** | +50 quick guides: macOS, Windows, Linux, Bash, Git, Python, TypeScript, Docker, Kubernetes, Laravel, Vue, React, Tailwind, Photoshop, and more |

---

## 🚀 Quick Start

```bash
# Clone the repository
git clone https://github.com/christianpasinrey/tools.git

# Enter the directory
cd tools

# Install dependencies
npm install

# Start development server
npm run dev
```

> [!TIP]
> Server will be available at `http://localhost:5173`

### Available Scripts

| Command | Description |
|:--------|:------------|
| `npm run dev` | Development server with HMR |
| `npm run build` | Production build to `/dist` |
| `npm run preview` | Preview build locally |
| `npm test` | Run tests in watch mode |
| `npm run test:run` | Run all tests once |

---

## 🏗️ Tech Stack

<details>
<summary><strong>📦 View all dependencies</strong></summary>

### Frontend Framework
| Package | Version | Description |
|:--------|:--------|:------------|
| [Vue](https://vuejs.org/) | 3.5.24 | Progressive framework for UI |
| [Vue Router](https://router.vuejs.org/) | 4.6.4 | Official router for Vue |
| [VueUse](https://vueuse.org/) | 14.1.0 | Collection of Composition API utilities |

### Build & Styling
| Package | Version | Description |
|:--------|:--------|:------------|
| [Vite](https://vitejs.dev/) | 7.2.4 | Ultrafast build tool |
| [Tailwind CSS](https://tailwindcss.com/) | 4.1.18 | Utility-first CSS framework |

### Editors & Media
| Package | Version | Description |
|:--------|:--------|:------------|
| [CodeMirror](https://codemirror.net/) | 6.x | Extensible code editor |
| [WaveSurfer.js](https://wavesurfer-js.org/) | 7.12.1 | Audio visualization |
| [Three.js](https://threejs.org/) | 0.182.0 | 3D graphics with WebGL |

### Documents
| Package | Version | Description |
|:--------|:--------|:------------|
| [pdf-lib](https://pdf-lib.js.org/) | 1.17.1 | Create and modify PDFs |
| [PDF.js](https://mozilla.github.io/pdf.js/) | 5.4.530 | Render PDFs |
| [ExcelJS](https://github.com/exceljs/exceljs) | 4.4.0 | Read and write Excel |
| [Marked](https://marked.js.org/) | 17.0.1 | Markdown parser |
| [DOMPurify](https://github.com/cure53/DOMPurify) | 3.3.1 | HTML sanitization |

### Utilities
| Package | Version | Description |
|:--------|:--------|:------------|
| [js-yaml](https://github.com/nodeca/js-yaml) | 4.1.1 | YAML parser |
| [@tbisoftware/phone](https://github.com/Tu-buen-camino/phone) | 2.0.6 | SIP phone component |

</details>

---

## 📁 Project Structure

```
tools/
├── 📂 public/
│   └── .htaccess                 # Apache config for SPA
├── 📂 src/
│   ├── 📂 components/
│   │   ├── 📂 audio/             # Audio editor
│   │   ├── 📂 image/             # Image editor
│   │   ├── 📂 pdf/               # PDF editor
│   │   ├── 📂 three/             # 3D playground
│   │   ├── 📂 common/            # Shared components
│   │   │   ├── SyncAccountButton.vue   # Cloud sync button
│   │   │   ├── AuthForm.vue            # Login/register
│   │   │   └── SyncStatusPanel.vue     # Sync status
│   │   ├── Dock.vue              # Main navigation
│   │   ├── DockButton.vue        # Dock buttons
│   │   ├── DockSubmenu.vue       # Interactive submenus
│   │   └── BentoGrid.vue         # Bento-style grid
│   ├── 📂 composables/
│   │   ├── useAppCrypto.js       # AES-256-GCM encryption
│   │   ├── useAuth.js            # JWT authentication
│   │   ├── useCloudSync.js       # Zero-knowledge sync
│   │   ├── useVault.js           # IndexedDB + sync hooks
│   │   ├── useCheatsheets.js     # Cheatsheets logic
│   │   ├── useMultimedia.js      # Multimedia navigation
│   │   ├── useTechnology.js      # Technology navigation
│   │   └── useTools.js           # Tools navigation
│   ├── 📂 data/
│   │   └── 📂 cheatsheets/       # +50 JSON files
│   ├── 📂 views/                 # Main pages
│   ├── 📂 router/                # Route configuration
│   ├── App.vue
│   ├── main.js
│   └── style.css
├── index.html
├── package.json
├── vite.config.js
└── README.md
```

---

## 🚢 Deployment

<details>
<summary><strong>Apache (with .htaccess)</strong></summary>

The project includes `.htaccess` in `/public` that gets copied to `/dist` during build.

```bash
npm run build
# Upload /dist contents to server
```

</details>

<details>
<summary><strong>Nginx</strong></summary>

```nginx
server {
    listen 80;
    server_name your-domain.com;
    root /var/www/tools/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

</details>

<details>
<summary><strong>Vercel / Netlify</strong></summary>

**vercel.json:**
```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

**netlify.toml:**
```toml
[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

</details>

---

## 🔐 Encryption & Sync

### Zero-Knowledge Architecture

Data is encrypted in the browser with **AES-256-GCM** before being stored in IndexedDB or synced to the backend. The server never has access to plaintext data.

```
User password
  ├─ PBKDF2 (fixed salt) ──→ authKey ──→ server (authentication)
  └─ PBKDF2 (random salt/item) ──→ AES key ──→ encrypts data locally
```

| Concept | Detail |
|:--------|:-------|
| Encryption | AES-256-GCM with PBKDF2 (100k iterations) |
| Auth | JWT (access 15min + refresh 7d with rotation) |
| Sync | Last-Write-Wins based on client timestamps |
| Offline | Change queue in localStorage, flush on reconnect |
| Backend | Node.js + Express + MongoDB ([tools-sync-api](../tools-sync-api)) |

> [!NOTE]
> The server only stores `{ salt, iv, data }` blobs in Base64. The encryption key never leaves the browser.

---

## 🤝 Contributing

> [!NOTE]
> Contributions are welcome! This project grows thanks to the community.

### How to Contribute

1. **Fork** the repository
2. **Create** a branch for your feature (`git checkout -b feature/new-tool`)
3. **Commit** your changes (`git commit -m 'feat: add new tool'`)
4. **Push** to the branch (`git push origin feature/new-tool`)
5. **Verify** that tests pass (`npm run test:run`)
6. **Open** a Pull Request

> [!IMPORTANT]
> All Pull Requests must pass the test suite before being merged. If your PR adds new functionality, include tests covering it. Run `npm run test:run` before opening your PR to verify everything works correctly.

### Contribution Types

| Type | Description |
|:-----|:------------|
| 🐛 **Bug Fix** | Fix existing bugs |
| ✨ **Feature** | Add new functionality |
| 📝 **Docs** | Improve documentation |
| 🌐 **i18n** | Translations and localization |
| 🎨 **UI/UX** | Interface improvements |
| ⚡ **Performance** | Performance optimizations |
| 🧪 **Tests** | Add or improve tests |

### Commit Convention

```
feat: new feature
fix: bug fix
docs: documentation changes
style: formatting, no code changes
refactor: code refactoring
perf: performance improvements
test: add or fix tests
chore: maintenance tasks
```

---

## � Open Source Libraries

Este proyecto está construido con las siguientes librerías open source:

### Frontend Framework
- **[Vue.js](https://github.com/vuejs/core)** - Progressive JavaScript Framework
- **[Vue Router](https://github.com/vuejs/router)** - Official router for Vue.js
- **[@vueuse/core](https://github.com/vueuse/vueuse)** - Collection of essential Vue.js composition utilities

### Build Tools & Styling
- **[Vite](https://github.com/vitejs/vite)** - Next generation frontend tooling
- **[Tailwind CSS](https://github.com/tailwindlabs/tailwindcss)** - Utility-first CSS framework
- **[@tailwindcss/vite](https://github.com/tailwindlabs/tailwindcss)** - Vite plugin for Tailwind CSS

### Code Editing
- **[CodeMirror](https://github.com/codemirror/CodeMirror)** - Versatile text editor
- **[@codemirror/autocomplete](https://github.com/codemirror/CodeMirror)** - Autocompletion support for CodeMirror
- **[@codemirror/lang-html](https://github.com/codemirror/CodeMirror)** - HTML language support
- **[@codemirror/lang-javascript](https://github.com/codemirror/CodeMirror)** - JavaScript language support
- **[@codemirror/lang-css](https://github.com/codemirror/CodeMirror)** - CSS language support
- **[@codemirror/theme-one-dark](https://github.com/codemirror/CodeMirror)** - One Dark theme

### Media & Graphics
- **[Three.js](https://github.com/mrdoob/three.js)** - JavaScript 3D library
- **[WaveSurfer.js](https://github.com/katspaugh/wavesurfer.js)** - Interactive audio waveform player
- **[PDF-lib](https://github.com/Hopding/pdf-lib)** - Create and modify PDF documents
- **[pdfjs-dist](https://github.com/mozilla/pdf.js)** - Mozilla's PDF reader library

### Data Processing
- **[ExcelJS](https://github.com/exceljs/exceljs)** - Excel workbook/spreadsheet manipulation
- **[Marked](https://github.com/markedjs/marked)** - Markdown parser and compiler
- **[js-yaml](https://github.com/nodeca/js-yaml)** - JavaScript YAML parser
- **[DOMPurify](https://github.com/cure53/DOMPurify)** - XSS sanitizer for HTML, MathML and SVG

### Other
- **[@tbisoftware/phone](https://github.com/tbisoftware/phone)** - Phone number validation and formatting

---

## �📄 License

This project is licensed under the **MIT License**. See the [LICENSE](LICENSE) file for details.

---

## 🙏 Agradecimientos

Agradecemos sinceramente a:

- **[GitHub](https://github.com)** - Por proporcionar un excelente servicio de alojamiento de repositorios y herramientas colaborativas
- La comunidad open source - Por mantener y contribuir a las librerías que hacen este proyecto posible
- Todos los [contribuidores](https://github.com/christianpasinrey/tools/graphs/contributors) que han ayudado a mejorar este proyecto

---

<div align="center">

### ⭐ Star this repo if you find it useful!

<br>

<sub>Built with ❤️ by <a href="https://github.com/christianpasinrey">Christian Pasin Rey</a></sub>

<br>

<img src="https://img.shields.io/badge/Made%20with-Vue.js-4FC08D?style=flat-square&logo=vue.js" alt="Made with Vue.js">
<img src="https://img.shields.io/badge/Styled%20with-Tailwind-38B2AC?style=flat-square&logo=tailwind-css" alt="Styled with Tailwind">
<img src="https://img.shields.io/badge/Built%20with-Vite-646CFF?style=flat-square&logo=vite" alt="Built with Vite">

</div>
