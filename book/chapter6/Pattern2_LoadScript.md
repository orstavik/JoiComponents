# Pattern 2: DynamicallyLoadScript

## Pattern 2a: DynamicallyLoadScriptAsync
A script can be loaded **async**hronously like this:
1. Create a new `<script>` element.
2. Add the link to the polyfill as this `<script>` elements `src`.
3. Append this script to the `<head>` element in the document. 
When you append a script to the `<head>` element, 
that script will not run *after* the whole page has finished loading (async), 
not as immediately as it is added (sync).
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
thus halting both:
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

## Polyfilling web components: async?
The benefit of loading scripts **async** is that the script you are adding will not block the rendering of your page, 
neither while you:
1. download the script nor 
2. execute the script. 
This means that if you have a series of html elements coming after the loading of the script,
the browser will not delay rendering these elements until                                          
after you have finished both downloading and then executed the new script.
However, the drawback of async loading is that the features in your script are not ready straight away.
This is especially important for polyfills which you intend other parts of your code to rely on.
This means that even though other scripts are added to the DOM later than your script,
these scripts must make sure that any code that relies on the polyfill must:
1. queued and then later
2. re-called, when the polyfill has finished loading/is ready.
This we will look at in the next chapter.

<!--
The benefit of loading scripts async is that neither 
a) download the script nor b) the execution of the script will
block the rendering of your page. 
This means that if you have a series of html elements coming after the loading of the polyfill,
the browser will not delay rendering these elements until                                          
after you have finished both downloading and then executed the polyfill script.
However, the drawback of async loading is that the features you polyfill will 
only be ready at a later point in time. This means that you cannot rely on this feature being ready,
even though other scripts are added to the DOM later than your script that feature-detects and 
loads the polyfills.
And in turn, this means that all functions you call that relies on your polyfill must first be:
1. queued and then later
2. re-called, when the polyfill has finished loading/is ready.
-->



### References
* [webcomponentsjs-loader.js](https://github.com/webcomponents/webcomponentsjs/blob/master/webcomponents-loader.js).
* [MDN on dynamically loading scripts](https://developer.mozilla.org/en-US/docs/Web/API/HTMLScriptElement).