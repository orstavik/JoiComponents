# To sync or async? That is the web components polyfill question

## Drawback of sync and async
The main drawback of loading a script sync, is that it will:
* delay the rendering of later parts of the DOM, and
* delay the running of later scripts.

The most immediate cure for this ill, is to place the sync script *after* 
1. the other DOM template that you want to display immediately and 
2. scripts that can be executed asynchronously be marked `defer` or `async` 
and placed *before* the sync script.

Another cure for this ill is to load the script *async*.
If you load your script async, the browser will not delay 
later scripts nor the rendering process. 
Neither while the polyfill script is downloaded nor executed.
That sounds great! But.. is it always?

To load web component polyfills script async has one mayor downside.
If some functions in other scripts depend on the polyfill script 
(such as queries or manipulations against the DOM in web components),
these functions must likely be delayed until the web component polyfill script 
has loaded and is ready.
This in turn means that you have to identify which functions are affected, and then 
somehow delay them, and then somehow restart them when the polyfill is ready.

The simplest path to accomplish this is to:
1. Set up a functions que. 
2. Add the functions manipulating the DOM into this que. 
This change must be done inside all the other affected scripts in your app.
3. Trigger this que from the polyfill loader.

To load your web components async is therefore both complex *and* spills over into your other scripts.
The complexity in itself is not necessarily a show-stopper, but 
the fact that all other scripts must relate to and place their functions in a particular que 
most certainly can be.

### Polyfills, constraints and micro-frameworks
When working with polyfills, limitations in the polyfill can reduce the number of features 
or the extent to which we might use a feature on the platform. 
We can call this "platform constraints".
On the other hand, when we add a requirement that functions in other scripts 
*must* use a new function or feature, we are essentially *extending* the platform. 
We can consider this a "micro framework".
Dependencies that add a feature that most of your other scripts then must use is a "framework", 
no matter how small it is.

We would very much like to avoid adding frameworks to the platform.
Frameworks change your "other code". 
Frameworks can make it hard to use framework-independent code.
Frameworks need to be changed or replaced later.
Frameworks are.. something you want to avoid if the naked platform offers a tolerable alternative.

To summarize. To delay load time of your app is bad. Fast load time is very, very... good.
But, to add a micro-framework-functions-que is also bad. 
A clean setup with no "extra" functions needed by other scripts is also very, very good. 
Its a conundrum.

## Recommendation: Sync.
My general recommendation is therefore to load web components polyfill sync. 
And to do so *after* the most critical html template is rendered.
And to place it *after* other scripts that do not rely on it (that might well be deferred).
The rational behind this advice is that:
1. Web component polyfills are highly invasive. 
They will likely need to que a lot of functions in a lot of your other scripts anyway.
2. Do not underestimate the cost of complexity.
   * The complexities of async loading greatly increases the chanses of errors *both* 
   when the browser needs the polyfill *and* when it doesn't.
   * Complexity is also the most scarce resource for any (team of) developer.
   Adding complexity for loading your polyfills fast will therefore come at the expense of other
   functionality in your web app. 
3. Web components are now so widely supported that the added complexity of using async loading
does not outweigh the cost of delayed load time for a minority of your users. 

Async loading is recommended when:
1. Your app has a great many users so to warrant the extra time spent to reduce load time.
2. If you load web component polyfills async, I still recommend that you start 
developing using sync loaded polyfills and then later augment the app to support async 
loaded polyfills near the end of development.

## References:
 * https://stackoverflow.com/questions/5250412/how-exactly-does-script-defer-defer-work#answer-10731231
 * https://stackoverflow.com/questions/3952009/defer-attribute-chrome#answer-3982619
 
 <!--
 But, done correctly, **async**hronously loading polyfill has its benefits.
 Loading the polyfill **async** takes directly control of the timing between 
 the polyfill and your other scripts. This can get ahead of timing issues that otherwise would 
 require tight control.
 Second, some browsers do not support `<script defer>` which you might otherwise employ to
 control the timing between your polyfill scripts and your other polyfill-dependent scripts.
 Here, you would need a controlled async loading profile.
 -->
 
<!--
1. you might need to delay calls to functions that require web component APIs to be present,
such as:
   * `customElements.define`, calls that you need to register new html-tags
   * `myCustomElement.shadowRoot`, queries or manipulation of DOM that require shadowDom API,
   * `.innerHTML`, `.children` or `.querySelector()` calls that anticipates a structure of the DOM 
      not yet set up.

2. Polyfilling web components is heavily interfering with the DOM.
Queries and manipulation of the DOM can therefore in some instances be affected 
by the polyfill, and such functions should therefore also be queued and run *after*
the polyfill has loaded.
-->

<!--
### Questions to ask when you consider async vs sync
If you in order to load the polyfill async need to add a micro-framework-functions-que dependency 
to your entire app, you most definitively want to evaluate whether or not this is worth it.
Here are some of the questions you might ask yourself:

* When will the need for the polyfill diminish so that I can remove the dependency?
* How much extra complexity and thereby risk of errors am I adding by adding this dependency?
* Will the complexity of the functions que come at the expense of functionality in my app?
Will I have to wait to add other functions due to the complexity added by the functions que?
* How many of my users are affected by the change? And how much time does it really cost them?
* How long until these users browsers update so to void the need to wait for the polyfill?
* How critical is it for your application to decrease the wait for this group of users? 
How many users are affected?
-->