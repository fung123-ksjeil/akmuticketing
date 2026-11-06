import http from 'node:http';
import {readFile} from 'node:fs/promises';
import {resolve, extname} from 'node:path';
const root=resolve(import.meta.dirname);
http.createServer(async(req,res)=>{
 try {
  const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
  const file=resolve(root,'.'+(pathname==='/'?'/index.html':pathname));
  if(!file.startsWith(root+'/')||pathname.includes('/.')) {res.writeHead(403).end();return;}
  const allowed=['.html','.css','.js','.json','.md'];
  if(!allowed.includes(extname(file))) {res.writeHead(404).end();return;}
  const body=await readFile(file);
  res.writeHead(200,{'Content-Type':({'.html':'text/html; charset=utf-8','.css':'text/css','.js':'text/javascript','.json':'application/json','.md':'text/plain; charset=utf-8'})[extname(file)],'X-Content-Type-Options':'nosniff'}).end(body);
 }catch{res.writeHead(404).end('Not found');}
}).listen(Number(process.env.PORT||3000),'127.0.0.1',()=>console.log('Ticket helper listening on port '+(process.env.PORT||3000)));
