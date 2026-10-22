// Zero-dependency server: serves the site and proxies price search (SerpAPI, Google SG).
// Run: set SERPAPI_KEY=xxxx ; node server.js   -> http://localhost:3000
const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;
const KEY = process.env.SERPAPI_KEY || '';
const RESALE = ['carousell', 'ebay', 'facebook.com/marketplace', 'mudah', 'reddit', 'gumtree', 'buyee', 'mercari'];
const TYPES = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml' };

function getJSON(url) {
  return new Promise((resolve, reject) => {
    https.get(url, r => {
      let d = '';
      r.on('data', c => (d += c));
      r.on('end', () => { try { resolve(JSON.parse(d)); } catch (e) { reject(e); } });
    }).on('error', reject);
  });
}

const serp = params =>
  getJSON('https://serpapi.com/search.json?' + new URLSearchParams({ gl: 'sg', hl: 'en', google_domain: 'google.com.sg', api_key: KEY, ...params }));

const isResale = s => RESALE.some(r => (s || '').toLowerCase().includes(r));
const host = u => { try { return new URL(u).hostname.replace(/^www\./, ''); } catch { return ''; } };

async function search(q) {
  const [shop, resale] = await Promise.all([
    serp({ engine: 'google_shopping', q: q + ' Singapore' }),
    serp({ engine: 'google', q: q + ' (site:carousell.sg OR site:sg.carousell.com OR "second hand" OR used)', num: '10' }),
  ]);
  const items = [];
  for (const r of shop.shopping_results || []) {
    const price = r.extracted_price;
    if (!price) continue;
    const link = r.product_link || r.link || '';
    items.push({ title: r.title, store: r.source || host(link), price, link, type: isResale(r.source) ? 'resale' : 'new' });
  }
  for (const r of resale.organic_results || []) {
    const m = /(?:S\$|SGD)\s?([\d,]+(?:\.\d+)?)/i.exec(`${r.title} ${r.snippet || ''}`);
    if (!m || !isResale(r.link)) continue;
    items.push({ title: r.title, store: host(r.link), price: parseFloat(m[1].replace(/,/g, '')), link: r.link, type: 'resale' });
  }
  return items;
}

http.createServer(async (req, res) => {
  const u = new URL(req.url, 'http://x');
  if (u.pathname === '/api/search') {
    res.setHeader('Content-Type', 'application/json');
    const q = (u.searchParams.get('q') || '').slice(0, 150).trim();
    if (!q) { res.statusCode = 400; return res.end('{"error":"missing q"}'); }
    if (!KEY) return res.end(JSON.stringify({ configured: false, items: [] }));
    try { res.end(JSON.stringify({ configured: true, items: await search(q) })); }
    catch (e) { res.statusCode = 502; res.end(JSON.stringify({ error: 'search failed' })); }
    return;
  }
  const file = path.join(__dirname, u.pathname === '/' ? 'index.html' : path.normalize(u.pathname).replace(/^(\.\.[\\/])+/, ''));
  if (!file.startsWith(__dirname) || path.basename(file) === 'server.js' || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
    res.statusCode = 404; return res.end('Not found');
  }
  res.setHeader('Content-Type', TYPES[path.extname(file)] || 'application/octet-stream');
  fs.createReadStream(file).pipe(res);
}).listen(PORT, () => console.log(`Should I Buy? on http://localhost:${PORT}  (search ${KEY ? 'ON' : 'OFF - set SERPAPI_KEY'})`));
