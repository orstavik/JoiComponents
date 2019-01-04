# Pattern: EventWindowAction / SimulateDefaultAction

> How to give the browser a default action for an event.

Sometimes, you want the browser to "always do this or that" when "it receives an event".
Same as a default action.

To do this, one would add an event listener for this event on the `window` object, and 
then convert this event into actions against the browser.

1. to do so is very simple. Make a function that receives an event only, and 
   then add this function to listen on the window.

2. this function should be contextless, ie. the event detail and target element itself,
   should provide all the information needed to process the event. Sometimes, this needs to be broken
   ("yes, I can see you `<base href="...">` element). 
   But try to only rely on the context directly provided by the event properties themselves.
   Do not go idly walking about in the DOM for more information.
   
3. The purpose of the EventWindowAction event listener is to trigger side-effects, 
   JS api calls against the underlying platform.
   
 * If you have a global event listener function that needs to alter the DOM or application data,
   you should not consider it an EventWindowAction, but an app specific global event listener.
   EventWindowAction listeners are not app specific. To be app generic, both the processing of
   the event and the side effects run must contain no bindings to the DOM or `localstorage` or 
   app specific libraries (the DOM, localstorage and app script essentially being the context of the app).
   
## Example: value-input?

use selectionStart and selectionEnd to get the cursor position for altering the text.

https://developer.mozilla.org/en-US/docs/Web/API/HTMLInputElement

to make this happen, I need a cursor position.. 
But if we have that, then we can make a auto-correction autocompleter?