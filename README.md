# Web component design patterns
"The web component design patterns" (WC patterns) is a set of recipes for developing simple and reusable web components. 
WC Patterns does not rely on any framework: all patterns are intended to run natively on any browser 
that supports the whatwg HTML spec for web components and vanilla es6. However, although different 
frameworks might require a different mode of implementation, most of the patterns described here should
be relevant for developers using other frameworks.

WC patterns consists of two types of recipes:
* patterns that explain how generic UI web components can be built and 
* isolated functional mixins that both explain, implement, and make available small micro-libraries
for a couple more complex use-cases.

The isolated functional mixins presented in this cookbook is **not** a framework. 
Every mixin has no other dependencies than itself and the platform. 
And there are no shared dependencies, neither explicit nor implicit, between the mixins. 
They are isolated to the HTMLElement.
If you want to use the mixins directly, go right ahead (and use for example rawgit.com or unpkg.com). 
If you want to copy them into your web component and/or adapt them to your precise need, do so freely.

Web components are not fully supported by all browsers in use, and therefore some polyfills must be included 
to patch the browsers that need it. This is described in the first part of this book. 

## How to build (and polyfill) an app using web components?
1. [Create your first custom element](tutorials/chapter1/Pattern1_CreateElement.md)
2. [Template construction](tutorials/chapter1/Pattern5_ConstructTemplate.md)
<!--_3. HTMLElement core lifecycle, constructor(), connectedCallback(), and disconnectedCallback()-->
4. [Attribute reaction](tutorials/Pattern6_AttributeReaction.md)
<!---
3. [How to polyfill for web components](tutorials/chapter1/PatternX_HowToPolyfillOnClient.md)
3. create a custom element with a template
5. create a custom element with shadowDom
explain that custom elements with content in the lightDom should be considered app-specific components.
-->

## JS Patterns for generic web components
1. [Reactive method](tutorials/Pattern1_ReactiveMethod.md)
2. [Isolated functional mixin](tutorials/Pattern2_FunctionalMixin.md)
3. [EventComposition](tutorials/Pattern4_EventComposition.md) (such as gestures, clicks, drag)

## HTML Patterns for generic web components
1. [HTML is always a list](tutorials/Pattern0_HTMLList.md) (todo add the `<Ul-Li>` example)
2. [two-faced-collection](tutorials/Pattern3_TwoFacedCollection.md) (such as `<Ol>`+`<Li>`)
3. [ResponsiveLayout](tutorials/Pattern7_ResponsiveLayout.md) (alternative to css media queries + css pseudo for custom elements)

## Lifecycle mixins (generic custom element)
* [.childrenChangedCallback()](tutorials/Mixin1_ChildrenChangedMixin.md)
* [.sizeChangedCallback()](tutorials/Mixin2_SizeChangedMixin.md)
* [.firstConnectedCallback()](tutorials/Mixin4_FirstConnectedMixin.md)
* [.enterViewCallback()](tutorials/Mixin5_EnterViewMixin.md)

## Composed events mixins (Gestures and other conventional events)
* [DraggingEventMixin](tutorials/Mixin3_DraggingEventMixin.md) (SingleFingerGesture, DragGesture)
* [PinchEventMixin](tutorials/Mixin6_PinchEventMixin.md) (TwoFingerGesture, PinchGesture)
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