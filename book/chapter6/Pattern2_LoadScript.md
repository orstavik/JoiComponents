# Pattern 2: DynamicallyLoadScript

## Pattern 2a: DynamicallyLoadScriptAsync
In order to load a script **async**hronously you:
1. create a new `<script>` element,
2. add the link to the polyfill as this `<script>` elements `src`, and
3. append this script to the `<head>` element in the document. 
(When you append a script to the `<head>` element, that script will be loaded **async**hronously.)
4. add a custom callback function that will be called when the script has loaded,
   and a generic callback function if the script fails to load.                                              

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
## Polyfilling web components: sync?
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

## Polyfilling web components: sync?
Sometimes you need the polyfills for web components straight away. 
Your web app contains code that cannot function without the polyfill in place, and
you have no way good of queing or delaying that code.
In such cases, you need to control *when* your polyfill is loaded, and 
then you want to load your polyfill *sync*hronously.

The benefit of loading your polyfill sync is that you will ensure that the features 
you have polyfilled will be present for scripts will run at a later point.
This means that you no longer have to que and re-call functions that rely on 
the potentially polyfilled API features.

However, que and re-call functions in one fell swoop also has some other advantages.
For example: Lets say you have a web page with 10 different custom elements.
Each of these elements greatly change their size and shape and appearance once they get 
connected to the DOM. Now, if you update all these web components one by one, and 
these operations happens to be spread out across time and different frames,
then your web page might completely change its appearance every time one of the elements gets 
updated, ie. 10 times or more. (todo make a test for this one)
((**Sync** loading of polyfills also can benefit from making sure that 
polyfill-dependent functions are batched and called as a group at a later time:
Such calls can both be more efficient for the polyfill, and avoid actions being spread out over time 
causing for example a flickering layout.))

When using polyfills, the process of updating the page can be quite intensive, and 
therefore batching all the updates of the web components can be smart.
This makes queing and re-calling all functions of a certain type regardless of whether or 
not an underlying dependency is present, and 
so even apps that load polyfills sync can benefit from queing and re-calling functions that 
depend on the polyfill regardless. 



### References
* [webcomponentsjs-loader.js](https://github.com/webcomponents/webcomponentsjs/blob/master/webcomponents-loader.js).
* [MDN on dynamically loading scripts](https://developer.mozilla.org/en-US/docs/Web/API/HTMLScriptElement).