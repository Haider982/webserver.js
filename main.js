const http = require('http')
const fs = require('fs')
const path = require('path')
const { URL } = require('url')

const PORT = process.env.PORT || 3000
const docsDir = path.join(__dirname, 'docs')
const docsDirResolved = path.resolve(docsDir)

const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.htm': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.txt': 'text/plain; charset=utf-8'
}

const server = http.createServer((req, res) => {
  try {
    const base = `http://${req.headers.host}`
    const parsed = new URL(req.url, base)
    let pathname = decodeURIComponent(parsed.pathname)

    // Default to index.html for root
    if (pathname === '/') pathname = '/index.html'

    // Prevent path traversal
    const requestedPath = path.join(docsDir, pathname)
    const resolvedPath = path.resolve(requestedPath)
    if (!resolvedPath.startsWith(docsDirResolved + path.sep) && resolvedPath !== docsDirResolved) {
      res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' })
      res.end('403 Forbidden')
      return
    }

    fs.stat(resolvedPath, (err, stats) => {
      if (err || !stats.isFile()) {
        res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' })
        res.end('404 Not Found')
        return
      }

      const ext = path.extname(resolvedPath).toLowerCase()
      const contentType = mimeTypes[ext] || 'application/octet-stream'

      res.writeHead(200, { 'Content-Type': contentType })
      const stream = fs.createReadStream(resolvedPath)
      stream.on('error', (streamErr) => {
        console.error('File stream error:', streamErr)
        if (!res.headersSent) res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' })
        res.end('500 Internal Server Error')
      })
      stream.pipe(res)
    })
  } catch (e) {
    console.error('Request handling error:', e)
    res.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8' })
    res.end('400 Bad Request')
  }
})

server.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}/ (serving files from ${docsDirResolved})`)
})