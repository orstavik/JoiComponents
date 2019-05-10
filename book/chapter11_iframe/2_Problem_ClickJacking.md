# Problem: ClickJacking and SecretSizeIframe

## WhatIf: WYSINWYG?

What if you think you are looking at the login form of your email provider, a social network app or 
bank web site? And doing something like typing your username and password or confirming a bank payment?

But, what if you are not looking at what you think you are looking at, but instead something completely 
different? What if all your actions are actually taking place on a completely different web page than 
the one you are looking at? What if someone were given the ability to put an invisible layer *over* 
the website that you are currently browsing? What if a small `<iframe>` in the bottom right corner 
with just a random advertisements, and equivalent technical vetting by both the advertisements agency
and the trusted web site you are visiting, could invisibly and silently expand its code *outside* the 
designated area of that `<iframe>`? What if this "overflowing `<iframe>`", this invisible overlay of 
your web page now received all your keystrokes and mouse/touch gestures?

## Problem: UI redressing, clickjacking and `<iframe>`

If somebody could "redress" the UI of the web site you are visiting, they would easily be able to:
1. make you *think* that you are still interacting with the trusted web site, while
2. in reality a completely different web site is stealing your keystrokes and misdirecting 
   your network navigation.

Client-side, `<iframe>` would be one of many natural place to launch such an attack. 

1. If the source of an `<iframe>` on a web site could be altered, such as if the `<iframe>` 
   for example could contain a small piece of user generated HTML, CSS and/or JS code, and
2. if the `<iframe>` could overflow its given view frame/layout area on screen, 
3. then the content of an `<iframe>` could invisibly place itself above all the rest of the page
   and "clickjack" the user.

That is why:
1. **The layout of an `<iframe>`** is strictly bound to its `width` and `height` properties.
2. The content of an `<iframe>` can **not overflow**, never ever.
3. If an `<iframe>` contains more content than can be fitted within its fixed `width` and `height`,
   then this content can only be accessed by *scrolling* inside the `<iframe>`.
4. `<iframe>`s are their own "scroll-browsing contexts". As long as their content is bigger
   than their layout, then `<iframe>`s need their own scrollbars.
   
## Problem: SecretSizeIframe

When you load an `<iframe>`, the layout restrictions run *both ways*. As we have saw above, the
`<iframe>` cannot overflow its borders. But, `<iframe>`s are also *secretive* about their own layout.
One might expect that the size of the content of any `<iframe>` was open information. After all, there
is nothing secret about it, the user can see it fine for himself? And that should mean that the parent
frame should be able to read these overall layout of the `<iframe>` to faciliate automatic adjustments
it needs to do to its own layout, right?
                                                          
No. Not so. The inner size of `<iframe>`s is by default a *secret*. To read the inner size of an 
`<iframe>`, the parent frame must use JS and read `document.scrollHeight` and `document.scrollWidth` 
from within the `<iframe>`. But, why? Why can't the `<iframe>` let us know its inner size? How can 
the overall layout size of an `<iframe>`'s content, clearly visible to the user, be a security risk?

First, the user that watches an `<iframe>` is a different person than scripts on the page that loads 
and shows the `<iframe>`. For example, lets say you visit moneyNews.com that shows you your own stocks
in an `<iframe>` from stockbroker.com at the bottom of the page. Now, you the reader of the moneyNews.com 
enjoy seeing your stocks next to the news. In fact, you mostly read moneyNews.com because it 
subconsciously gives you an excuse to count your money, again and again and again. 

But, you do not want moneyNews.com to know any of this. You do not want moneyNews.com to know that in 
the last six months, your portfolio has shrunk from 100 entries to 10, because you had to sell a lot of
stocks. And, in 6 months from now, you do not want moneyNews.com to be able to see that you no longer
log into stockbroker.com, because of the soon to come financial collapse and overdraft you happened
to fall into. Now, if moneyNews.com could access the layout dimensions of the stock-ticker from 
stockbroker.com, then they would know all this. They wouldn't be able to read the current state of your
bank accounts, but they would be pretty close to it.

That is why even the size and layout of the content inside an `<iframe>` is secret for the parent frame.
The user can and should see this clear as day, after all, both the parent page and the `<iframe>` page
has a direct relationship with him. But, the parent and `<iframe>` pages might have zero relationship
between them. They are by default completely untrusted.

## WhatIf: frames could trust each other?

But, what if the content of the alternative frame is trustworthy? What if you wanted to embed HTML
fragments from another one of your servers? Or from a server that you trusted as much as your own?
What if your problem was not primarily sandboxing js, but avoiding redundancy when sharing 
trustworthy HTML fragments across several different apps? What if you wanted to avoid the annoying 
scroll behavior of `<iframe>`s? What if your problem was coordinating events and synchronising style?
What if you wanted a `<responsive-iframe>`, a `<true-inline-iframe>`?

In these trusted use-cases, the security restrictions for `<iframe>` layout becomes a problem.

Yes, to stylistically inline an `<iframe>` by making its content able to overflow 
over the parent page, can confuse the user and thus create a potential risk for clickjacking. 
But, no, `<iframe>` overflow can also be handled safely by the parent page. 
An `<iframe>` positioned bottom right could for example `allow-overflow-right` and 
`allow-overflow-down` could be easily recognizable and safe. 
If the `<iframe>` did direct the scrolling behavior inside itself, but allowed these events to pass 
to its parent, a smooth `scrolling="no"` `<iframe>` that could room content of dynamic size could
be safe and easy.

Similarly, `<iframe>`s whose content is already known to the parent frame, ie. from either same-origin
sources or set via `srcdoc` attribute, could populate inner dimensions fo the contained document
onto the `<iframe>` element itself. 

None of the layout restrictions cross `<iframe>` borders listed here can however be lifted via HTML.
To solve them, an imperative solution must be implemented.

## Solution: `<trusty-iframe>`

The `<trusty-iframe>` is a web component that adds `allow-overflow-right/left/top/down` to `<iframe>`.
The `<trusty-iframe>` can only accomplish this with `same-origin` `<iframe>`s *and*
`<iframe>`s whose content is set via JS or `srcdoc`, but that does not have the sandbox `same-origin`
feature.

To accomplish its goal, the `<trusty-iframe>` wraps its `<iframe>` in a block element. 
The outer block element's dimensions is set to match its inner dimensions, but with overflow.
It then sets the dimensions of an inner, normal `<iframe>` to be that of its full dimensions,
while at the same time cloning and transposing the outer dimensions of the outer block onto the 
root HTML element in the inner `<iframe>`.




## References

 * [Wiki: clickjacking](https://en.wikipedia.org/wiki/Clickjacking)
