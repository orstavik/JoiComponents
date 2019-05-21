## Problem: DuellingDirections

If one web site could direct the events of any another web site loaded in an `<iframe>`, 
there would be little to no security. Thus, that `<iframe>`s in many instances should direct and 
interpret their own events such as navigation and scrolling is fine.

But, when there is trust between the parent frame and the nested `<iframe>`, 
it would be nice if the default actions of `click`, `submit` and `scroll` could be skipped by the 
`<iframe>` and passed out to the parent frame. 

## Solution: IframeEventTransposition

To transpose events out of an `<iframe>`'s browsing context must be done manually. 
Using js, an event listener must be as inside the `<iframe>` that intercepts the event and 
then calls `.preventDefault()` on the event.
The same listener must also accept the event and post it as a `message` to the upper browsing context.
An event listener for the `message` in the upper browsing context must then be added that converts this 
particular message into a similar event/default action in the upper context.

To add this solution in a web component, additional `allow-parent-navigation` and `allow-scroll-bypass`
can be added. Other `allow-xyz-events` can be added to allow other types of events to flow from the 
inner `<iframe>` up to the upper, parent browsing context.

## Security: `<trusty-iframe>`

To transpose `scroll` events to the upper browsing context from the inner `<iframe>` browsing context 
entails little risk. The inner `<iframe>` receives no information back down from the upper browsing context,
and the upper browsing context receives no information about the state of the inner `<iframe>`.
Furthermore, the ability to accomplish this can only be done when the the upper browsing context has
same-origin level script access to the inner `<iframe>` browsing context.

To transpose the `navigation` events of `click` and `submit` however increases the risk of spoofing the
user slightly. These events should cause the browser to load a new site. Many apps would likely not be 
at risk in such scenarios, but apps receiving sensitive information from their users should not 
implement such event transposition from partially trusted `<iframe>`s. The `<iframe>` will be able
to direct the user to for example:
1. a web site with an identical appearance and a very similiar looking url without the user 
   being aware of it, 
2. a REST api interface using the user's logged in credential.

Thus, this kind of event transposition is suitable for HTML fragments from 100% trusted sources (ie.
static content from a different, but equally trusted server as the `same-origin`), but not for
for example user generated material.

