const CACHE="insulin-dose-calculator-v5";
const ASSETS=[
 "./","./index.html","./styles.css?v=5","./insulin_app.js?v=5","./manifest.webmanifest",
 "./icon.svg","./icon-192.png?v=5","./icon-512.png?v=5","./apple-touch-icon.png?v=5"
];
self.addEventListener("install",e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS))));
self.addEventListener("activate",e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k))))));
self.addEventListener("fetch",e=>{
  if(e.request.method!=="GET")return;
  e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request).then(resp=>{
    const copy=resp.clone();caches.open(CACHE).then(c=>c.put(e.request,copy));return resp;
  }).catch(()=>caches.match("./index.html"))));
});