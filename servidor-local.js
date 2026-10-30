// Mini servidor estático para probar Mundo Fútbol
const http = require('http');
const fs = require('fs');
const path = require('path');
const root = process.argv[2];
const port = parseInt(process.argv[3] || "8123", 10);
const tipos = { ".html": "text/html; charset=utf-8", ".css": "text/css; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".json": "application/json", ".png": "image/png" };
// Archivos que el navegador puede sobrescribir vía POST (solo desarrollo local)
const GUARDABLES = ["/icon-192.png", "/icon-512.png"];
http.createServer((req, res) => {
    let p = decodeURIComponent(req.url.split('?')[0]);
    if (req.method === "POST" && GUARDABLES.includes(p)) {
        const chunks = [];
        req.on('data', c => chunks.push(c));
        req.on('end', () => {
            fs.writeFileSync(path.join(root, p), Buffer.concat(chunks));
            res.writeHead(200); res.end("ok");
        });
        return;
    }
    if (p === "/" || p === ".") p = "/index.html";
    const file = path.join(root, p);
    if (!file.startsWith(root)) { res.writeHead(403); return res.end(); }
    fs.readFile(file, (err, data) => {
        if (err) { res.writeHead(404); return res.end("404"); }
        res.writeHead(200, { "Content-Type": tipos[path.extname(file)] || "application/octet-stream" });
        res.end(data);
    });
}).listen(port, () => console.log("Sirviendo " + root + " en http://localhost:" + port));
