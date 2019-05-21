# Intro: EmbedHtml

> To embed HTML is to make *one* HTML presentation from *two or more* HTML fragments.

## HowTo: Embed HTML server-side

Server-side, embedding HTML files into one another thrives. 
In PHP, for example, a `header.html` and `footer.html` file can easily be included into an 
`sunshine.php` file like so:

```php
<?php include "header.html"; ?>

<h1>Hello sunshine!</h1>  
<p>Welcome to our beautiful web site that embeds a static header and footer.</p>

<?php include "footer.html"; ?>
```

In Jenkins/Liquid, it looks like this:

```liquid
{ % include header.html %}

<h1>Hello sunshine!</h1>  
<p>Welcome to our beautiful web site that embeds a static header and footer.</p>

{ % include footer.html %}
```

Server-side embedding presupposes that all HTML fragments included are local and stored on the same 
server. As all sources are limited to `same-origin`, embedding them is truly simple. Primitive. 
A conceptually simple merge of HTML files.

## Problem: Embed HTML client-side

The reason HTML fragments are hard to embed client-side, is that client-side developers are much 
more eager to include HTML fragments from third party sources. Client-side developers want to include
sources from several of their own servers, third party vendors (such as youtube or twitter) and maybe
other user's generated code (such as codepen and jsfiddle). Client-side developers quickly look to 
include HTML fragments "cross origin", from a server with a different hostname.

However, client-side, there is *no* good solution for embedding of HTML fragments.
Embedding HTML fragments client-side is truly complex. And patchy. How and why is that?

### `<frame>` is no good

The browsers provide two custom HTML tags to embed one HTML fragments into one another: 
`<frame>`(+`<frameset>`) and `<iframe>`.

`<frame>` is no good because it was deprecated nearly ten years ago in HTML 4. 
Although it actually still is supported, the browsers basically say they might remove support for it 
tomorrow. And that means that you can't use it today. There are many other problems with the 
`<frame>` and `<frameset>` elements too: it breaks the principle that "one url for one web page" and
managing navigation across `<frame>`s is awful. But, here we disregard it due to its `obsolete` status.

### Problem: `<iframe>` is patchy and sluggish

The only other option for embedding HTML in HTML in HTML, is the `<iframe>`.

The original purpose of `<iframe>` is to include a complete web pages inside another, 
picture-in-picture style. But, to embed "complete web pages" is not the archetypal use-case
for embedding HTML fragments: server-side we typically embed *in-complete* headers, footers and menus; 
client-side we typically embed *partial* ads, widgets, and other content articles. Thus, the use-case 
for `<iframe>`s is oriented towards a fringe use-case for embedding HTML fragments.

Having been the only HTML option for a decade, `<iframe>` must handle *both* third party *and* 
`same-origin` HTML fragments. But, to embed 100% trusted vs. 100% untrusted HTML *code* are two quite 
somewhat conflicting goals. And in this conflict, the `<iframe>` must err on the side of caution, 
on the side of 100% untrusted, third party sources. 

To be on the safe side, the `<iframe>` erects a big firewall between the embedded and embedding 
content by default. This firewall is implemented as a separate **"browsing context"** for the
`<iframe>` and its embedded code, ie. browser-tab-in-browser-tab.

When embedding small, trusted HTML fragments, this firewall feels very out of place, like bringing
a canon to a knife fight. Sure, it looks good on paper, but while you log around on your canon, 
your problems run circles around you and stab you in the stomach.

## WhatIs: `<iframe>` "browsing context"?

In essence, this means that the two embedding and embedded HTML fragments exist as:

1. Two separate DOM objects, one inside the other. 
   In itself, this organization of DOM nodes is unproblematic. 
   However, it can be perceived as heavy when inlining trusted, small HTML fragments.
   
2. Two separate `baseURI` contexts.
   In the embedded HTML fragment, relative links such as `<img src="./img/link.jpg">` and 
   `<a href="nextPage.html">` will all be interpreted relative to the `<iframe>`'s source URL.
   The `<iframe>` has its own `<base href="baseURI">`.
   The term "browsing context" from the early 1990s best fit the `baseURI` context.
   
   Being able to control the `baseURI` context for embedded HTML fragments is *absolutely crucial*.
   
   1. An HTML fragment is *written in one context*, but can be *used in many contexts*.
      For a large, third party HTML fragment, it's obvious that a) it needs relative URLs and b)
      that these URLs must be interpreted against its *context of writing*, not its *context of use*.
      But, even micro HTML fragments (for example just an image: `<img src="/imgs/cat.jpg">`),
      served by a completely trusted source (for example the same organization), must if
      it is embedded in two apps with different hostnames, either be wrapped in a separate `baseURI` 
      context, or only use absolute URLs.
      
   2. A *single* HTML page can embed *many* HTML fragments from *many* different sources.  
      Thus, the logic cannot be reversed: even if you have full control of the HTML document that
      is embedding other HTML fragments, you still would need separate `baseURI` contexts for different
      embedded fragments.

   With regular, native HTML elements and CSS, it is possible to recognize and interpret all relative
   links at the time an HTML fragment is embedded. Possible, but *not* desirable. However,
   for JS code, it is not possible to identify and interpret all relative links that might be pursued
   at the time of embedding. Furthermore, new custom elements might also define relative links in tags
   that also are impossible to recognize at the time of embedding.
   
   Thus, this leaves two options. Either pursue and establish a separate `baseURI` context for 
   embedded HTML fragments in the browser. The `<iframe>` is the *only* means by which this can be
   achieved in today's browsers. Or, specify that embeddable HTML fragments can only contain absolute
   links from the time they are written (as a server script would be no better positioned to recognize
   potential relative links in JS code nor custom element attributes). 
   
   The first option, *separate browsing context* is clearly superior, most dynamic solution.
      
3. Two separate JS contexts. 
   To allow scripts to run in an `<iframe>`, the developer sets `sandbox="allow-script"` or 
   no `sandbox` attribute. To allow the script inside the `<iframe>` to access its parent 
   frame, then `sandbox="allow-same-origin"` or no `sandbox` attribute. By default, the parent
   frame is not allowed to access the script context of the `<iframe>` when its source is sent 
   without an allow CORS header. However, when `<iframe>`s are loaded with content directly 
   from JS using for example the `srcdoc` attribute, the parent frame is allowed to access the script
   context of its nested `<iframe>`.
   
   Contrary to what one might expect, restricting and opening up for JS script interaction
   when embedding HTML client-side in `<iframe>` is better supported and less complicated than
   controlling style or events.

4. Two separate CSS contexts. 
   The CSS context of the `<iframe>` is completely locked off from its parent frame, and vice versa.
   This means that you cannot *declare* CSS rules in the parent frame context that will apply to 
   the embedded HTML fragment. Never. Instead, any static and dynamic style that is to be applied 
   to the embedded content must be transposed *imperatively* with JS. 
   
   To transpose style therefore *only* works when the parent frame has script access to the `<iframe>`.
   Furthermore, transposing CSS style across frames manually require heavy polling and complex set up.
   Thus, contrary to what most client-side developers expect, the "absolute `<iframe>` CSS wall" 
   is the first *major* headache.
    
5. Two separate Event contexts.
   As events would normally flow along the branches in the DOM hierarchy, it is as expected that
   the child `<iframe>`  cannot access events occuring only in their parent frame.
   But, with `<iframe>`s there is no declarative, simple way to allow events to bubble up
   into the parent "browsing context". 
   This means that navigation and scrolling events that originate from inside the embedded HTML 
   fragment, events that you often would like to control globally and coherently for the app as 
   a whole, are divided and cut off from unified control.
   
   This is the second *major* headache when using `<iframe>`s to embed HTML fragments seamlessly:
   how to partially coordinate event management across different "browsing contexts"?
    
   Note. The `target` system, ie. `<a target="badIdea" href="link">` to `<iframe name="badIdea">`,
   is *not* a good idea. It answers very few of the event direction usecases when embedding third 
   party HTML fragments from (partially) trusted sources. You do not want to allow another frame
   to *directly* trigger navigation or scrolling of another browsing context. What you need is to
   let nested browsing context dispatch events, recognizable by the parent browsing context, so that
   they can be handled and controlled by the same means it handles its other events for navigation 
   and scrolling.

## Two browsing context, pros and cons

Pros. By creating a separate browsing context, the `<iframe>` successfully enable developers
to split and manage both the `baseURI` context and JS code contexts. `<iframe>`s are safe "enough" 
to allow JS code and network requests of third parties be integrated into apps in the wild,
if you're interaction is not super sensitive such as banking. 

Cons. `<iframe>` plagues developers when it comes to *seamlessly* integrating a) style and 
b) event management for navigation and scrolling. Thus, `<iframe>` works poorly as a means for
lots of the use-cases in today's *responsive, dynamic, SPA/MPA web apps*.

Another con is that `<iframe>`s are resource expensive. Especially when imperative steps are taken 
to integrate style and event management. `<iframe>`s can make an app laggy.

## Problem: Embed HTML client-side using JS

In order to get around the drawbacks of the `<iframe>`, many people use JS to directly inline
HTML fragments into the main document. When the HTML fragment is part of the same document, it is
styled in accordance with the same CSS context and all its events are managed by the main document
event management system. 

But. HTML code can contain several potential security risks. The two biggest ones are javascript and 
trusted network requests. When an HTML fragment is fused into the main document, all the links and 
javascript in the HTML fragment are given equal access to the resources on both the client and the 
server as the rest of the app.

If the HTML fragment you inline include third party contributions (content generated by other users
or content from servers outside of your control), you have a problem. With untrusted content you would 
need to manually sandbox all javascript and network requests in the untrusted source. The code would 
also need to be stylistically sandbox so as not to confuse the user and clickjack their content. The 
inlined document may add invisible entities that overlay other parts of your page. In short, you 
would need to replicate all the CSS, JS, network and event sandboxing that `<iframe>` uses. 
This is a [rabbit-hole pipe-dream of the worst sort](https://hi.wikipedia.org/wiki/%E0%A4%90%E0%A4%B2%E0%A4%BF%E0%A4%B8%E0%A5%87%E0%A4%9C%E0%A4%BC_%E0%A4%8F%E0%A4%A1%E0%A5%8D%E0%A4%B5%E0%A5%88%E0%A4%A8%E0%A5%8D%E0%A4%9A%E0%A4%B0%E0%A5%8D%E0%A4%B8_%E0%A4%87%E0%A4%A8_%E0%A4%B5%E0%A4%A3%E0%A5%8D%E0%A4%A1%E0%A4%B0%E0%A4%B2%E0%A5%88%E0%A4%A3%E0%A5%8D%E0%A4%A1).

If you include HTML fragments from a 100% trusted source, inlining HTML code with JS works 90%. 
The missing 10% is the `baseURI` context. An inlined, embedded HTML fragment must share the `baseURI` 
context with the embedding HTML document, and as described earlier, this requires all links in the 
embedded HTML fragment to be *written* in absolute form.

In sum, inlining HTML code via JS is only appropriate in *one* use-cases:
100% trusted HTML code with *only* absolute links (from CSS, HTML, and JS alike).

## Other alternatives

HTML filters and HTML subset languages such as AMP can be used to create safe, third party HTML 
fragments. They sandbox HTML template grammatically. However, as they too inline the HTML fragment,
they are also restricted.
To understand the concept of AMP, I recommend this article: [Google AMP go to hell](https://www.polemicdigital.com/google-amp-go-to-hell/).
Even if you end up liking AMP, this critique is a good way to understand AMP's technological approach
and motivation.

## Future problems

But why? Why can't the browser let styles flow freely from a parent to a child `<iframe>`?
Why can't the events of the `<iframe>` be directed by the parent document?
Why can't the content of an `<iframe>` be allowed to be styled in the flow of the current document?
These questions have to do with security, and we will look at them more in-depth shortly.

## References

 * [wiki: Framekiller](https://en.wikipedia.org/wiki/Framekiller)
 * [wiki: Framing](https://en.wikipedia.org/wiki/Framing_(World_Wide_Web))
 * [MDN: baseURI](https://developer.mozilla.org/en-US/docs/Web/API/Node/baseURI)









1. how can `<iframe>`s be used to secure and pigeonhole the embedded HTML fragments?
   Here we will look at the solutions that the `<iframe>` provides, such as `sandbox`-ing the network requests and scripts
within, and we will look at how we can solve the problems `<iframe>` gives us such as trying to
provide an overflow layout (to fix the scrollbar issues for `<iframe>`s considered safe from 
clickjacking), passing style both statically and dynamically into an `<iframe>` from the parent context,
and bridging events, such as link-clicks from within the iframe and out into the environment.
We will also look at how the `<iframe>` and its browsing context helps us set a separate path for the 
loaded content URLs such as `<img src="iNeedADifferentLocation.jpg">` and `<a href="whereAmIPointing.to">`.
All these patterns are wrapped in a `<power-iframe>` web component.

After this, we will look at techniques for sandboxing HTML code added via script directly into the main
DOM. We will look at what AMP does to safely sandbox third party HTML fragments. Are all scripts 
disallowed? Can you sandbox content *and* `allow-script` as is done with `<iframe>`?
Can we restrict network requests?
We will then look at URLs in the HTML fragment and how we can address altering the `baseURI` for the
HTML fragment content. Here are several alternatives that might be used in combination:
The first alters the baseURI while the content loads.
The second intercepts link clicks and updates their base. 
The third rewrites all the uri in the source.
And finally we look at the problem of style. Should and can all CSS rules in the HTML fragment be 
pigeonholed to the fragment? Or must we remove all `<style>` and `<link rel="style">` from the
HTML fragments included?



 
To include HTML fragments with potentially malign code from a third party  is a *big* security 
risk. Both the HTML, CSS and JS code in an HTML fragment can be exploited in many creative ways.


