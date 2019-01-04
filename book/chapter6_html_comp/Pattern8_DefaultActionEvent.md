# Pattern: DefaultActionEvent

There is a confusing aspect of HTML events: default action.

First confusion is that "default action" potentially give many events a potential second outcome. 
Default actions can be understood as a second return value.
Events bubble, and this might trigger event listeners further up the DOM. 
This can be seen as the "normal" return value of events, and this output can be stopped with `.stopPropagation()`. 
But, some events also trigger a default action such as navigation, text highlighting or text input. 

Second, it is often not clear at all whether or not an event will have a default action.
A click event might cause the browser to navigate to a new web page. And it might not.
It depends on the context of the click. A context that quite often can be messy and opaque and room great
discrepancies between browser and spec (cf. filtering of click events that will cause the browser to browse).
It feels more like a side effect as it is not a 1:1 relationship between the event and default actions, but 
often a 1:0.417.

Third, it is not clear which default actions exists. 
Some browsers might provide a default action that others don't. Todo check if this is true.
The default actions don't fly under their own flag, instead they lurk within an event with another name.
Not unlike a Trojan horse. Thus, to find them and control them require tacit, cultural knowing.

Forth, if you stop the propagation at a low point in the DOM, then you can no longer stop
the default action higher up. This means that in practice, there are no safe way to completely control
a default action at the app level, as any global event listener on for example the document or window 
will not function if the event bubbling is cancelled, while the default action is left untouched, 
below in the DOM.
To call `.stopPropagation()` and not `.preventDefault()` on an event from a place in your apps code that
does not have root control, is an antipattern I call DefaultActionTrojanHorse.

Fifth, some default actions are not triggered by JS api calls, while others are.
Again, other times JS api calls can trigger default actions that should be impossible.
For example, calling `.click()` on an element inside `<object>` that is wrapped in a `<a href>`,
should not trigger the default action of browsing, as the `<object>` is an interactive element.
But it still does. todo check this out.
Another example is that calling `mousedown` on an element cannot trigger text highlighting.
These differences are hard to spot.

The architecture of the default action thus very much obfuscate what is going on.
It is like the browser has put a blindfold on its developer. So, how can we make it simpler?

## Pin the tail on the donkey

Ok, the default action is the donkey. You are the developer. You are wearing a blindfold.
Your job is to pin the tail on the donkey. To do that you need to:

1. separate the default action from the rest of the event,
2. clearly distinguish which events will trigger which default action,
3. name the default actions appropriately, and
4. prick anyone making DefaultActionTrojanHorses with the needle holding the tail 
   until they stop making DefaultActionTrojanHorses.

## Making the DefaultActionEvent

To **separate the default action** from the 'other' event harboring them, 
we set up a new **filtered tail-event**. This new event is the DefaultActionEvent.

The filter is a global event listener (ie. added on a `document` or the `window` object),
and when the function identifies the event as harboring a default action, it will wrap that
event as a tail-event with **a new name** that clearly distinguishing the default action.

The DefaultActionEvent should be dispatched from its logical origin. 
The logical origin is "the HTML element that brings the default action into the dom".
For example, if you click on a `<h1>` wrapped in a `<a href="...">`, 
then the `click` event harboring the default action will be the `<h1>`, but a DefaultActionEvent
for the default action of following-a-user-clicked-link will be dispatched from the `<a href="...">` element.

The DefaultActionEvent should not distinguish between `.stopPropagation()` and `.preventDefault()`.
If you stop propagation on the DefaultActionEvent, it will also call prevent default, and vice versa.

And lastly, you need to tell anyone making DefaultActionTrojanHorses in your app to stop, patch their code,
and/or replace their code with code that doesn't.

## Problems with DefaultActionEvent

The main problem with DefaultActionEvents is DefaultActionTrojanHorses. The DefaultActionTrojanHorses
is no less of a problem without DefaultActionEvent, but DefaultActionEvent highlight the possibility of
confusion when a developer either thinks he has stopped all consequences of an event 
(when he makes a DefaultActionTrojanHorse) or when a developer thinks he has global control of a
default action (but fails to capture and control DefaultActionTrojanHorses).

Another problem with DefaultActionEvents is the problem of separating events made by the JS api from events
made by the user interface itself (ie. the mouse or keyboard). 
Some events made by the JS api will as events look exactly like the events made by the user, but 
still trigger no default action by the browser. Again, this problem is the same with and without the
DefaultActionEvent, but it is made more visible when implementing this pattern.

## Potential default actions

There are not that many default actions: browsing, text-highlighting, and text-input. todo find more?
And browsing is by far the biggest one.

Todo should we use text-input as an example here? is it simple/small enough for that?
This require a very simple filter, and it also hinges on whether or not the event JS api and the keyboard
triggers work the same.

## ArtificialDefaultActionEvents

Once in place, some events such as browsing and text-input can also be triggered artificially.
This require setting up a method for making such an event, and giving it data.
Then, on the global level a listener must be made for DefaultActionEvent that will reproduce the effect 
of the default action. 

Such ArtificialDefaultActionEvents is a great plus for web components. 
It enables them to function on par with native events in regards to native events.
