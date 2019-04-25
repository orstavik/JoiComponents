# Method: Narrative analysis

## How the system triggers lifecycle callbacks

From the perspective of the app and browser as a whole, not very much happens "automatically".
The app is mostly passive, it reacts to the users input, to network resources being loaded,
data sources feeding it new data, and other I/O actions. The apps functions "react" to its environment;
it is very rarely beneficial to view it as initiating actions itself, "automatically".

But, viewing functions from the perspective of an individual web component, things change. 
The web component knows very little about its environment, and
it lives in a conceptually very small, general world. And these two characteristics are connected.


And there is a good reason for this this is that the web component architecture is designed for reuse and repurposeand its
perspective is greatly limited.the browser is likely perceived as the source of the trigger.

Lifecycle callbacks are trigger automatically. 


So, to get access to the automatic, system trigger events, the web component likely needs to
register a function callback 
add Examples of such automatic triggers can be the system and/or user and/or external data a system event triggering a callback, a system event triggering
a DOM event, a user event triggering a s can be an event  system callback, an observer an event listener, an observed attribute,
timers, a native browser functionality, and a few more. In this pattern, we will look at
how timers can be used to trigger a callback.
