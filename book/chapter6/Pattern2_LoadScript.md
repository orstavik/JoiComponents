# Pattern 2: DynamicallyLoadScript

## Pattern 2a: DynamicallyLoadScriptAsync
A script can be loaded **async**hronously like this:
1. Create a new `<script>` element.
2. Add the link to the polyfill as this `<script>` elements `src`.
3. Append this script to the `<head>` element in the document. 
When you append a script to the `<head>` element, 
that script will run *after* the whole page has finished loading (async).
4. Add a custom callback function that will be called when the script has loaded.
5. Add a generic callback function if the script fails to load.                                              

```javascript
function loadScriptAsync(url, onLoadFn) {
  const script = document.createElement("script");
  script.src = url;
  if (onLoadFn)
    script.addEventListener("load", onLoadFn);
  script.addEventListener("error", (err) => {throw new URIError("The script " + url + " didn't load correctly.");});
  document.head.appendChild(script);
}
```
## Pattern 2b: DynamicallyLoadScriptSync
To load a script **sync**hronously is very similar to loading a script asynchronously.
First, you make a `<script>` with a `src` link as in the previous example.
But then, instead of appending the `<script>` to the document `<head>`, 
you use `document.write` to directly place the `<script>` into the document immediately.
By using `document.write` you will force the browser to run the script synchronously,
*before* the browser runs any other remaining scripts or renders any coming html elements.
Sync loading of scripts thereby halts both:
1. the rendering of the remainder of the html document and 
2. the execution of later scripts.

```javascript
function loadScriptSync(url, onDOMContentLoaded, onLoadFnAsString) {
  const script = document.createElement("script");
  script.src = url;
  script.setAttribute('onload', onLoadFnAsString);
  script.setAttribute('onerror', "throw new URIError('The script " + url + " didn't load correctly.')");
  document.write(script.outerHTML);
  document.addEventListener('DOMContentLoaded', onDOMContentLoaded);
}
```

### References
* [webcomponentsjs-loader.js](https://github.com/webcomponents/webcomponentsjs/blob/master/webcomponents-loader.js).
* [MDN on dynamically loading scripts](https://developer.mozilla.org/en-US/docs/Web/API/HTMLScriptElement).