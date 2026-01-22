export function useKanbanExport() {
  function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  function exportJSON(board) {
    const data = JSON.stringify(board, null, 2)
    const blob = new Blob([data], { type: 'application/json' })
    downloadBlob(blob, `${board.name || 'kanban'}.json`)
  }

  function exportCSV(board) {
    const headers = ['Column', 'Title', 'Description', 'Priority', 'DueDate', 'Tags', 'Subtasks', 'CreatedAt']
    const rows = []

    for (const col of board.columns) {
      for (const task of col.tasks) {
        const tagNames = (task.tags || [])
          .map(tid => (board.tags || []).find(t => t.id === tid))
          .filter(Boolean)
          .map(t => t.name)
          .join('; ')

        const subtaskStr = (task.subtasks || [])
          .map(s => `[${s.done ? 'x' : ' '}] ${s.title}`)
          .join('; ')

        rows.push([
          col.title,
          task.title,
          task.description || '',
          task.priority || 'medium',
          task.dueDate || '',
          tagNames,
          subtaskStr,
          task.createdAt ? new Date(task.createdAt).toISOString() : ''
        ])
      }
    }

    const escapeCSV = (str) => {
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return '"' + str.replace(/"/g, '""') + '"'
      }
      return str
    }

    const csv = [headers.join(','), ...rows.map(r => r.map(escapeCSV).join(','))].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
    downloadBlob(blob, `${board.name || 'kanban'}.csv`)
  }

  function exportMarkdown(board) {
    let md = `# ${board.name || 'Kanban Board'}\n\n`

    for (const col of board.columns) {
      md += `## ${col.title}\n\n`
      for (const task of col.tasks) {
        const priorityEmoji = { high: '!', medium: '-', low: '.' }[task.priority || 'medium']
        md += `### [${priorityEmoji}] ${task.title}\n`
        if (task.description) md += `\n${task.description}\n`
        if (task.dueDate) md += `\n**Fecha:** ${task.dueDate}\n`
        if (task.tags && task.tags.length) {
          const tagNames = task.tags
            .map(tid => (board.tags || []).find(t => t.id === tid))
            .filter(Boolean)
            .map(t => t.name)
          if (tagNames.length) md += `**Tags:** ${tagNames.join(', ')}\n`
        }
        if (task.subtasks && task.subtasks.length) {
          md += '\n'
          for (const sub of task.subtasks) {
            md += `- [${sub.done ? 'x' : ' '}] ${sub.title}\n`
          }
        }
        md += '\n'
      }
    }

    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' })
    downloadBlob(blob, `${board.name || 'kanban'}.md`)
  }

  function importJSON(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target.result)
          if (!data.columns || !Array.isArray(data.columns)) {
            reject(new Error('Formato inválido: falta el array de columnas'))
            return
          }
          resolve(data)
        } catch (err) {
          reject(new Error('Error al parsear JSON: ' + err.message))
        }
      }
      reader.onerror = () => reject(new Error('Error leyendo archivo'))
      reader.readAsText(file)
    })
  }

  return {
    exportJSON,
    exportCSV,
    exportMarkdown,
    importJSON,
    downloadBlob
  }
}
