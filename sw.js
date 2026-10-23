// Versión f9969d58e3: cambia con cada nueva versión de la app, así el iPad descarga la nueva al tener conexión
const C='batido-f9969d58e3', F='batido-fuentes';
const FILES=['./','index.html','manifest.webmanifest','icon-180.png','icon-192.png','icon-512.png'];
self.addEventListener('install',e=>{ e.waitUntil(caches.open(C).then(c=>c.addAll(FILES.map(f=>new Request(f,{cache:'reload'})))).then(()=>self.skipWaiting())); });
self.addEventListener('activate',e=>{ e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==C&&k!==F).map(k=>caches.delete(k)))).then(()=>self.clients.claim())); });
self.addEventListener('fetch',e=>{
  const r=e.request; if(r.method!=='GET') return;
  const u=new URL(r.url);
  if(u.origin===location.origin){
    // Primero lo guardado (abre al instante y sin internet); se actualiza en segundo plano si hay conexión
    e.respondWith(caches.open(C).then(async c=>{
      const hit=await c.match(r,{ignoreSearch:true}) || (r.mode==='navigate' ? await c.match('index.html') : null);
      const net=fetch(r,{cache:'no-cache'}).then(res=>{ if(res.ok) c.put(r,res.clone()); return res; }).catch(()=>null);
      if(hit){ e.waitUntil(net); return hit; }
      return (await net) || new Response('Sin conexión',{status:503});
    }));
  } else if(u.hostname==='fonts.googleapis.com'||u.hostname==='fonts.gstatic.com'){
    // Tipografías: se guardan la primera vez que se abren con conexión
    e.respondWith(caches.open(F).then(async c=>{
      const hit=await c.match(r); if(hit) return hit;
      try{ const res=await fetch(r); if(res.ok||res.type==='opaque') c.put(r,res.clone()); return res; }catch(err){ return new Response('',{status:503}); }
    }));
  }
});
