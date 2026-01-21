import macos from './macos.json'
import windows from './windows.json'
import linux from './linux.json'
import bash from './bash.json'
import git from './git.json'
import mysql from './mysql.json'
import vim from './vim.json'
import docker from './docker.json'
import vscode from './vscode.json'
import laravel from './laravel.json'
import vue from './vue.json'
import css from './css.json'
import npm from './npm.json'
import react from './react.json'
import regex from './regex.json'
import accounting from './accounting.json'
// New cheatsheets
import typescript from './typescript.json'
import python from './python.json'
import tailwind from './tailwind.json'
import http from './http.json'
import kubernetes from './kubernetes.json'
import markdown from './markdown.json'
import sql from './sql.json'
import mongodb from './mongodb.json'
import physics from './physics.json'
import chemistry from './chemistry.json'
import statistics from './statistics.json'
import electricity from './electricity.json'
import math from './math.json'
import excel from './excel.json'
import notion from './notion.json'
import photoshop from './photoshop.json'
import lightroom from './lightroom.json'
import premiere from './premiere.json'
import aftereffects from './aftereffects.json'
import illustrator from './illustrator.json'
import blender from './blender.json'
import music from './music.json'
import photography from './photography.json'
import english from './english.json'
import japanese from './japanese.json'
import chinese from './chinese.json'
import korean from './korean.json'
import french from './french.json'
import german from './german.json'
import periodictable from './periodictable.json'

export const cheatsheetData = {
  macos,
  windows,
  linux,
  bash,
  git,
  mysql,
  vim,
  docker,
  vscode,
  laravel,
  vue,
  css,
  npm,
  react,
  regex,
  accounting,
  typescript,
  python,
  tailwind,
  http,
  kubernetes,
  markdown,
  sql,
  mongodb,
  physics,
  chemistry,
  statistics,
  electricity,
  math,
  excel,
  notion,
  photoshop,
  lightroom,
  premiere,
  aftereffects,
  illustrator,
  blender,
  music,
  photography,
  english,
  japanese,
  chinese,
  korean,
  french,
  german,
  periodictable
}

// Categories with their sheets
export const categories = [
  {
    id: 'os',
    name: 'Sistemas',
    icon: 'M4 4h16a2 2 0 012 2v12a2 2 0 01-2 2H4a2 2 0 01-2-2V6a2 2 0 012-2zm0 2v10h16V6H4z',
    sheets: ['macos', 'windows', 'linux']
  },
  {
    id: 'dev',
    name: 'Desarrollo',
    icon: 'M9.4 16.6L4.8 12l4.6-4.6L8 6l-6 6 6 6 1.4-1.4zm5.2 0l4.6-4.6-4.6-4.6L16 6l6 6-6 6-1.4-1.4z',
    sheets: ['bash', 'git', 'typescript', 'python', 'vim', 'vscode', 'regex']
  },
  {
    id: 'db',
    name: 'Bases de Datos',
    icon: 'M12 2C8.13 2 5 3.79 5 6v12c0 2.21 3.13 4 7 4s7-1.79 7-4V6c0-2.21-3.13-4-7-4z',
    sheets: ['mysql', 'sql', 'mongodb']
  },
  {
    id: 'devops',
    name: 'DevOps',
    icon: 'M19.35 10.04A7.49 7.49 0 0012 4C9.11 4 6.6 5.64 5.35 8.04A5.994 5.994 0 000 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96z',
    sheets: ['docker', 'kubernetes', 'npm']
  },
  {
    id: 'frameworks',
    name: 'Frameworks',
    icon: 'M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5',
    sheets: ['laravel', 'vue', 'react']
  },
  {
    id: 'styling',
    name: 'Estilos',
    icon: 'M12 22C6.49 22 2 17.51 2 12S6.49 2 12 2s10 4.04 10 9c0 3.31-2.69 6-6 6h-1.77c-.28 0-.5.22-.5.5 0 .12.05.23.13.33.41.47.64 1.06.64 1.67A2.5 2.5 0 0112 22z',
    sheets: ['css', 'tailwind']
  },
  {
    id: 'web',
    name: 'Web',
    icon: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93z',
    sheets: ['http', 'markdown']
  },
  {
    id: 'science',
    name: 'Ciencias',
    icon: 'M19.8 18.4L14 10.67V6.5l1.35-1.69c.26-.33.03-.81-.39-.81H9.04c-.42 0-.65.48-.39.81L10 6.5v4.17L4.2 18.4c-.49.66-.02 1.6.8 1.6h14c.82 0 1.29-.94.8-1.6z',
    sheets: ['physics', 'chemistry', 'statistics', 'electricity', 'math', 'accounting', 'periodictable']
  },
  {
    id: 'productivity',
    name: 'Productividad',
    icon: 'M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z',
    sheets: ['excel', 'notion', 'photoshop', 'lightroom']
  },
  {
    id: 'creative',
    name: 'Creativos',
    icon: 'M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z',
    sheets: ['music', 'photography', 'premiere', 'aftereffects', 'illustrator', 'blender']
  },
  {
    id: 'languages',
    name: 'Idiomas',
    icon: 'M12.87 15.07l-2.54-2.51.03-.03A17.52 17.52 0 0014.07 6H17V4h-7V2H8v2H1v2h11.17C11.5 7.92 10.44 9.75 9 11.35 8.07 10.32 7.3 9.19 6.69 8h-2c.73 1.63 1.73 3.17 2.98 4.56l-5.09 5.02L4 19l5-5 3.11 3.11.76-2.04zM18.5 10h-2L12 22h2l1.12-3h4.75L21 22h2l-4.5-12zm-2.62 7l1.62-4.33L19.12 17h-3.24z',
    sheets: ['english', 'japanese', 'chinese', 'korean', 'french', 'german']
  }
]

export const sheets = [
  // Operating Systems
  { id: 'macos', name: 'macOS', icon: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z', type: 'shortcuts' },
  { id: 'windows', name: 'Windows', icon: 'M3 12V6.75l6-1.32v6.48L3 12zm17-9v8.75l-10 .15V5.21L20 3zM3 13l6 .09v6.81l-6-1.15V13zm7 .25l10 .15V21l-10-1.91V13.25z', type: 'shortcuts' },
  { id: 'linux', name: 'Linux', icon: 'M12.5 2c-1.5 0-2.5 1.5-2.5 3.5 0 1 .5 2 1 2.5-.5.5-1.5 1-2 2-1 2-1 4 0 5.5.5 1 1.5 1.5 2.5 2 0 .5-.5 1-1 1.5-.5.5-.5 1.5 0 2s1.5.5 2 0c.5-.5 1-1 1-1.5.5.5 1.5 1 2.5 1s2-.5 2.5-1c0 .5.5 1 1 1.5.5.5 1.5.5 2 0s.5-1.5 0-2c-.5-.5-1-1-1-1.5 1-.5 2-1 2.5-2 1-1.5 1-3.5 0-5.5-.5-1-1.5-1.5-2-2 .5-.5 1-1.5 1-2.5 0-2-1-3.5-2.5-3.5s-2.5 1.5-2.5 3c0 0-1 0-1.5.5-.5-.5-1.5-.5-1.5-.5 0-1.5-1-3-2.5-3z', type: 'commands' },

  // Dev Tools & Languages
  { id: 'bash', name: 'Bash', icon: 'M2 4.5A2.5 2.5 0 014.5 2h15A2.5 2.5 0 0122 4.5v15a2.5 2.5 0 01-2.5 2.5h-15A2.5 2.5 0 012 19.5v-15zm6.5 5.5L5 13.5l3.5 3.5 1.5-1.5-2-2 2-2L8.5 10zm5 0l-1.5 1.5 2 2-2 2 1.5 1.5 3.5-3.5L13.5 10zm4.5 8h-4v-1.5h4V18z', type: 'commands' },
  { id: 'git', name: 'Git', icon: 'M21.62 11.11l-8.73-8.73a1.3 1.3 0 00-1.78 0L9.29 4.2l2.26 2.26a1.5 1.5 0 011.93 1.92l2.17 2.17a1.5 1.5 0 11-.88.83l-2-2v5.31a1.5 1.5 0 11-1.25-.07V9.2a1.5 1.5 0 01-.82-1.97L8.47 5l-6.09 6.09a1.3 1.3 0 000 1.78l8.73 8.73a1.3 1.3 0 001.78 0l8.73-8.73a1.3 1.3 0 000-1.76z', type: 'commands' },
  { id: 'typescript', name: 'TypeScript', icon: 'M3 3h18v18H3V3zm10.5 10.5v-1.8h-1.2v6.6h1.2v-3.48c0-.7.1-1.32.54-1.74.36-.36.9-.48 1.5-.42v-1.2c-.96-.06-1.56.24-2.04.84zm-5.1 4.8v-4.56h1.74v-1.2H4.8v1.2h1.8v4.56h1.8z', type: 'commands' },
  { id: 'python', name: 'Python', icon: 'M12 2c-1.66 0-3.14.37-4.28.98-.9.48-1.47 1.1-1.66 1.8-.1.37-.06.76-.06 1.14v2.08h5v1H5c-1.1 0-2.07.66-2.38 1.93-.36 1.47-.38 2.38 0 3.91.28 1.14 1 1.93 2.1 1.93h1.28v-2.5c0-1.24 1.07-2.34 2.38-2.34h4.24c1.05 0 1.88-.87 1.88-1.93V5.92c0-1.03-.85-1.8-1.88-1.98A12.7 12.7 0 0012 2zm-2.5 1.69a.94.94 0 110 1.87.94.94 0 010-1.87zM12 22c1.66 0 3.14-.37 4.28-.98.9-.48 1.47-1.1 1.66-1.8.1-.37.06-.76.06-1.14v-2.08h-5v-1h6c1.1 0 2.07-.66 2.38-1.93.36-1.47.38-2.38 0-3.91-.28-1.14-1-1.93-2.1-1.93h-1.28v2.5c0 1.24-1.07 2.34-2.38 2.34H11.4c-1.05 0-1.88.87-1.88 1.93v3.08c0 1.03.85 1.8 1.88 1.98.67.1 1.36.14 2.1.14zm2.5-1.69a.94.94 0 110-1.87.94.94 0 010 1.87z', type: 'commands' },
  { id: 'vim', name: 'Vim', icon: 'M3 2l3.5 4H5v14h2l-4 4-4-4h2V6H.5L3 2zm18.5 4L19 2l-2.5 4H18v14h-1.5l2.5 4 2.5-4H20V6h1.5zM12 7l5 10h-2.5l-1-2h-3l-1 2H7l5-10zm0 3.5L10.75 13h2.5L12 10.5z', type: 'shortcuts' },
  { id: 'vscode', name: 'VS Code', icon: 'M17.5 0L9 7.5 4 4 0 5.5v13L4 20l5-3.5L17.5 24l4.5-2V2L17.5 0zM4 16.5v-9l4 4.5-4 4.5zm5-4.5l8-6v12l-8-6z', type: 'shortcuts' },
  { id: 'regex', name: 'Regex', icon: 'M16 16v-3h-3v-2h3V8l3 3-3 3zm-6 0l-3-3 3-3v3h3v2h-3v1zM5 19a2 2 0 01-2-2V7a2 2 0 012-2h14a2 2 0 012 2v10a2 2 0 01-2 2H5z', type: 'reference' },

  // Databases
  { id: 'mysql', name: 'MySQL', icon: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z', type: 'commands' },
  { id: 'sql', name: 'SQL', icon: 'M12 2C8.13 2 5 3.79 5 6v12c0 2.21 3.13 4 7 4s7-1.79 7-4V6c0-2.21-3.13-4-7-4zm0 2c3.04 0 5 1.23 5 2s-1.96 2-5 2-5-1.23-5-2 1.96-2 5-2zm0 16c-3.04 0-5-1.23-5-2v-2.27c1.24.82 2.97 1.27 5 1.27s3.76-.45 5-1.27V18c0 .77-1.96 2-5 2z', type: 'commands' },
  { id: 'mongodb', name: 'MongoDB', icon: 'M12 2C9.24 2 7 4.24 7 7v10c0 2.76 2.24 5 5 5s5-2.24 5-5V7c0-2.76-2.24-5-5-5zm1 18.93c-.32.05-.66.07-1 .07s-.68-.02-1-.07V11h2v9.93zM13 9h-2V7c0-1.1.9-2 2-2h-2c1.1 0 2 .9 2 2v2z', type: 'commands' },

  // DevOps & Infrastructure
  { id: 'docker', name: 'Docker', icon: 'M21 10.5c-.4-.3-1.3-.5-2-.4-.1-.8-.5-1.5-1-2l-.4-.4-.4.4c-.4.4-.7 1-.8 1.5-.5-.1-1.1-.2-1.6-.1V9h-2V7H11V5H8v2H6v2H3v2H2c-.6 0-1.1.2-1.5.5l-.4.4.3.5c.6 1 1.8 1.6 3.1 1.6h15c1.3 0 2.5-.6 3.2-1.6l.3-.5-.4-.4zM4 10H3V9h1v1zm2 0H5V9h1v1zm0-2H5V7h1v1zm2 2H7V9h1v1zm0-2H7V7h1v1zm0-2H7V5h1v1zm2 4H9V9h1v1zm0-2H9V7h1v1zm2 2h-1V9h1v1z', type: 'commands' },
  { id: 'kubernetes', name: 'Kubernetes', icon: 'M12 2L4 6v6c0 5.55 3.84 10.74 8 12 4.16-1.26 8-6.45 8-12V6l-8-4zm0 4l.94 2.06 2.24.33-1.62 1.58.38 2.24L12 11l-1.94 1.21.38-2.24-1.62-1.58 2.24-.33L12 6z', type: 'commands' },
  { id: 'npm', name: 'NPM', icon: 'M0 7.334v8h6.666v1.332H12v-1.332h12v-8H0zm6.666 6.664H5.334v-4H3.999v4H1.335V8.667h5.331v5.331zm4 0v1.336H8.001V8.667h5.334v5.332h-2.669v-.001zm12.001 0h-1.33v-4h-1.336v4h-1.335v-4h-1.33v4h-2.671V8.667h8.002v5.331zM10.665 10H12v2.667h-1.335V10z', type: 'commands' },

  // Frameworks
  { id: 'laravel', name: 'Laravel', icon: 'M21.7 6.53c.01.02.01.05.01.08v4.29c0 .1-.06.22-.15.27l-3.61 2.08v4.11c0 .11-.05.21-.15.27l-7.52 4.33c-.02.01-.04.02-.07.03-.01 0-.02.01-.04.01-.02 0-.05-.01-.07-.02-.01 0-.03-.01-.04-.02l-7.52-4.33a.32.32 0 01-.15-.27V4.5c0-.03 0-.05.01-.08.01-.01.01-.03.02-.04.01-.02.02-.03.03-.05.01-.01.03-.02.04-.04l.01-.01c.02-.01.03-.02.05-.03.02-.01.04-.02.06-.02h.03l3.76-2.17c.09-.06.21-.06.3 0l3.76 2.17h.01c.02.01.04.01.06.02.02.01.04.02.05.03l.02.02c.01.01.02.02.04.04.01.01.02.03.03.04.01.02.01.03.02.05.01.02.01.05.01.07v8.03l3.14-1.81V6.61c0-.03 0-.05.01-.08.01-.01.01-.03.02-.04.01-.02.02-.04.03-.05.01-.01.02-.03.04-.04l.02-.01c.01-.01.03-.02.05-.03.02-.01.03-.02.06-.02h.02l3.76-2.17c.1-.06.21-.06.31 0l3.76 2.17c.02.01.04.01.05.02.02.01.04.02.05.03.02.01.03.03.04.04.02.01.03.03.04.05.01.01.01.02.02.04z', type: 'commands' },
  { id: 'vue', name: 'Vue.js', icon: 'M2 3h3.5L12 14.5 18.5 3H22L12 21 2 3zm4.5 0h3L12 7.5 14.5 3h3L12 13.5 6.5 3z', type: 'commands' },
  { id: 'react', name: 'React', icon: 'M12 10.11c1.03 0 1.87.84 1.87 1.89 0 1-.84 1.85-1.87 1.85S10.13 13 10.13 12c0-1.05.84-1.89 1.87-1.89M7.37 20c.63.38 2.01-.2 3.6-1.7-.52-.59-1.03-1.23-1.51-1.9a22.7 22.7 0 01-2.4-.36c-.51 2.14-.32 3.61.31 3.96m.71-5.74l-.29-.51c-.11.29-.22.58-.29.86.27.06.57.11.88.16l-.3-.51', type: 'commands' },

  // CSS & Styling
  { id: 'css', name: 'CSS', icon: 'M4.192 3.143h15.615l-1.42 16.034-6.404 1.812-6.369-1.813L4.192 3.143zM16.9 6.424l-9.8-.002.158 1.765 7.292.002-.189 2.148H9.716l.164 1.852h3.979l-.199 2.257-1.665.458-1.656-.456-.104-1.2H8.378l.212 2.404 3.406.97 3.399-.956.539-6.242z', type: 'commands' },
  { id: 'tailwind', name: 'Tailwind', icon: 'M12 6c-2.67 0-4.33 1.33-5 4 1-1.33 2.17-1.83 3.5-1.5.76.19 1.31.74 1.91 1.35.98 1 2.09 2.15 4.59 2.15 2.67 0 4.33-1.33 5-4-1 1.33-2.17 1.83-3.5 1.5-.76-.19-1.3-.74-1.91-1.35C15.61 7.15 14.5 6 12 6zm-5 6c-2.67 0-4.33 1.33-5 4 1-1.33 2.17-1.83 3.5-1.5.76.19 1.3.74 1.91 1.35.98 1 2.09 2.15 4.59 2.15 2.67 0 4.33-1.33 5-4-1 1.33-2.17 1.83-3.5 1.5-.76-.19-1.3-.74-1.91-1.35-.98-1-2.09-2.15-4.59-2.15z', type: 'reference' },

  // Web & APIs
  { id: 'http', name: 'HTTP', icon: 'M4.5 11h-2V9H1v6h1.5v-2.5h2V15H6V9H4.5v2zm2.5-.5h1.5V15H10v-4.5h1.5V9H7v1.5zm5.5 0H14V15h1.5v-4.5H17V9h-4.5v1.5zm5 4.5v-2.1l2.1 2.1H21l-2.6-3 2.4-3h-1.5l-1.8 2.2V9h-1.5v6h1.5z', type: 'reference' },
  { id: 'markdown', name: 'Markdown', icon: 'M20.56 18H3.44A1.44 1.44 0 012 16.56V7.44A1.44 1.44 0 013.44 6h17.12A1.44 1.44 0 0122 7.44v9.12A1.44 1.44 0 0120.56 18zM6 15.5v-5l2 2.5 2-2.5v5h2v-7H10l-2 2-2-2H4v7h2zm13-2.5l-2.5-3H18V8h-2v2h1.5l-2.5 3 2.5 3H16v2h2v-2h-1.5l2.5-3z', type: 'reference' },

  // Reference & Tools
  { id: 'excel', name: 'Excel', icon: 'M21.17 3H7.83A.83.83 0 007 3.83V8H2.83A.83.83 0 002 8.83v6.34c0 .46.37.83.83.83H7v4.17c0 .46.37.83.83.83h13.34c.46 0 .83-.37.83-.83V3.83a.83.83 0 00-.83-.83zM6 14H3.5v-1.5H6V14zm0-2.5H3.5V10H6v1.5zM11.2 16l-1.5-2.5-1.5 2.5H6.5l2.3-3.5-2.1-3.5H8.4l1.3 2.2 1.3-2.2h1.7L10.6 12l2.3 3.5-1.7.5z', type: 'reference' },

  // Science
  { id: 'physics', name: 'Física', icon: 'M12 2a10 10 0 100 20 10 10 0 000-20zm0 2a8 8 0 11-4.9 14.32l6.9-6.9V4.12A8.01 8.01 0 0112 4zm-1 3v3.59L6.41 15A6 6 0 0111 7z', type: 'reference' },
  { id: 'chemistry', name: 'Química', icon: 'M7 2v2h1v6.17A3.001 3.001 0 005 13v6a3 3 0 003 3h8a3 3 0 003-3v-6a3.001 3.001 0 00-3-6.83V4h1V2H7zm3 2h4v6h-4V4zm2 8a2 2 0 110 4 2 2 0 010-4z', type: 'reference' },
  { id: 'statistics', name: 'Estadística', icon: 'M5 3a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V5a2 2 0 00-2-2H5zm2 4h2v10H7V7zm4 3h2v7h-2v-7zm4-1h2v8h-2V9z', type: 'reference' },
  { id: 'electricity', name: 'Electricidad', icon: 'M11 21h-1l1-7H7.5c-.58 0-.57-.32-.38-.66l.1-.16L12 3h1l-1 7h3.5c.49 0 .56.33.47.51l-.07.15L11 21z', type: 'reference' },
  { id: 'math', name: 'Matemáticas', icon: 'M19 3H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V5a2 2 0 00-2-2zm-5 14h-4v-2h4v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z', type: 'reference' },
  { id: 'accounting', name: 'Contabilidad', icon: 'M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 14h-2v-2H8v-2h2v-2H8V9h2V7h2v2h2v2h-2v2h2v2h-2v2zm3-10h2v2h-2V7zm0 4h2v2h-2v-2zm0 4h2v2h-2v-2z', type: 'reference' },

  // Productivity
  { id: 'notion', name: 'Notion', icon: 'M4 4.5A2.5 2.5 0 016.5 2H18a2.5 2.5 0 012.5 2.5v15a2.5 2.5 0 01-2.5 2.5H6.5A2.5 2.5 0 014 19.5v-15zM7 7v2h2V7H7zm0 4v2h10v-2H7zm0 4v2h10v-2H7zm7-8v2h3V7h-3z', type: 'shortcuts' },
  { id: 'photoshop', name: 'Photoshop', icon: 'M9.8 8.44c-.17-.36-.42-.66-.74-.88-.32-.22-.72-.34-1.19-.34-.24 0-.47.02-.69.07-.21.05-.4.11-.58.2v3.8c.18.08.37.14.59.18.21.04.44.06.68.06.47 0 .87-.11 1.19-.33.32-.22.57-.52.74-.88.18-.37.26-.79.26-1.26 0-.47-.09-.89-.26-1.26V8.44zM19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9.63 13.11c-.53.36-1.21.54-2.03.54-.23 0-.46-.02-.68-.05a3.76 3.76 0 01-.61-.14v2.73H5V6.69c.29-.1.62-.18 1.01-.24.39-.06.79-.09 1.21-.09.76 0 1.4.13 1.93.4.52.26.92.63 1.19 1.1.27.47.4 1.02.4 1.65 0 .67-.15 1.25-.45 1.74-.3.49-.73.87-1.27 1.14l-.39.72zm8.54 3.08h-1.4l-2.27-3.72-.78.88v2.84h-1.31V6.5h1.31v5.15l2.85-3.43h1.48l-2.63 2.98 2.75 4.99z', type: 'shortcuts' },
  { id: 'lightroom', name: 'Lightroom', icon: 'M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H6V7h3v10zm8 0h-6v-2h6v2zm0-4h-6v-2h6v2zm0-4h-6V7h6v2z', type: 'shortcuts' },

  // Creative
  { id: 'music', name: 'Música', icon: 'M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6zm-2 16c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z', type: 'reference' },
  { id: 'photography', name: 'Fotografía', icon: 'M12 10.8a3.2 3.2 0 100 6.4 3.2 3.2 0 000-6.4zM9 2L7.17 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2h-3.17L15 2H9zm3 15c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5z', type: 'reference' },
  { id: 'premiere', name: 'Premiere Pro', icon: 'M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM10.5 13.11c-.53.36-1.21.54-2.03.54-.23 0-.46-.02-.68-.05a3.76 3.76 0 01-.61-.14v2.73H6V6.69c.29-.1.62-.18 1.01-.24.39-.06.79-.09 1.21-.09.76 0 1.4.13 1.93.4.52.26.92.63 1.19 1.1.27.47.4 1.02.4 1.65 0 .67-.15 1.25-.45 1.74-.3.49-.73.87-1.27 1.14l-.52.72zm6.5.08h-.02c-.28.53-.66.73-.99.73-.57 0-.99-.47-.99-1.19V9h-1v3.84c0 1.22.68 2.16 1.82 2.16.66 0 1.28-.32 1.68-.89V15h1V9h-1.5v4.19z', type: 'shortcuts' },
  { id: 'aftereffects', name: 'After Effects', icon: 'M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9.5 15H8l-.75-2H5l-.75 2H3l2.75-8h1l2.75 8zm-.95-3.5L7.5 8.5l-1.05 3h2.1zm8.45.69c0 1.69-1.03 2.81-2.69 2.81-.74 0-1.38-.21-1.89-.58l.53-.91c.42.29.85.46 1.33.46.89 0 1.5-.58 1.5-1.58v-.28c-.36.44-.87.69-1.5.69-1.17 0-2.06-.87-2.06-2.19s.89-2.19 2.06-2.19c.63 0 1.14.25 1.5.69V8.5h1.22v3.69z', type: 'shortcuts' },
  { id: 'illustrator', name: 'Illustrator', icon: 'M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9.5 15H8l-.75-2H5l-.75 2H3l2.75-8h1l2.75 8zm-.95-3.5L7.5 8.5l-1.05 3h2.1zM17 15h-1.5v-4.5h-1V15H13V9h4v6z', type: 'shortcuts' },
  { id: 'blender', name: 'Blender', icon: 'M12.5 2C9.46 2 7 4.46 7 7.5c0 1.33.47 2.55 1.26 3.5H5.5c-.83 0-1.5.67-1.5 1.5s.67 1.5 1.5 1.5h3.04A5.49 5.49 0 0012.5 17c3.04 0 5.5-2.46 5.5-5.5 0-1.04-.29-2.02-.8-2.85L20.45 6H18l-1.55 1.55C15.35 6.6 13.99 6 12.5 6c-1.62 0-3.08.7-4.1 1.81C8.15 7.05 8 6.29 8 5.5 8 3.57 9.57 2 11.5 2h1zm0 6c1.93 0 3.5 1.57 3.5 3.5S14.43 15 12.5 15 9 13.43 9 11.5 10.57 8 12.5 8z', type: 'shortcuts' },

  // Languages
  { id: 'english', name: 'Inglés', icon: 'M12.87 15.07l-2.54-2.51.03-.03A17.52 17.52 0 0014.07 6H17V4h-7V2H8v2H1v2h11.17C11.5 7.92 10.44 9.75 9 11.35 8.07 10.32 7.3 9.19 6.69 8h-2c.73 1.63 1.73 3.17 2.98 4.56l-5.09 5.02L4 19l5-5 3.11 3.11.76-2.04zM18.5 10h-2L12 22h2l1.12-3h4.75L21 22h2l-4.5-12zm-2.62 7l1.62-4.33L19.12 17h-3.24z', type: 'reference', lang: 'en-US' },
  { id: 'japanese', name: 'Japonés', icon: 'M12.87 15.07l-2.54-2.51.03-.03A17.52 17.52 0 0014.07 6H17V4h-7V2H8v2H1v2h11.17C11.5 7.92 10.44 9.75 9 11.35 8.07 10.32 7.3 9.19 6.69 8h-2c.73 1.63 1.73 3.17 2.98 4.56l-5.09 5.02L4 19l5-5 3.11 3.11.76-2.04zM18.5 10h-2L12 22h2l1.12-3h4.75L21 22h2l-4.5-12zm-2.62 7l1.62-4.33L19.12 17h-3.24z', type: 'reference', lang: 'ja-JP' },
  { id: 'periodictable', name: 'Tabla Periódica', icon: 'M3 3h18v18H3V3zm2 2v14h14V5H5zm2 2h2v2H7V7zm4 0h2v2h-2V7zm4 0h2v2h-2V7zM7 11h2v2H7v-2zm4 0h2v2h-2v-2zm4 0h2v2h-2v-2zM7 15h2v2H7v-2zm4 0h2v2h-2v-2zm4 0h2v2h-2v-2z', type: 'reference' }
]

export default { cheatsheetData, sheets }
