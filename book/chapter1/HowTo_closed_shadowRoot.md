# Closed `.shadowRoot`, composed events and CSS custom properties.


## Why build a wall around `.shadowRoot`?

You wan't to protect the insides. Insides are internal implementation details.
If they are changed from the outside, errors can occur.
And if they are freely available, accidental errors might happen.

## `.attachShadow({mode: "open" or "closed"})`

You might have seen the statement `this.attachShadow({mode: "open"})` a few times and wondered:
"why do I always have to add `{mode: "open"}` to the constructor?"
You know that `this.attachShadow({mode: "open"})` creates a normal shadowDOM
that you can access normally via the `.shadowRoot` property on the custom element object.
But what happens if you choose another mode? And what are they?

The only other mode of shadowDOM is `closed`. 
And calling `this.attachShadow({mode: "closed"});` also creates *a normal shadowDOM*,
but you can no longer access it via `.shadowRoot` property.
Neither from within the custom element, nor from outside.

The point of this excercise is to discourage outside access and accidental changes to the shadowDOM
of a custom element. Encapsulate it more strongly. Build a higher wall around the custom element.
But, because of JS all-public-properties, when you can't access a property from the outside, 
you can't access it from the inside neither. So, when you do `this.attachShadow({mode: "closed"});`, 
then you must also preserve a reference to the shadowDOM and manage it yourself.
For example `this._shaDOM = this.attachShadow({mode: "closed"});`.

"What is the point of that?!", you might ask. 
"Isn't `this._shaDOM` just as open or closed as `this.shadowRoot` was?
And isn't it discouraged and considered bad practice to tamper with another elements `.shadowRoot` always anyways?"
The answer is "Yes. Yes." 
But. If you really want to, with this method it is possible to build a higher wall around
the `shadowRoot` using the [PrivateSymbols](../chapter2_HowToMakeMixins/Pattern7_PrivateSymbols.md)
or the [Accessor pattern](https://medium.com/@weberino/you-can-create-truly-private-properties-in-js-without-es6-7d770f55fbc3).

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
