# Pattern: PolyfillLoaderGenerator

Ok, we have the full polyfill-loader. It is nice.
We can add it as a link to our page, or we can inline it.
But. There is one problem. 
Being so flexible, it is also a bit big!
I wan't to run this synchronously, and then I don't want that many bytes to neither load nor run.
Also, I have different apps that need different polyfills. 
I don't want to neither hand-write nor maintain the polyfills.

The solution is the PolyfillGenerator.
You tell the PolyfillGenerator which polyfills you need, and 
the PolyfillGenerator creates a short snippet of JS code that 
you can inline in your html-entrypoint file (ie. index.html).
This code contains a custom micro-framework that:
 * does FeatureDetection for the polyfill you need,
 * loads the polyfill async or sync depending on your specification,
 * patches the polyfill if needed,
 * adds a small `window.polyfill` framework needed that includes 
 the `polyfill.ready()` facility if you want it, and 
 * adds triggers in addition to for when you want to load it.

<1--1. You select if you want the polyfills to be loaded async or sync.

2. Then you specify which polyfills you desire, such as "WC, WA, PE, CE, PR, etc.".
These polyfills are added as short codes to make them usable and recognizeable as codes 
in generated links.

3. Then you select if you want and need a `polyfill.ready` framework.
   * if so, all polyfills are flagged to halt `polyfill.ready` by default,
   * but if you add a "-" infront of the code, it will not halt the `polyfill.ready`.
   * if no `polyfill.ready`, no polyfills need any flags of course.

4. Then you specify if you want to run `polyfill.ready`:
   * as soon as all polyfills are loaded
   * as soon as all polyfills are loaded *and* DOMContentLoaded has happened.
   * specify your own time to run `polyfill.ready`.
   
5. Which browsers you would like to support.
This will give you an overview of which features you (no longer) need to polyfill.
This can also reduce the amount of time you need to 

Based on these changes the polyfill loader will generate a minified piece of code 
you can inline in your page. The code contains a minified version of:
1. FeatureDetection for the polyfills you need.
2. Function(s) to load polyfill async, sync or both.
3. `window.polyfill.ready()` framework if required.
4. functions to augment the `window.polyfill.ready()` framework if required.

You can use this codepen.io PolyfillLoaderGenerator if you like, 
or ...
-->
The PolyfillLoaderGenerator can also calculate the ETA of the polyfill(s) for different browsers 
and for all the browsers in total.
This will give you an idea of how *much* adding a certain feature to your dev environment costs
in production. 