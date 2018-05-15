# Introduction: What's a polyfill?

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

## What is a polyfill?
A "polyfill" is a javascript file that patches an old 
browser so that it can closely mimic the functionality of a new browser.                      
The idea is: add a couple of JS files to your web page, and 
they will make any old browser behave as good as new.

But, there are two main concerns when you need to polyfill your browsers: invasiveness and adaptation. 

## Polyfill problem 1: polyfills are invasive and need to be accomodated
Most features of a browser are very tricky to polyfill.
Many new features of a browsers require access to underlying infrastructure in the browser
that are not accessible from JS.
The polyfills for webcomponents, and especially the shadowDOM polyfill, are examples of such 
features that are hard to polyfill both *correctly* and *efficiently*.
When polyfilling such features, the feature is often mimicked, rather than precisely patched.

Because polyfills are invasive and often only mimic the platform behavior, and not exactly copying it,
the app that relies on polyfills must often accommodate minor differences both in:
* the loading of the polyfill, 
* the use of the API, and especially 
* the interface between the loading of the polyfill and use of the API.

## Polyfill problem 2: browsers need different polyfills and so the polyfill need to adapt
Browsers are "old" and "new" in different areas. 
For example, Safari 10.3+ supports customElements and shadowDom, but not JS pointerevents. 
Edge 16 and Firefox 60 on another front supports pointerevents, but not customElements and shadowDom. 
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