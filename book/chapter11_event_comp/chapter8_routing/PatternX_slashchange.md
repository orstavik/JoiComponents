# Pattern: SlashChange MPA

> tldr; The SlashChange pattern makes MPAs simpler by highjacking link clicks within 
the `<base href="location">` and converting them into `slashchange` events instead.

## MPA: old-school vs modern

MPA stands for "Multi Page Application". 
As opposed to SPAs, MPAs can serve many different pages from the server.
This has the benefit of letting the server to prepare and "render" a more finished view
at different locations than the SPA can.

For example: A web app might have different pictures on different locations.
In a HashSPA, the server would always yield the same start page which would then have to:
 1. load the start page,
 2. run a js startup script,
 3. identify the #hash-location,
 4. update the view accordingly, and 
 5. load the images in a second round-trip.

This takes time. If the server instead could prepare both markup and potentially even inline
images, the complete view could be presented much quicker, shaving seconds of the initial page load.

In old-school MPAs, all or most changes to the view required such round-trips to the server.
This quickly became a nuance, as each interaction with the web page required the user to wait some seconds
for the server to respond and the browser to update its view. 

Modern MPAs on the other hand only rely on the server to load the initial page custom, and
then switch to SPA mode, loading future content, images and other resources in the background.
This gives modern MPAs the best of both worlds: *both* fast, custom loading *and* fast interaction.

The main problem the developer needs to tackle is: how to switch from MPA to SPA?

## MPA first, SPA second

In order for modern MPAs to pass different starting points within the app to the server, 
the locations "within" the app needs to be differentiated as individual web pages/different server locations.
As most MPA are located on the same server, as the #-location are not sent from the client to the server,
MPAs must therefore distinguish between different locations within itself as part of the segment `/` or 
query `?=&`.

However, once the initial page has loaded, the app no longer wants the browser to treat locations "within"
the app as different server locations. 
After the page has loaded, the app wants the pages to be treated as "within the client app" and thus
it wants to highjack any click to any link "within the app", block the browser from acting upon them and 
instead alert the app itself about this "within app navigation" SPA style.

Enter the `<base href="app root location">` and a new `slashchange` event.

## `<base>` first

The `<base href="someLocation">` is a special HTML tag that lets the developer specify the location
from where relative links should be interpreted.
The `<base>` thus forms the natural root location for modern MPAs in which links within different pages 
and locations all can be made relative to the app as a whole, and not each view in the app.

But, as it is, the `<base>` is limited. 
Yes, the `<base>` instructs the browser how to interpret its relative links. 
But, no, the `<base>` cannot highjack navigation "within the base location" 
(ie. block the browser from loading a new page and instead dispatch an event about such "within app navigation"). 

## `slashchange` event

To accomplish such a task, we need to essentially extend the `<base>` element.
The extended `<base>` element will block the browser's default behavior 
when user navigation to other pages *within the app's location*
and instead dispatch a new `slashchange` event, a new cousin of the established `hashchange` event.
Essentially, we need to highjack click on links within the within the app's location.

## How to highjack link-clicks within an app's location?

Link-clicks are highjacked using the following steps:
1. Identify active navigation events only, ie. `event.defaultPrevented === false`.
2. Identify normal `click`s only, ie. find left clicks with no modifier key.
3. Find the first `<a href>` in the event target chain, if any.
4. Skip links marked `download` or `external`.
5. Skip links starting with `mailto:` or `javascript:`.
6. Find out if the link clicked points to a location within the `<base href="">`.

If all the criteria above are present, then:
a. block the browsers default navigation `e.preventDefault()` and
b. dispatch a new `slashchange` event that includes the `{base, link}` data,
where `base` is the `<base>.href` and `link` is the relevant link from that base location.

```html
<base href="https://example.com/link/ending/with/slash/" />
<script type="module">
window.addEventListener("click",function(e){
  if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey)
    return;
  for (let el = e.target; el; el = el.parentNode) {
    if (el.nodeName !== "A" && el.nodeName !== "a")
      continue;
    if (el.hasAttribute('download') || el.getAttribute('rel') === 'external')
      return;
    var l = el.href;
    if (l.startsWith('mailto:') || l.startsWith('javascript:'))
      return;
    var b = document.querySelector("base").href;
    var a = new URL(l, b).href;
    if (a.startsWith(b)){
      e.preventDefault();
      window.dispatchEvent(new CustomEvent("slashchange",{detail: {base: b, link: a.substring(b.length)}}));
    }
    return;
  }
});
</script>
```

### Special case: highjack links from SVG documents

HTML pages can include SVG documents, and so links within the app can potentially come from such documents.
However, SVG links are constructed a little differently from HTML links:
1. An SVG link node has `.nodeName === "a"` as opposed to `.nodeName === "A"` for HTML link nodes. 
2. The `.href` property of SVG link nodes contains an Object `{baseVal, animVal}`, and not a simple string
as in HTML. The active link is always `animVal`.

To include SVG links in the above implementation thus require the implementation to be slightly extended.

```html
<base href="https://example.com/link/ending/with/slash/" />
<script type="module">
window.addEventListener("click",function(e){
  if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey)
    return;
  for (let el = e.target; el; el = el.parentNode) {
    if (el.nodeName !== "A" && el.nodeName !== "a")
      continue;
    if (el.hasAttribute('download') || el.getAttribute('rel') === 'external')
      return;
    let link = typeof el.href !== 'object' || el.href.constructor.name !== 'SVGAnimatedString' ?
      el.getAttribute('href') :
      el.href.animVal;
    if (link.startsWith('mailto:') || link.startsWith('javascript:'))
      return;
    var b = document.querySelector("base").href;
    var a = new URL(l, b).href;
    if (a.startsWith(b)){
      e.preventDefault();
      window.dispatchEvent(new CustomEvent("slashchange",{detail: {base: b, link: a.substring(b.length)}}));
    }
    return;
  }
});
</script>
```

## Problem: JS `.click()` is impossible to prevent

When calling `el.click()` or `el.dispatchEvent(new MouseEvent("click", {...}))` from JS,
the default browser navigation *will be queued **before** `e.preventDefault()` can be called*.
This means that it is impossible to highjack navigation triggered from JS. 

## Proposal: global `navigate` event or `<base href="..." block>`

Declaratively, the `<base>` element is the natural place to control the behavior of 
the browser's default navigation.
The `.href` property of the base element already controls the interpretation of links.
Adding for example a functional attributes such as `block` can cause the
browser to block navigation within the base and instead dispatch a some kind of 
`internal-navigation` event.

Imperatively, a general `navigate` event could be dispatched on the `window` object.
The `navigate` event immediately precedes the browsers default navigation,
and the default behavior of the navigate event is to 
as the last action before the browser will navigate to a new page.
To block the browser from navigation can be achieved with `event.preventDefault()`.
This navigate event includes a detail such as the original href given, the absolute link, and 
the resolved link combined with the `<base>`.

In my opinion, an imperative solution is the best choice for controlling navigation.
1. Apps are likely to desire highly custom mechanisms for selecting links.
   * One app might be interested only in processing links to image files.
   * Another app might be interested only in processing links to a certain domain.
   * Third app might match links against a whitelist it fetches from the server, etc.etc.).
2. Apps need to react to navigation they intercept.
   Therefore, a declarative solution would in any case require an event to be dispatched on either the
   `<base>` or the `window`.

## References