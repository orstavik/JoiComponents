# HowTo: CloseShadowDOM

## `.attachShadow({mode: "open"})` vs. `.attachShadow({mode: "closed"})`

Calling `.attachShadow({mode: "open"})` creates a normal shadowDOM.
This ShadowDOM is automatically added under a `.shadowRoot` property on the custom element object.
But, you might have looked at `.attachShadow({mode: "open"})` and wondered.
Why do we always use `{mode: "open"}`? 
Why isn't `{mode: "open"}` have been the default option for `.attachShadow()`? 
And what happens if you choose `{mode: "closed"}`?

Calling `this.attachShadow({mode: "closed"});` creates a normal shadowDOM,
except:

1. The closed shadowDOM is not added on the `.shadowRoot` property.
   The web component can therefore hide the pointer to the shadowRoot making it very difficult
   for code elsewhere in the app to access it.
   
2. Events from within the shadowDOM does not list the shadowDOM elements when
   the events propagate out of the shadowDOM of the web component and a script
   calls `.composedPath()` on the event in the lightDOM.
   
3. LightDOM elements being slotted into the web component will get `null` when
   querying `.assignedSlot`.

## Demo:

todo, make a demo of two otherwise equal web components, one with 
`.attachShadow({mode: "open"})` and one with `.attachShadow({mode: "closed"})`
   
## Why (not) build a wall around `.shadowRoot`?

You wan't to protect the insides. Insides are internal implementation details.
If they are changed from the outside, errors can occur.
And if they are freely available, accidental errors might happen.
This is the general logic behind `closed` as the default mode of `.attachShadow()`.

But, the general consensus is that developers should still use `this.attachShadow({mode: "open"})`.
The rationale behind the `open` mode default is:

1. If you do something like `this._root = this.attachShadow({mode: "closed"})`, the security is almost
   non existent. You can beef up closed shadowDOM security with [PrivateSymbols](../chapter2_HowToMakeMixins/Pattern7_PrivateSymbols.md)
   or the [Accessor pattern](https://medium.com/@weberino/you-can-create-truly-private-properties-in-js-without-es6-7d770f55fbc3).
   But still, only `this.attachShadow({mode: "closed"})` can give developers a false sense of security.

2. Therefore, the main benefit of `{mode: "closed"}` is developer ergonomics. The closed mode
   protects developers from taking shortcuts that they later regret and from "friendly fire":
   when they or a collaborator end up making a problem worse by trying to fix a shadowDOM from outside.
   
3. But. An open shadowDOM also has ergonomic benefits. 
   When web components are reused, the developers should anticipate that the shadowDOM might need 
   to be accessed from the outside in its new context. This is especially true for debugging purposes:
   the shadowDOM is read to confirm that strange behavior is not due to its internal behavior.
   Furthermore, if developers *can* hackishly adjust another web components shadowDOM, that can make
   it possible to reuse code that otherwise would have to be forked.
   
4. Thus. Expect that others will need to a) debug your web component and b) hackishly adjust its 
   shadowDOM style and elements from JS, when they reuse it. Make it simple for them. 
   Keep the `.shadowRoot` `{mode: "open"}`.


## `composed` events

> The `.` in `this.shadowRoot` is a big wall.

Since the beginning of time, events dispatched in the DOM has propagated or bubbled from one DOM node 
to its parent to its next parent all the way to the window root document 
(if the event bubbles and the event propagation isn't stopped along the way).
But, with the introduction of shadowDOM, suddenly many events should likely be stopped and
contained within each shadowDOM.
The question then arose: how to separate between events that we want to bubble only within 
a shadowDOM and elements we want to bubble also across from within one shadowDOM and over to the next one?

Thus, with the advent of shadowDOM, a new property was also introduced to HTML Events: `composed`.
Events with `composed: true` will bubble from within a shadowDOM and up into its lightDOM host and beyond.
Events with `composed: false` will stop when it reaches the `shadowRoot` object in the custom element.

The `.` in `this.shadowRoot` is a big wall. It blocks all events with `composed: false`.

## CSS custom properties

Currently, CSS custom properties is the only means to pass CSS style from outside and into a custom element.

## References

 * [open vs. closed 1](https://medium.com/@emilio_martinez/shadow-dom-open-vs-closed-1a8cf286088a)
 * [open vs. closed 2](https://blog.revillweb.com/open-vs-closed-shadow-dom-9f3d7427d1af)
