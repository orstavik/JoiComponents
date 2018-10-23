# Pattern: HijackLocalLink

A Single Page Application, or SPA, is a webapp that is delivered with a single entrypoint html file.
SPAs often need has lots of content that it needs to split across different views within itself,
and so SPAs very often comes with a menu to let the user choose different views/internal pages.
The SPA need to set up an internal navigation system *within* the SPA *on* the client.

But, the web already has a navigation system: links `<a href="...">`.
To both describe, organize and present navigation choicepoints, links is the goto HTML solution.
Broadly speaking, we can say there are two types of links:

1. Normal links, point to *page-external* resources, both from the same origin and unknown origins.
When the browser is given a normal link, it will *by default* **load the link resource**.
To *load the link resource* means both to:
1. fetch a file from either the network or browser cache,
2. construct and connect a new DOM from these files, *and*
3. initiate and load ES6 modules anew.

We will return to the problem of re-loading resources later in this chapter.

2. Hash-links, point to *page-local* anchors, elements with an `id` attribute that matches the `#`-tag of the link.
When the browser is given a hash-link, it will *not* load any new resource *by default*, but 
only scroll so that the first element with a matching `id` comes into view. 

## The problem: How to use links to navigate in a SPA?

When we make a SPA, we can of course use *page-local* hash-links to navigate the app.
By simply adding several `<a href="#linkA">` and `<a href="#linkB">`, four things will happen:

1. Our page gets filled with links to page internal locations. These links are look and style in familiar 
ways, they work nicely.

And, every time one of these links are pressed, the browser:
2. append the `#` at the end of the location bar,
3. dispatch a `hashchange` event, and
4. **not(!)** reload the original page.

This is perfect

to let the user navigate around it on the client, 
they give the user a menu bar with links that the user can click in order to choose one page or the other
*within* the single page app.

But, when the user clicks 

You want to define a local scope (as your page might send you to a sub page). 
Any link click within this scope should not trigger a page load, only a change to the location bar.

To do so, this needs to listen for all 

1. HijackLocalLinks. This needs to delete any local navigation, and remake all local links as local navigation. This will naturally trigger a #hashchange. Also called LocalLinkInterceptor.
sorry, this was 1 and 2.
Then 3. SpaProblems. a) no builtin parsing of the url, b) no local navigation, c) the server has no information, much harder to scale up to MPA server-side later. 
4. PushState solution. Instead of intercepting links and replace them with #, use pushState instead and dispatch a "pathchange" event.
5. The Back'n'Forth problem. When the user now presses back and forth, this will trigger DOM re-construct and -connect. This problem is lessened by getting the associated state. But, this problem still remains huger for web components as all their lifecycle methods will be called, it will kill all async processes and it will kill all css animations. It also means that in your single state controller, you will need to
a) manage the history.replaceState at all updates, and
b) at page load also check if you have a history.state that you can use (ie. that the page is loaded from a back'n'forth click), and then use that one instead of generate a new state. 
6. Proposal to fix the Back'n'Forth problem. Add  a property to BASE tag "local-scope". Links that work within this local scope will not trigger a reload, but only routechange event. Ie. make a bigger part of the path behave in the browser as if it only was a hashchange redirection.