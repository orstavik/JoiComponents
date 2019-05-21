## Problem: IframeStyle

The user *trusts* the browser. Users take their browser to the bank and write all their secret 
codes in it. If something walks like a duck and talks like a duck in a browser, it's a duck.

`<iframe>`s exist. The browser will open any web page inside another web page,
if the inner web page do not explicitly restrict it with `X-Frame-Options` HTTP response header.

If a web page can do critical stuff, it should not let a normal browser trusted by normal people
open it up in an `<iframe>`. Web sites with whom users share sensitive information accomplished 
this using `X-Frame-Options`. But, what about web sites with not so critical material, web sites 
that implicitly accepts to be included with other in `<iframe>` composite web pages? Is it OK for
them if someone just gives them a little bit style? Adjust their font size or scaling or colors
just slightly to make them blend in more accurately?

The computer says "no". Or, more precisely, the browser says that "no CSS style rules are passed
between the parent browsing context into an `<iframe>` browsing context, and vice versa".
This resemble the shadowDOM restrictions, but with the following differences:

1. There are no `:host` selector inside the `<iframe>` that can style the host node `<iframe>`.
   This is good, we wan't this.
   
2. There are no possibility to pass CSS variables into the `<iframe>`. This is good in cases where
   the parent browsing context should have little-to-none control of the `<iframe>`, but
   this is something we could appreciate when using `<iframe>` to paste trusted same-origin sources.
   
3. There is no inheritance of CSS properties. Again, good in untrusted scenarios, but bad for
   same-origin sources.

## The case for sharing style across `<iframe>` browsing context

Let's be clear: *no* CSS rules from inside an `<iframe>` should leak out and up into the parent
browsing context. We keep the no-CSS-from-inside-`<iframe>`-to-outside-parent-browsing-context rule.

But, we want to give the user of the `<iframe>` the ability to transpose `all-css-properties`, ie.
*all* inherited and non-inherited CSS properties *from* the parent browsing context *into* the 
`<iframe>` browsing context (except the CSS properties of layout and overflow that would need to
be controlled by HTML attributes such as `allow-overflow-right`

This would enable us to style the content of an `<iframe>` from its parent browsing context, allowing
HTML fragments that are integrated into another document be handled as such.

## Solution: an extended `styleCallback` and transposing style into an `<iframe>`


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

