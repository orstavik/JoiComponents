# JoiComponents
JoiComponents is a package of both a couple of patterns and Mixins for developing simple, 
reusable and joiful web components. The package is designed to be used both directly via services 
like unpkg.com or rawgit.com, but can be downloaded via both git and npm as well.

JoiComponents consists of two types of resources:
* patterns that explains how generic UI web components should be built; 
* isolated functional mixins for a few more complex use-cases.

JoiComponents is **a library, not a framework**: all source files has no
other dependencies than itself and the platform (and polyfills when needed)! 
There is no shared dependencies to a set of shared functions or base class,
only a series of patterns and isolated functional mixins that can be applied directly to HTMLElement.

## Patterns for generic web components
1. [Reactive method](tutorials/Pattern1_ReactiveMethod.md)
2. [Functional mixin](tutorials/Pattern2_FunctionalMixin.md)
3. [EventComposition](tutorials/Pattern4_EventComposition.md) (such as gestures, clicks, drag)
4. [two-faced-collection](tutorials/Pattern3_TwoFacedCollection.md) (such as `<Ol>`+`<Li>`)
5. [Template construction](tutorials/Pattern5_ConstructTemplate.md)

## Isolated functional mixins
#### 1. Reactive methods:
* [.childrenChangedCallback()](tutorials/Mixin1_ChildrenChangedMixin.md)
* [.sizeChangedCallback()](tutorials/Mixin2_SizeChangedMixin.md)
* [.firstConnectedCallback()](tutorials/Mixin4_FirstConnectedMixin.md)
* [.enterViewCallback()](tutorials/Mixin5_EnterViewMixin.md)

#### 2. Event compositions:
* [DraggingEventMixin](tutorials/Mixin3_DraggingEventMixin.md) (OneFingerGesture, PinchGesture)
* [PinchEventMixin](tutorials/Mixin6_PinchEventMixin.md) (TwoFingerGesture, DragGesture)
//todo rename to OneFingerGesture and TwoFingerGesture
//or DragGesture and PinchGesture.