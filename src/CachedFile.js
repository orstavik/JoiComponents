function stripQueryHash(url){
  var q = url.indexOf("?");
  var h = url.indexOf("#");
  if (q === -1 && h === -1)
    return url;
  if (h === -1 || q === -1)
    return url.substring(0, Math.max(q, h));
  return url.substring(0, Math.min(q, h));
}

function getType(filename) {
  filename = stripQueryHash(filename);
  let ext = filename.split(".").pop();
  let types = {
    html: 'text/html',
    css: 'text/css',
    js: 'application/javascript',
    json: 'application/json'
  };
  return types[ext];
}

function makeResponse(content, mimetype, url) {
  let myBlob = new Blob([content], {type: mimetype || getType(url)});
  let init = {"status": 200, "statusText": "SuperSmashingGreat!"};
  return new Response(myBlob, init);
}

const localCache = caches.open("testLocal");             //Att!! caches.open is async
const globalCache = caches.open("testGlobal");           //Att!! caches.open is async

export class CachedFile {

  static async put(url, content, type) {

    const request = new Request(url);
    const response = makeResponse(content, type, url);

    await globalCache;                        //globalCache might still be a promise
    if (!globalCache.match(request))          //first time a local resource is
      globalCache.put(request, response);

    await localCache;                         //localCache might still be a promise
    localCache.put(request, response);
    window.dispatchEvent(new CustomEvent("cachechange", {detail: {url, content, type}}));
  }

  static async clearChanges(url) {
    await localCache;                         //localCache might still be a promise
    await globalCache;                        //globalCache might still be a promise
    const request = new Request(url);
    const global = globalCache.match(request);
    if (!global)
      throw new Error("Url has not been cached globally: " + url);
    localCache.put(request, global);
  }

  // static async observeChangesOnServer(url, TTL) {
  //   //todo Use some kind of polling algorithm to check the server for changes.
  //   //todo One would use the globalCache to check for changes.
  // }
}