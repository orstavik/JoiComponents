# Intro: EmbedHtml

First, some facts:

1. The web is the world. A web page is no longer *just* text or images. The web is everything. 
   Its your money, the government, your family, neighbourhood friends, your work and your dinner date. 
   
2. Although mostly fair, benign and geared towards collaboration, the web is also filled with 
   disingenuous, selfish, malign actors.

3. When you surf the web, you can interact with *hundreds* of different web places in minutes. 
   You are in as much control as when you zap through 50 TV channels in 20 seconds. 

4. The browser is "the thing" that gives us the web. In milliseconds, the browser can take you to 
   the other side of the world by opening up **another's** text, images and **code in your hands**.
   
5. When you surf the web, you often bump into disingenuous, selfish, malign actors.
   These actors *open up their code* and run it *inside* your browser. 
   Your browser must protect you in such instances. 
   
6. The easier it is for bad actors to violate you via the browser, the more they gain and try.
   Thus, relaxed browser security would only feed a cycle of malice.
   
7. Too strict security, and the world is excluded. Sure, your date is safe and squeeky clean. 
   But *you* are not. 

The balance between open+insecure vs. closed+safe is *always* up for debate.
The browsers and web ecosystem always try to find that point of balance. 
And as the web is thriving, we all seem to be doing a fairly good job finding that balance.
But. There is *one* area where we can safely say that the browsers and web ecosystem has *not* struck
a good balance: embedding HTML fragments client-side. 

## HowTo: Embed HTML server-side

To embed HTML is to make *one* HTML presentation from *two or more* HTML fragments.

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
{% include header.html %}

<h1>Hello sunshine!</h1>  
<p>Welcome to our beautiful web site that embeds a static header and footer.</p>

{% include footer.html %}
```

Embedding HTML server-side is truly simple. Primitive. A conceptually simple merge of HTML files. 
So, how do we do the same client-side?

## Problem: Embed HTML client-side using `<iframe>`

Client-side, there is *no* good solution for embedding of HTML fragments.
Embedding HTML fragments client-side is truly complex. How is that?

The browsers provide two HTML tags for this purpose: `<iframe>` and `<frame>`(+`<frameset>`).

`<frame>` is no good because it was deprecated nearly ten years ago. The browsers basically say 
they might remove support for it tomorrow, meaning you can't use it today.

`<iframe>` is designed for:
1. including complete web pages inside another, picture in picture style, and
2. handle everything from 100% untrusted, third party HTML code to 100% trusted, same-origin HTML code.

To achieve these two goals, the `<iframe>` creates a separate **"browsing contexts"**. 
In essence, this means the embedding vs. embedded HTML fragments exists as:

1. Two separate DOM objects, one inside the other. 
   This organization of DOM nodes is fairly unproblematic, but it can be perceived as 
   slightly heavy when inlining trusted, small HTML fragments.
   
2. Two separate `baseURI` contexts.
   In the embedded HTML fragment, relative links such as `<img src="./img/link.jpg">` and 
   `<a href="nextPage.html">` will all be "based" on the `<iframe>`'s source URL.
   The `<iframe>` has its own `<base href="baseURI">`.
   The term "browsing context" from the early 1990s best fit the `baseURI` context.
   
   Being able to control the `baseURI` context for embedded HTML fragments is *absolutely crucial*.
   First, any HTML fragment is written in *one* context, but can be used in *many* contexts.
   This applies *not only* to large, third page sources, but even small small, trusted HTML fragments
   can include links to source-relative images.
   Second, a *single* HTML page can embed *many* HTML fragments from *many* different sources.  
   Thus, it is *not feasible* to have a unified `baseURI` context for both the embedding and embedded
   HTML sources, and at the same time allow relative image and link URLs.
   The *only* solutions are therefore:
   
   1. *no* relative links, *only* absolute links in embedded HTML fragments, or
   2. establish a separate `baseURI` context for embedded HTML fragments.
   
   The second option is clearly the superior, and *only* `<iframe>` can do this in a browser.
      
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
   But, with `<iframe>`s there is no declarative, simple way to for example turn *off* the 
   event management aspect of the "browsing context" of the nested `<iframe>`. 
   This means that navigation and scrolling inside the embedded HTML fragment becomes a huge mess.
   Thus, the second *major* headache when adding HTML fragments via `<iframe>` is the lack of control
   of the inner "browsing contexts" event management.
    
   Note. The `target` system, ie. `<a target="badIdea" href="link">` to `<iframe name="badIdea">`,
   is *not* a good idea. It answers very few of the event direction usecases when embedding third 
   party HTML fragments from (partially) trusted sources. So, `target` is something old to look at,
   but it is not something useful today.

To summarize: `<iframe>` works for embedding HTML fragments from untrusted source. 
`<iframe>` also works for embedding HTML fragments that require safe management of third party scripts,
and `<iframe>` provides the only means to simply handle different `baseURI` from different sources.
But. `<iframe>` plagues developers when it comes to a) style and b) event management.
And this is a great drawback when trying to integrate, inline, seamlessly embed HTML fragments
in today's *responsive, interactive web apps*.

But why? Why can't doesn't the browser let styles flow freely from a parent to a child `<iframe>`?
Why can't the events of the `<iframe>` be directed by the parent document?
Why can't the content of an `<iframe>` be allowed to be styled in the flow of the current document?
These questions have to do with security, and we will look at them more in-depth shortly.

## Problem: Embed HTML client-side using JS

Because there is no good HTML, declarative alternative to embed (partially) trusted HTML fragments, 
lots of imperative JS based alternatives have sprung up. In fact, most third party services 
would ask other developers to grant them *complete* trust and embed their content as JS script, with 
*all* rights included.

To meet this generic need, complex JS template engines such as lit-html and hyperHTML can also be used.
Inexperienced or reckless developers might use extremely unsafe JS operations such as `.innerHTML`. 
Finally, HTML filters and HTML subset languages such as AMP can be used to 
create safe, third party HTML fragments. Embedding HTML fragments client-side is *off* balance.



Second, the reason the browsers hasn't been able to agree upon a set of good HTML solutions for 
embedding HTML client-side, is security. Client-side developers are much more eager to include HTML
fragments from third party sources than server-side developers. In fact, server-side inclusion is 
simple because it presupposes that the HTML fragments included are safe, local, stored on the same server,
`same origin`. Client-side, `<iframe>` presupposes that the sources of the HTML fragment are unsafe,
`cross origin`. The `<iframe>` therefore blocks several layout attributes on the `<iframe>` by default
such as an `<iframe>'s contents ability to `overflow`, for security reasons` (ie. clickjacking), 
thus causing lots of problematic situations for the developers. The client-side `<frame>` solution 
was intended for `same  origin` sources, but as this alternative has been redacted, the use-case has 
essentially been left without an HTML provision. Which triggers the explosion of alternative JS 
solutions and the vortex of confusion that follows in their wake.

In this chapter we will discuss all these problems and solutions in more detail. We will look at how
`<iframe>`s can be used to secure and sandbox and pigeonhole the embedded HTML fragments. Here we will
look at the solutions that `<iframe>` provides, such as `sandbox`-ing the network requests and scripts
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

## References

 * [wiki: Framekiller](https://en.wikipedia.org/wiki/Framekiller)
 * [wiki: Framing](https://en.wikipedia.org/wiki/Framing_(World_Wide_Web))
 * [MDN: baseURI](https://developer.mozilla.org/en-US/docs/Web/API/Node/baseURI)
 
To include HTML fragments with potentially malign code from a third party  is a *big* security 
risk. Both the HTML, CSS and JS code in an HTML fragment can be exploited in many creative ways.


