// Claves y valores ya normalizados (sin tildes, minúsculas)
export const SYNONYMS = {
  juntar: ['unir', 'combinar'], unir: ['juntar', 'combinar'], combinar: ['unir', 'juntar'],
  comprimir: ['reducir', 'optimizar'], reducir: ['comprimir', 'redimensionar'],
  excel: ['xlsx', 'hoja'], xlsx: ['excel'], hoja: ['excel', 'calculo'], csv: ['excel', 'hoja'],
  word: ['docx', 'documento'], docx: ['word'], doc: ['docx', 'word'],
  imagen: ['foto', 'jpg', 'png'], imagenes: ['imagen', 'foto'], foto: ['imagen'], fotos: ['foto', 'imagen'],
  jpeg: ['jpg'], jpg: ['jpeg'], png: ['imagen'],
  musica: ['audio'], sonido: ['audio'], mp3: ['audio'], cancion: ['audio'], wav: ['audio'],
  contrasena: ['password'], clave: ['contrasena', 'password'], password: ['contrasena'],
  colores: ['color'], hex: ['color'], rgb: ['color'], hsl: ['color'],
  tarea: ['tareas', 'kanban'], tareas: ['kanban', 'todo'], todo: ['kanban', 'tareas'], pendientes: ['tareas'],
  factura: ['facturas', 'invoice'], facturas: ['factura'], presupuesto: ['factura'],
  mapa: ['mapas'], mapas: ['mapa'], ruta: ['rutas', 'mapa'],
  http: ['api'], rest: ['api'], endpoint: ['api'],
  atajo: ['atajos'], atajos: ['chuleta', 'cheatsheet'], chuleta: ['chuletas', 'cheatsheet'], comandos: ['chuleta', 'referencia'],
  convertir: ['conversor', 'exportar'], pasar: ['convertir'], transformar: ['convertir'],
  editar: ['editor'], editor: ['editar'],
  medidas: ['unidades'], unidades: ['conversor', 'medidas'],
  vector: ['svg', 'vectorial'], vectorial: ['svg'], svg: ['vector'],
  firmar: ['firma'], firma: ['firmar']
}
