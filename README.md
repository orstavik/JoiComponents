# The web component cookbook
The web component cookbook is a set of recipes for developing simple and reusable web components. 
The web component cookbook consists of two types of recipes:
* patterns that explain how generic UI web components should be built and 
* isolated functional mixins for a few more complex use-cases.

The mixins in this cookbook is **not** a framework. Every mixin has no
other dependencies than itself and the platform (and polyfills when needed). 
There are no shared dependencies, only a series of patterns that needs to be implemented themselves
or that can be invoked using an isolated functional mixin directly applied to the HTMLElement class.

Because the mixins are isolated, they are simple and easy to test and deploy directly using services 
such rawgit.com and unpkg.com. You can also download them directly via both git and npm as well, 
but it is not necessary.

## JS Patterns for generic web components
1. [Reactive method](tutorials/Pattern1_ReactiveMethod.md)
2. [Isolated functional mixin](tutorials/Pattern2_FunctionalMixin.md)
3. [EventComposition](tutorials/Pattern4_EventComposition.md) (such as gestures, clicks, drag)
5. [Template construction](tutorials/Pattern5_ConstructTemplate.md)
6. [Attribute reaction](tutorials/Pattern6_AttributeReaction.md)

## HTML Patterns for generic web components
0. [HTML is always a list](tutorials/Pattern0_HTMLList.md)
4. [two-faced-collection](tutorials/Pattern3_TwoFacedCollection.md) (such as `<Ol>`+`<Li>`)

## Isolated functional mixins
#### 1. Reactive methods:
* [.childrenChangedCallback()](tutorials/Mixin1_ChildrenChangedMixin.md)
* [.sizeChangedCallback()](tutorials/Mixin2_SizeChangedMixin.md)
* [.firstConnectedCallback()](tutorials/Mixin4_FirstConnectedMixin.md)
* [.enterViewCallback()](tutorials/Mixin5_EnterViewMixin.md)

#### 2. Event compositions:
* [DraggingEventMixin](tutorials/Mixin3_DraggingEventMixin.md) (SingleFingerGesture, DragGesture)
* [PinchEventMixin](tutorials/Mixin6_PinchEventMixin.md) (TwoFingerGesture, PinchGesture)
* [SwipeEventMixin](tutorials/Mixin7_SwipeEventMixin.md) (MultiFingerGesture)
