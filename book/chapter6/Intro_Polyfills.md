# Introduction: What's a polyfill?

## What is a polyfill?
A "polyfill" is a javascript file that patches an old 
browser so that it can closely mimic the functionality of a new browser.                      
The idea is: add a couple of JS files to your web page, and 
they will make any old browser behave as good as new.

But, there are three concerns when you need to polyfill your browsers: 
invasiveness, approximation and variation. 

## Polyfill problem 1: invasiveness
Often, the new feature or API that you want to use and therefore polyfill can require 
subtle changes to other functions that are frequently used.
The customElements polyfill for example adds Observers to the entire DOM 
while the main document is being loaded and patches other seemingly unrelated functions 
such as `.innerHTML` in order for the new custom elements feature to function.
Such fundamental and wide-reaching changes to core functionality of the DOM are *invasive*. 

Because a polyfill might deeply and widely interfere with the behavior of the platform,
both:
* the loading of the polyfill, 
* the use of the API, and especially 
* the interface between the loading of the polyfill and use of the API.
needs to be accomodated.

## Polyfill problem 2: approximation
Many new features of a browser are very tricky to polyfill.
The new features might require access to underlying infrastructure in the browser
that are not reachable from JS.
The shadowDOM polyfill is a good example of a new feature that is close to impossible 
to polyfill *correctly*.
 
The shadowDOM polyfill is also a good example of a new feature that is hard to polyfill *efficiently*.
The changes required to turn an existing, old, no-shadow-DOM into a new, shadow-DOM are complex
and take time both to set up and work against.
This can make it necessary to "cut som corners" in the polyfill; to make the polyfill fast enough, 
some edge-cases or too invasive aspects of the new feature are deliberately broken.
In such instances the polyfill attempts to mimick efficiently, but not exactly, 
some aspects of the new feature.

Such mimickery, or *approximations*, in the polyfill can lead the developer into trouble.
Web developers are already accustomed to varying behavior between browsers, and 
such variations are likely to be present when polyfilling as well.
These variations must also be accomodated by the developer, 
not only in relation to loading the polyfill, but also in using the polyfilled features. 

## Polyfill problem 3: variation
Browsers vary and are "old" and "new" in different areas. 
For example, Safari 10.3+ supports customElements and shadowDom, but not JS pointerevents. 
Edge 16 and Firefox 60 on another front supports pointerevents, but not customElements nor shadowDom. 
This differences also change over time. 
Firefox is expected to ship customElements and shadowDom soon (summer 2018?). 
And back in 2017, Safari 10.0 supported only shadowDom, not Custom Elements.
The lines of what needs to be polyfilled is always changing, 
most often gradually shrinking the space for the polyfills.

Because different browsers need different polyfills, we are faced with a choice:
1. **Polyfill always**, regardless of whether or not they are needed. 
This produces simple, short code, but causes many browsers to download many unwanted files often.
2. **Feature detection**. Find out which polyfills you need and download only these. 
This can greatly reduce the network traffic, but at the cost of more verbose, complex code.

## How to polyfill web components?
To use web components, you need three web component APIs: 
CustomElements, shadowDom and HTMLTemplate. 
Both Chrome and Safari support all three APIs (May 2018).
Firefox supports the HTML Template API and 
supports CustomElements and shadowDom behind a flag.
This means that more than 2/3 of your users no longer need to polyfill web components, and
soon this number will rise to 85%.

Due to the widespread support of web components APIs, 
most of your users no longer need any web component polyfills.
In fact, if you choose to *polyfill always*, 
your users will have to download at least **3x as many JS files** as if you use *feature detection*.
This is cavalier.
Therefore, use **feature detection** when you are polyfilling web components.

Polyfilling shadowDom and customElements also require some accomodations on the part of the developer.
This is especially evident when loading the polyfill. 
When loading the polyfill the developer should especially make sure that no function that 
requires the polyfills are run *before* the polyfill is ready.
As the shadowDom and customElements basically invade the DOM, 
this often, but not always, translates into any function that query or manipulate the DOM.

In this chapter we will look at patterns for loading polyfills and 
accomodating polyfills during loading.
                                                                                
### References
* [webcomponentsjs](https://github.com/webcomponents/webcomponentsjs/).
* [webcomponentsjs-loader.js](https://github.com/webcomponents/webcomponentsjs/blob/master/webcomponents-loader.js).

<!--

Custom elements and shadowDom provide an excellent interface for integrating custom HTML+JS+CSS modules. 
Custom elements provide a great means both to organize and stabilize your own work and 
collaborate with others. It might not be perfect. And it needs to be polyfilled in old browsers. 
But it will still provides you with the only, cleanest and simplest API for making native HTML+JS+CSS modules.

Other times, you might want to process the other parts of your web page first,
you prioritize the rendering of images and other, normal HTML template.
If you added the polyfills synchronously, 
this part of your web presentation would be halted while you download and process the polyfills.

The smart move, if you can, is to avoid having to rely on web components for your initial paint.
That is likely to give you a visible front for your page much quicker, especially on a slow network.
To do so, you must load your web component polyfills asynchronously.
-->

<!--
This chapter is built upon all the good work of webcomponentsjs.org.
Where webcomponentsjs.org and the polyfill community really shines is in their ethos:
Polyfills are at the same time both inclusive and modest, both deeply powerful and widely spread.
Polyfills helps browsers unite into a common platform, thus 
helping to protect the diversity of the browser community (by helping browsers either too old or 
struggling in different areas) to catch up with the pack and stay alive.
Polyfills also help developers by giving them a united and open standard against which to
align their code, so as to both alleviate the suffering it can be to work against different 
frameworks and across different development methodologies. 
In short, polyfills make us all stronger by helping us work closer together,
they are a prime example of unique open-source excellence.
                                                                           
Hence, in addition to providing clear recipes for adding polyfills to your web app,
this chapter also aspires to explain the ideas behind webcompontents-loader.js.
Again, many thanks for the great work and inspirational ethos of the polyfill community!
-->
