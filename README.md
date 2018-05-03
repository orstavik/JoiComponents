# Web component design patterns
## The native web components cookbook
"The web component design patterns" (WC patterns) is a set of recipes for developing simple and reusable web components. 
WC Patterns does not rely on any framework: all patterns are intended to run natively on any browser 
that supports the whatwg HTML spec for web components and vanilla es6. However, although different 
frameworks might require a different mode of implementation, most of the patterns described here should
be relevant for developers using other frameworks.

WC patterns consists of two types of recipes:
* patterns that explain how to build web components
* isolated functional mixins that both explain and implement a few key, frequent use-cases.

The isolated functional mixins presented do **not** make a framework. 
In fact, it is the ambition with this book that you no longer need a framework to build
scalable, manageable, simple, yet powerful web apps. Modern browsers now has all the power you desire.
Hence, every mixin therefore has no other dependencies than itself and the (polyfilled) platform. 

So, if you want to test the mixins directly, go right ahead (and use them via rawgit.com or unpkg.com). 
If you want to copy them into your web component and/or adapt them to fit your need, do so freely.

In this book, the web component design patterns will:
1. first exemplify how to define custom elements in JS, and then 
2. second exemplify how to use those definitions from HTML or JS.

## Chapter 1: How to build (and polyfill) an app using web components?
1. [How to define, load and use custom elements](book/chapter1/Pattern1_CreateElement.md)
2. [Different strategies to create a shadowDom](book/chapter1/Pattern2_shadowDom.md)
3. [Polyfill web components](book/chapter1/Pattern3_polyfill.md)
<!--_3. HTMLElement core lifecycle, constructor(), connectedCallback(), and disconnectedCallback()-->
4. [Attribute reaction](book/chapter1/Pattern6_AttributeReaction.md)
<!---
3. [Transpile polyfilled web components to es5](tutorials/chapter1/PatternX_HowToPolyfillOnClient.md)
3. create a custom element with a template
5. create a custom element with shadowDom
explain that custom elements with content in the lightDom should be considered app-specific components.
-->

## Chapter 2: JS Patterns for generic web components
1. [Reactive method](book/chapter2/Pattern1_ReactiveMethod.md)
2. [Isolated functional mixin](book/chapter2/Pattern2_FunctionalMixin.md)
3. [EventComposition](book/chapter2/Pattern4_EventComposition.md) (such as gestures, clicks, drag)
4. [Discussion: how to isolate FunctionalMixins for web components](book/chapter2/Discussion_IsolatedFunctionalMixin.md) (such as gestures, clicks, drag)

## Chapter 3: Lifecycle mixins (generic custom element)
* [.childrenChangedCallback()](book/chapter3/Mixin1_ChildrenChangedMixin.md)
* [.sizeChangedCallback()](book/chapter3/Mixin2_SizeChangedMixin.md)
* [.firstConnectedCallback()](book/chapter3/Mixin4_FirstConnectedMixin.md)
* [.enterViewCallback()](book/chapter3/Mixin5_EnterViewMixin.md)

## Chapter 4: Patterns for HTML Composition
1. [Introduction: HTML is list](book/chapter4/Intro_HTML-Lists.md)
2. [OrphanElements (`<ul-li>`)](book/chapter4/Pattern1_OrphanElements.md)
3. [HelicopterParents (`<ol>+<li>`)](book/chapter4/Pattern2_HelicopterParent.md)
4. [ResponsiveLayout](book/chapter4/Pattern3_ResponsiveLayout.md) 
(alternative to css media queries + css pseudo for custom elements)

## Chapter 5: Composed events mixins (Gestures and other conventional events)
* [DraggingEventMixin](book/chapter5/Mixin3_DraggingEventMixin.md) (SingleFingerGesture, DragGesture)
* [PinchEventMixin](book/chapter5/Mixin6_PinchEventMixin.md) (TwoFingerGesture, PinchGesture)
<!--* [SwipeEventMixin] (tutorials/Mixin7_SwipeEventMixin.md) (MultiFingerGesture)-->

<!---
## Design patterns for app specific web components:
1. Props down, (custom) events up. 
((ATT!! In generic custom elements, it is more children and attributes down, events up)).
2. MVC. Catching app events on window (or another element event bus (https://stackoverflow.com/questions/42757051/web-components-design-pattern)
).

* How to handle app-wide styling. Local coherence (cohesion), thematic coherence, global coherence.
When and why to put the content of an element in the lightDom? In app-specific elements where you want 
to apply global/thematic styles to the element. And when you have control of the use of that element.
Don't split this piece of the app into too many pieces. These pieces of the app should mostly be about 
template composition. And only minor event composition. If you need to apply a lot of UI logic, 
you probably need a generic UI web component.
 
* Path based styling. Changing the path in the stylesheet, and not the class or attribute on the element.
Sometimes you have a tree structure in your DOM that reflects a tree structure in you state data.
When you have such a mapping, and you have everything in the same lightDOM accessible to the same stylesheets,
you can instead of changing each element, change the css paths that attribute styles to each element.
This is not for beginners. This is not necessarily a good pattern. But it is a pattern.

## Centralized state management
1. Using an event bus. With a state mananger.
2. dispatching directly on an element. 
3. the concept of immutability. and the benefits of dirty checking.
4. what are reducers? and the benefit of pure functions.
5. what are computer functions? and the problem of either nesting reducers or redundant functionality.
6. why use observers? and the problem of managing async actions in a sync centralized state.
7. what is joiState and how to use it?
-->

<!--
### What do you mean "web component"?

Many different frameworks such as React and Angular enable developers to make components for the web.
However, components tailored and dependent on a framework we call by that frameworks name, such as 
"React component" or "Angular component". They are components made to be used on the web, 
but they are not what is commonly refered to as "web components".

"Web components" means a components that can run *natively* in a modern browser. 
"Web components" always imply "*native* web components".
They do not rely on a framework in browsers compliant with the whatwg and es6 specification.

Still, "web components" can mean many different things. 
On the one hand, when we say "web components", we might refer to the simplest custom element. 
A custom element that uses neither shadowDom nor HTML template, and that is directly defined before use in the app (no es6 module loading).
On the other hand, a "web component" might refer to a most advanced custom element.
A custom element with a HTML template based shadowDom, written by someone else and loaded as an es6 module.

To clarify this myriad of terms, I think it is wise to apply the following taxonomy.
If you intend for a web component to be reused, it should be made available as an importable module.
You should also highlight that the web component is intended to be "reusable", generic to many apps and 
complying more thoroughly with HTML standards. You often should add the label "reusable" to that component.

If you are talking about a `custom element` that uses neither shadowDom nor 

Web components provide an excellent interface for integrating custom HTML+JS+CSS modules. 
Once familiar with the makeup of web components, it is my contention that you no longer will need a framework.
Web components is enough. They provide a great means both to organize and stabilize your own work and 
collaborate with others. It might not be perfect. And it needs to be polyfilled in old browsers. 
But it will still provides you with the only, cleanest and simplest API for making native HTML+JS+CSS modules.


-->