# Intro: IframeSecurity

## The dilemma of web security

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
   But *you* are not. You can surf only inside walled gardens.

The balance between open+insecure vs. closed+safe is *always* up for debate.
And the browsers and web ecosystem always try to find that point of balance. 
As the web is thriving, we all seem to be doing a fairly good job finding that balance.
But. There is *one* area where we can safely say that the browsers and web ecosystem has *not* struck
a good balance: embedding HTML fragments client-side. 

## Iframe security

When an HTML fragments from `child.com` is embedded into another HTML fragment from `parent.com`,
then we need to protect *both* `child.com` *and* `parent.com` from each other. 

First, we look at protecting the parent, then we look at protecting the child.

### Protecting the parent

Let's say we have an innocent web page `parent.com` that embeds a piece of code from `child.com`.
Let's say `child.com` is honest and kind, and that `parent.com` trusts `child.com`. But then,
one day, someone hacks `child.com`. They are able to slightly alter the code that `child.com` passes
out to `parent.com` and lots of other sites, to include something nefarious. Now, how should `parent.com`
protect itself from such scenarios?

1. Its obvious that when `parent.com` puts a piece of code from `child.com` inside itself, 
if the `child.com` code cannot be completely trusted, it cannot be allowed to access `parent.com` JS
context: if the `child.com` could add event listeners inside `parent.com`, then it could listen in on 
keystrokes, username and passwords; if `child.com` could run functions inside `parent.com`, then it
could silently add items to a user's shopping-cart; etc. etc.. 

Thus, an `<iframe>` must be able to block `child.com` from accessing the JS context inside 
`parent.com`. The `parent.com` must be able to seal off its JS state, its DOM nodes and attributes, 
and all the events occuring inside `parent.com`.

2. Its also fairly obvious that if the `child.com` could send network requests that act as if they 
originate from the `parent.com` app itself, that could trick servers with less than optimal security
to believe that it is an authenticated making the request and perform illegal actions.

This means that if the `child.com` is given access to load its own scripts and images and what not,
from wherever, it cannot do so *pretending* to be the `parent.com` app.

3. Another less obvious security risk is layout. If `child.com` could make DOM elements that could
stretch out anywhere on the screen, it could make an invisible overlay textbox or link that hovered 
above something else on screen fooling the user to give away some of his or her keystrokes or clicks.
If the user thinks he is clicking on a link inside `parent.com` that would take him to `example.com`,
and the `child.com` overlay instead took him to an identical looking web page on `eksample.com`, 
the attacker might lure lots of information off its unsuspecting victim that believes he is still among
trusted friends. If the `child.com` could add a set of invisible text boxes anywhere on the users 
screen, the attack could easily steal username and passwords.

Thus, an `<iframe>` blocks `child.com` from `overflow`. Always.

### Protecting the child

But, the protection must go both ways. And, contrary to what you might expect, it is the protection of
the embedded web page that is most problematic.

Let's say that `child.com` is a likable social network that automatically logs in its users. 
What if this likable `child.com` is opened in an `<iframe>` inside `kidnapper.com`?

`kidnapper.com` must obviously not be able to access the JS state, the DOM state and attributes and
events. If it did, it could read your entire list of friends, their email and phone numbers, maybe parts 
of private messaging. And `kidnapper.com` must obviously not be able to send network requests under
the name of `child.com`. The same firewall, "browsing context", protects these aspects in the 
`child.com` as it does `parent.com`. But, there are two other ways `kidnapper.com` could still exploit 
its `child.com` users.

### Problem 1: Clickjacking (and like-jacking)

Let's say that you happen to visit `kidnapper.com`. There, you sees the link to a news article, click 
on it, navigate to a trusted news provider, and start reading. But, behind the scenes, `kidnapper.com`
has fooled you. When you loaded `kidnapper.com`, `kidnapper.com` opened up an `<iframe>` with a 
"like" button from `child.com` that automatically logged you in. `kidnapper.com` then styled the 
`<iframe>` as transparent and placed it over the link to the news article. When you clicked on the 
news article, `kidnapper.com` both let you click on the "like"-button while at the same time sent you
along to the news article you desired. So, while you are happily reading the news, your not-so-tech-savvy 
uncle has just registered his credit card with www.how-to-get-rich-quick.com *based on your 
recommendation*. Such attacks are called "clickjacking" or "likejacking".

Old browsers (ie. ie7) would open all HTML pages if an `<iframe>` in `kidnapper.com` requested it. 
Modern browsers do not. In old browsers, JS script called framekillers had to be added to sites to 
prevent them from being opened up inside `<iframe>`. Not a good solution. From ie.8 and onwards, an 
HTTP header called `X-Frame-Options` can `deny` or only allow from `sameorigin` documents. 
`X-Frame-Options` has been replaced by CSP, "content security policy". But, since CSP is not 
universally supported, `X-Frame-Options` is currently the base solution.

If `child.com` must allow others to frame it, such as social media web sites may, there is no 
direct defence against clickjacking. If the embedded page offers a one-click-shop or one-click-like 
mechanism, then clickjacking is unpreventable. Instead, to avoid clickjacking in such scenarios,
a pop window or `window.confirm(...)` dialogue should be established to ensure the user is not
spoofed. 

### Problem 2: does an `<iframe>` size matter?

Let's say `parent.com` opens up `child.com` in an `<iframe>`. Now, `child.com` does not allow
CORS meaning `parent.com` will not be able to access its `window.scrollHeight` or `scrollWidth`.
This means that there is no way for `parent.com` to adjust its size to accommodate the needs of its
`<iframe>` HTML fragment, `child.com`. This is a pain, but why is it so? After all, the size and 
shape of the content inside the `<iframe>` is clearly evident for the user.

Let's say `kidnapper.com` wants to know if the user has an account on `child.com`. When the `<iframe>`
loads `child.com`, it will automatically log the user in. The login page of `child.com` has different
dimensions than the logged-in page of `child.com`. Thus, even something as innocent as the outer 
dimensions of a web page can give an attacker information about a relationship between a user and a
third party.

## Conclusion: `<iframe>` for embedding third party HTML fragments

The main benefit of `<iframe>` is a separate browser context. And the main benefit of the separate
browser context is that it:

1. provides its own `baseURI` context.
2. safely isolate JS code and network requests for both the embedded and embedding HTML code.

As there is no other feasible way to establish a separate `baseURI`, JS and network context 
in an HTML document, the `<iframe>` is the *only* realistic contender for embedding third party 
HTML fragments, trusted as well as untrusted.

The problem with `<iframe>` is not too little security. Sure, UI redress attacks such as 
clickjacking is a loose bolt. And sure, `<iframe>` can be leveraged to exploit screw-ups in CORS 
settings on a server to pry open a backdoor. But all in all, `<iframe>`s can be taken into fairly
unsafe territory.

The problem with `<iframe>` is that its separate browsing context is a bit too restrictive with CSS
and events: `<iframe>` provide no means to:

1. **pass CSS styles down** from the parent browsing context into the child, `<iframe>` browsing 
   context, 
2. **pass script resources such as custom element definitions** from the parent browsing context 
   into the child, `<iframe>` browsing context, and
3. **pass events up** from the `<iframe>` browsing context to the parent browsing context.

To protect the integrity of `child.com`, this should of course not be permitted when `<iframe>`s
are used to load complete documents with cookies and all. But, when used with For the original use-case of `<iframe>`, this should not be permitted. But, for the actually more 
common use-case of inlining partially HTML fragments that you do not completely trust, but that you
still would like to style and position and control navigation and scrolling of.
The ability to do so *should* be restricted in some cases, but a declarative means to establish a 
bridgeat the same time 

transpose CSS 
bit restrictive, but
by and large , but that it is:
1. too strict security for 
2. style and 
3. event coordination. The security san is that there is no simple, declarative way to:


2. to pass events *from* the 
 turn off some of the CSS