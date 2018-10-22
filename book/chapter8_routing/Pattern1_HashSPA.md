# Pattern: HashSPA

A Single Page Application, or SPA, is a webapp that is delivered with a single entrypoint html file.
SPAs often need has lots of content that it needs to split across different views within itself,
and so SPAs very often comes with a menu to let the user choose different views/internal pages.
Therefor, the SPA need to set up an internal navigation system *within* the SPA *on* the client.

The web already has a navigation system: links.
Links, ie. `<a href="...">`, let the developer both describe, organize and present navigation choicepoints.
In relation to routing, we will look at two types of links:

1. **Page-external-links**, such as `<a href="another.html">` or `<a href="https://example.com">`.
When the browser receives such a link to somewhere *outside* of the current page, 
it will usually **load** the link resource.
To load the link resource means both to:
1. fetch a file from either the network or browser cache,
2. construct and connect a new DOM from these files, *and*
3. initiate and load new ES6 modules.

2. **Page-internal-links**, such as `<a href="#internal-location">`.
These links *always* start with a `#` and point to internal anchors inside the current page.
Internal anchors can be created using the explicit `<a name="hash-location">` or 
by implicitly relying on the `id` attribute of elements.
When the user clicks on a hash-link, the browser will by default scroll to that internal anchor, but
*not* load any new resources. 

## How to navigate a SPA with hash-links?

When we make a SPA, we can simply use page-internal-links (`#`) to navigate the app:

1. We add as many `<a href="#linkA">` and `<a href="#linkB">` in our SPA as we need. 
   We can manage and style these links as we would any other link.

2. every time the user clicks on one of these links are pressed, the browser will:
   1. update the `#`-location at the end of the url in the address bar,                   
   2. dispatch a `hashchange` event, and
   3. **not(!)** reload the original page.

3. In our SPA, we listen for the `hashchange` event.
   When the `hashchange` event occurs, we simply:
   1. parse the `window.location.hash`, and then
   2. decide what to do and present based on its value.

That's it. The simplest router your SPA can have is... none! 
Just use the `#`-location in the url, react to the native `hashchange` event, and 
process the content of `window.location.hash` exactly to your liking.

## A self-resolving problem: #uglyDuckling

In the early days of SPAs, before the US president tweeted hashtags, 
seeing a `#` character in a link was much less familiar.
PHP and server-side web applications was the norm, and users and developers alike was
accustomed to seeing web app navigation being displayed on the form
`http://my.website.com/folder1/folder2/aFile.php?query=this&query=that`.
Using hashtags in links to reflect the main navigation looked unfamiliar and suspicious
`http://app.website.com/#/is/not/a/folder/haveIbeen.hacked?or=something`.
The unfamiliarity of `#` as symbol in web app navigation I call `#uglyDuckling`.

But. Today, things are different. 
Hashtags has been tweeted all round the world as a symbol of thematic navigation.
Furthermore, people now expect web apps to live client-side and in the memory of the client.
Today, having a web app keep track of the user state via his or hers current position in a 
folder hierarchy is arcane.
Sure, the good old `/` is still more familiar and less suspicious symbol than the `#` to denote
the navigation inside an app, 
but the other, underlying factors of familiarity are working in the `#uglyDuckling`'s favour.

