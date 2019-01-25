# HowTo: compose with Events and JS?

## Events -> JS

From a JS perspective, DOM Events sole purpose in life is to trigger JS functions added as event 
callbacks on HTML elements or as event listeners attached in the DOM. As will be clear in the following
chapters, this is *not* the *only* purpose of DOM Events: both HTML and CSS interact with DOM Events for
their own purposes, without JS knowing. Still, there is value to this perspective. 
DOM Events and JS has a quite exclusive relationship. At least JS think so.

Most JS functions and imperative commands written and loaded in a web app *are* triggered by DOM Events.
Sure, many JS functions are triggered in other ways: JS functions and imperative commands can be 
triggered when the script is loaded; and JS functions can be triggered as lifecycle callbacks in service 
workers and in web components. But still, the vast majority of JS code solely purpose is to react to 
DOM Events. Like the dutiful husband he is, JS' functions simply wait on the whims of his DOM Event wife
and only step into action when she says so. So JS feels he is in a monogamous relationship with DOM 
Event wife. But the situation is that he might be more dedicated to her and than she to him, at least
more so than he himself thinks.

When composing with DOM Events and looking to JS, the main concerns are:

1. the causality between events (which event trigger/comes before which other event), 

2. the granularity of the events (how frequently the events are occurring, and how many different 
   types there are),

3. the content of each event (its type name and detail), and

4. its relationship with the DOM (its target and target chain).

For experienced web developers, these aspects of DOM Events are all in plain sight. However,
when composing a new custom event, this obvious checklist are not necessarily easy to fill in with 
right solution:
 * If I make a dragging event, should I dispatch an extra fling event, or simply add the fling 
calculations in the drag-stop event? 
 * Should I need to debounce a custom event in order to reduce the event framework workload? 
 * How should event detail be preprocessed? Can the data be processed on demand, or must it be
   preprocessed?

## JS -> Events

But, husband JS is not completely cowered by his DOM Event wife. Au contraire! He is a man who has a pair.
In almost all instances, JS can and do have complete and full authority to direct DOM Events as he pleases. 
In a very small handful of situations JS needs to go via HTML attributes or CSS properties to get DOM 
Events to conform to his will, but both conceptually and practically, there is no DOM Event JS cannot 
create, direct, alter and/or stop.

The problem facing JS when directing DOM Events is therefore not what he *can* do, but what he *should* do.
In this book, we advocate limiting JS to create and direct DOM Events with more care and deliberation.
We advocate a constrained behavior from JS towards DOM Events. Our goal is a more harmonic and productive
partnership. 

First, while JS should listen and react to DOM Events, JS should *not* alter their content. 
DOM Events and their details should be considered immutable. JS should also refrain himself from 
arbitrarily stopping their propagation or defaultActions. The propagation and causality of events should
be handled with a clear intent.

Second, JS *can* and often should make his own atomic DOM Events. In web components in particular, JS
should delegate quite a lot of the external communication to his DOM Events wife as atomic DOM Events
(DOM Events that are not triggered by other DOM Events).

Third, JS *should* help his DOM Event wife when she wants to elaborate her own events, ie. 
compose custom DOM Events from other DOM Events.
The main body of this project is directed towards this practice and different patterns for JS to do so.

## Event compositions you can only direct from JS, not HTML and CSS

Many DOM Event directives can *only* be given from JS. Try as you might, but DOM Event commands such as
`.stopPropagation()` and `.setPointerTarget()` can't be given in neither HTML nor CSS.


## References

 * 
