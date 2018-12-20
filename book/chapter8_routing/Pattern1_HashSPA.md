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

## HashBang: Page internal vs. app internal navigation 

Way back in HTML 2, the browser's default behavior of `#`-links was page internal navigation.
JS did not exist yet, and page internal navigation links such as `#something` would make the
browser scroll to the first `<a>` element with a `name` attribute matching the link, 
such as `<a name="something">`.
In HTML 3, page internal navigation was extended. Links such as `#something` would now 
scroll to the first *element* with a corresponding `id` attribute, such as `<h1 id="something">`.

Then came JS and CSS. And changed the whole web household.
To support CSS selectors targeting `id` attributes (cf. `#something {color: blue}`),
HTML element `id`s was restricted from including special characters in HTML 4.
Also, with JS, client side apps started intercepting links and controlling navigation.
This also meant that apps needed to distinguish between the browsers `#`-based navigation 
and their own internal navigation. And `#!` could be used for that.
As elements' `id` attributes could not start with `!`, but links and their `#`-fragments could,
using `#!` in HTML 4 links would:
 1. never cause any scrolling (browser default action) while  
 2. still being a valid link click.
 
`#!` would essentially be an alternative way to `.preventDefault()` scrolling behavior 
for app internal links.

In HTML 5, things got a bit messier again. HTML 5 does not restrict `id` attributes from starting 
with a bang `!`. However, irregular element `id`s will still cause problems in CSS.
So conventional element `id` names is still the norm, and links starting with a bang `!` will
therefore still very rarely cause any unintended scrolling by the browser.
So, while no-longer technically functioning as an alternative `preventDefault()`, `#!` will
most often and conventionally work as one.

Below is a demo that illustrate how #! will cause side-effect.
```html
<a id="preventme" href="#!something">Lets not go to something</a><hr>
<a href="#!something">Lets go to something</a>
<h1 id="!something" style="margin-top: 200vh;">something</h1>   

<script>
  window.addEventListener("click", e => { 
    console.log("click", window.scrollY);
    if (e.target.id === "preventme"){ 
      console.log("prevented");
      e.preventDefault();
    }
  });
  window.addEventListener("hashchange", e => console.log("hashchange", window.scrollY));
  window.addEventListener("scroll", e => console.log("scroll", window.scrollY));
</script>
```
This test shows how `hashchange` is dispatched after the browsers default scroll behavior. 
To prevent such behavior in an HashSPA router, one must therefore either call `preventDefault()`
on the `click` event, or one must rely on a link naming convention that will not conflict with
any element `id`'s, such as `#!`.

//todo check in all browsers?

## References

 * [Html ID values](https://www.456bereastreet.com/archive/201011/html5_allows_almost_any_value_for_the_id_attribute_use_wisely/)
 * [Whatwg: HTML 4: `<a>`](https://www.w3.org/TR/html4/struct/links.html#h-12.2.3)
 * [Whatwg: HTML 2: `<a name>`](https://tools.ietf.org/html/rfc1866#section-7.4)
 * [Stackoverflow: valid `id` names](https://stackoverflow.com/questions/70579/what-are-valid-values-for-the-id-attribute-in-html/40563537)