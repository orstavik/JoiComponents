# To sync or async? That is the web components polyfill question

## Drawback of sync and async
The main drawback of loading a script sync, is that it will:
* delay the rendering of later parts of the DOM, and
* delay the running of later scripts.

The most immediate cure for this ill, is to place the polyfill sync *after* 
1. the other DOM template that you want to display immediately and 
2. scripts that can be executed asynchronously be marked `defer` or `async` 
and placed *before* the polyfill.

Another cure for this ill is to load the polyfill *async*.
If you load your polyfill async, the browser will not delay 
neither later scripts nor the rendering process. 
Neither while the polyfill script is downloaded nor executed.                           
That sounds great! But.. is it really?

To load web component polyfills async has one mayor downside.
If some functions in other scripts depend on the polyfill (ie. queries or manipulates the DOM),
these functions must be delayed until the web component polyfill has loaded and is ready.
This in turn means that you have to identify which functions are affected, and then 
somehow delay them, and then somehow restart them when the polyfill is ready.

The simplest path to accomplish this is to:
1. Set up a functions que. 
2. Add the functions manipulating the DOM into this que. 
This change must be done inside all the other affected scripts in your app.
3. Trigger this que from the polyfill loader.

To load your web components async is therefore both complex *and* invasive.
The complexity in itself is not necessarily a show-stopper, but 
the fact that all other scripts must relate to and place their functions in a que 
most certainly can be.

### Polyfills, constraints and micro-frameworks
When working with polyfills, limitations in the polyfill can reduce the number of features 
or the extent to which we might use a feature on the platform. 
We can call this "platform constraints".
On the other hand, when we add a requirement that functions in other scripts 
*must* use a new function or feature, we are essentially *extending* the platform. 
We can consider this a "micro framework".
Dependencies that add a feature that most of your other scripts require is a "framework", 
no matter how small it is.

We would very much like to avoid adding frameworks to the platform.
Frameworks changes your "other code". 
Frameworks can make it hard to use framework-independent code.
Frameworks need to be changed or replaced later.
Frameworks are.. something you want to avoid if the bare bones platform offers a tolerable alternative.

To delay load time of your app is bad. Fast load time is very, very important.
But, to add a micro-framework-functions-que is also bad. Adding a "all-scripts" dependency is bad.

## Recommendation: Sync.
My general recommendation is therefore to load web components polyfill sync. 
And to put do so *after* the most critical html template is rendered.
The rational behind this advice is that web component polyfills are:
1. highly invasive and will likely will need to que a lot of functions 
in a lot of your other scripts (anyway), and
2. that web components are so widely supported that the added complexity
(and with it the risk of complexity-driven errors and functionality reduction due-to-complexity)
does not outweigh the cost of delayed load time for a minority of your users. 
Do not underestimate the cost of complexity.

Async loading is recommended when:
1. Your app has a great many users so to warrant the extra time spent to reduce load time.
2. You can and do update and maintain frequently.
If you load web component polyfills async, I still recommend that you start 
developing using sync loaded polyfills and then later augment the app to support async 
loaded polyfills near the end of development.




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