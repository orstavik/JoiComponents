# Pattern for loading a sync js file (alternative to requireJS)

```javascript
function globalPathExists(path){
  var segs = path.split(".");
  for (var obj = window; segs.length;){
    obj = obj[segs.shift()];
    if (!obj)
      return false;
  }
  return true;
} 

function addScript(src){
  const pp = document.createElement("script");
  pp.src = src;
  document.body.appendChild(pp);  
}

function runAfterDependencies(deps, delay, cb) {
  while (deps.length){
    if (globalPathExists(deps[0]))
      deps = deps.slice(1);
    else
      return setTimeout(() => runAfterDependencies(deps, delay, cb));
  }
  cb();
}

function loadAfterDependencies(deps, delay, src) {
  runAfterDependencies(deps, delay, function(){addScript(src);});
}

if (!globalPathExists("CodeMirror"))
  addScript("https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.43.0/codemirror.min.js");
if (!globalPathExists("CodeMirror.modes.javascript"))
  loadAfterDependencies(["CodeMirror"], 200, "https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.43.0/mode/javascript/javascript.js");
if (!globalPathExists("CodeMirror.modes.css"))
  loadAfterDependencies(["CodeMirror"], 200, "https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.43.0/mode/css/css.js");
if (!globalPathExists("CodeMirror.modes.xml"))
  loadAfterDependencies(["CodeMirror"], 200, "https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.43.0/mode/xml/xml.js");

function xxx(){
  var myCodeMirror = CodeMirror(document.getElementById("code"), {
    value: "<div>something</div>",
    mode:  "text/html"
  });
}

runAfterDependencies(["CodeMirror.modes.javascript", "CodeMirror.modes.css", "CodeMirror.modes.xml"], 200, xxx); 

```