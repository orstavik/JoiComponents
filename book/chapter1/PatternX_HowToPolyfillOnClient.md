## Polyfill
 -- updated 26. april 2018

To run the patterns described in this book, your browser always needs to support:

1. es6 classes          (always in both patterns and mixins)
2. Custom Elements v1   (always in both patterns and mixins)
3. ShadowDom v1         (most often in both patterns and mixins)
4. HTML Templates       (most often in both patterns and mixins)
5. es6 symbols          (always in the mixins, not necessary in the patterns)

In addition, some isolated functional mixins require polyfills of other parts of the HTML platform.

* ResizeObserver        (SizeChangedMixin)
* IntersectionObserver  (EnterViewMixin)
* Pointer events        (DraggingEventMixin)

### Polyfilling to es5
~90% browsers today on both web and mobile support es6 classes. 
This means that it is only around 10% of your users browsers (read: Internet Explorer (IE) and a few Safari 8)
that needs es5. 
To run any web components on IE and Safari 8 require that the code be transpiled down to es5.
However, once the es6 classes with your web components are transpiled down to es5, you get a new problem:
Modern browsers that support Custom Elements v1 natively (ie. Chrome and Safari 9+ = ~80%) 
*must* have custom elements be declared as proper es6 classes. 
Therefore, if you transpile your project down to es5, you will need to polyfill (or rather patch)
Chrome and Safari and soon probably Firefox too, to tackle custom elements defined in es5.
Give links to such sites.

The solution above is bad. First of all, it adds a lot of complexity to all your code.
None of the code you ship is in its original es6 format, 
even though 90% of your users browsers support es6. 
In addition, if you are working in es6, you are adding a lot of complexity of transpiling 
with Babel in your common build and adding the complexities of both the patches needed for 
running transpiled es5 code and patches to "downgrade" Chrome and Safari 9+ to tackle the mess.

As the need to support es5 is dwindling fast, it might be considered a better approach to 
split out code that runs on es5 into a separate subdomain.
If your web app runs on `https://example.com`, you create a separate subdomain `https://ie.example.com`
and then redirect your users to this domain when their browser do not support es6.
In this way, any mess that might come due to polyfilling and supporting es5 is isolated 
away from your 90% application.

```javascript
function es6(){                                                 
  try {                                                           
    eval("class C{}");
  } catch (e) { 
    return false; 
  }
  return true;
}
if (!es6()){ //the simpler (!window.Promise || !Array.from) can be shimmed, so this is not 100% safe
  //you have an old browser. redirect to https://ie.example.com
}

```
Inside `es5.example.com` the polyfilled code needs
1. to be transpiled
2. add babel-helpers.min.js
3. add polyfill for customElements, templates, and shadowDom

Yes. This is treating users with older browsers as second rate. Yes, you will probably loose some users
that needs to run on the old platform. Yes, this is a forceful push to get users to switch or upgrade their
browser. If such a move is unnacceptable, then use the es5 approach.

However, if you reduce the complexity in your app, you make room for... more complexity.
Put another way: the mental overhead coming from build tools and special cases needed to support IE might
just be the thing preventing you from adding the extra functionality to your app that separates it from the 
rest of the pack and enable you to grow exponentially in the evergreen browser marked. Sure. 
It is not a super democratic and inclusive strategy. But. Ask yourself this: 
What is the threshold for this web app to drop equal support for es5? 
Should I always support es5? Even if the number of users drop below 2-3%? 
And, do my es5 users likely have access to an es6 browser if they need it? 
And would my es5 users also appreciate more potential new user complexity if that is what I can give them?
These are not easy questions. Big institutional actors likely cannot go the route here advocated. 
But many small actors I think are better suited following a simpler build and deploy route than trying to
fullfill all the minimum requirement of large corporations or government sites.

### Polyfilling based on es6
Browsers 
Once es5 and IE and Safari 8 is taken care of, Firefox and Edge (~10%) still needs to polyfill
Custom Elements and shadowDom. There are two approaches you can take here: 
load the polyfill over the network regardless or load the polyfill over the network only if you need it.

#### Load all the webcomponents polyfills in sync regardless of the browser used

To download the 
https://cdnjs.cloudflare.com/ajax/libs/webcomponentsjs/1.2.0/webcomponents-lite.js


#### Load as little of the polyfill as needed async depending on the browser
To download the 

https://cdnjs.cloudflare.com/ajax/libs/webcomponentsjs/1.2.0/webcomponents-loader.js

#### Listen for the webcomponentsReady event

When you are using a polyfill for Custom Elements and Shadow DOM, 
you cannot access the dom before this polyfill has loaded.





As of April 2018, there is more than  [78.6% of browsers support Custom Elements v1](https://caniuse.com/#search=custom%20Elements%20v1). 
However, most developers would like their web apps to support more than this.
To do so, you must include 
[the custom-elements polyfill "at the beginning of your page, before any code that manipulates the DOM"](https://github.com/webcomponents/custom-elements).
https://caniuse.com/#search=es6%20classes


<!--
Web components are not fully supported by all browsers in use, and therefore some polyfills must be included 
to patch the browsers that need it. This is described in the first part of this book. 
-->