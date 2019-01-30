# Theory: Narrative analysis

## Narrative analysis:

 * studies of narratives
 * studies of stories with an agency
 
1. studies of who am "I", what's "me"? 
   What is my borders? How am I encapsulated? 
   How are agents/personas/units encapsulated?

2. What is my world? What is the context for the agent?
   Which context can I sense?
   How far does my eyes see? my ears hear? my hands reach? My feet and method of transportation take me?
   what other units surround me? My social context? What other resources can I access? 
   What is my physical environment (the platform)?

   
## Two different narratives: 

1. The app as the agent. The whole DOM is within the app, it can be sensed and touched.

   Problem with one is reuse of a "part" of the app in another app. 
   If this part has been written under the assumption that it can see and reach all the other
   parts of the app, and know all the causality of how the app is interconncted, then 
   that causes problems when the sight is blocked, or the reach is tampering with other parts of the app
   with unintended side-effects. CSS leaks was a big thing.
   
2. The web comp as the agent. Only the component itself and its internal mechanisms can be sensed and touched.
   Implements a new sensory system, reactive lifecycle callbacks and <slot>, so as to hear changes in the DOM
   from within this new perspective. Big change in both agency and context from the view of the web comp.

   Initiated to be able to reuse components across apps.
 
Before web comps, the app was the agent. The web page as a whole.

Need for reusability gave us the need for a new narrative.
The agents in this new narrative had a different border, not the app, but the web comp, custom element + shadowDOM.
This different border restricted proactive control in the dom, and needed a new sensory system, 
the reactive lifecycle callbacks, the <slot>.
And with these new sensors we can write narratives from the perspective of web comp agents.

This also strengthens the argument for slotchange event as a lifecycle callback as it is a web comps sense
of its external dom, not really something going on in its internal shadowDOM. It is at root an external, lightDOM
change that is "seen" with callbacks, not "heard" with events.