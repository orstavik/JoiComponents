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
your web page now received all your keystrokes and mouse/touch gestures? What if WYSINWYG?

## Problem: UI redressing, clickjacking and `<iframe>`

If somebody could "redress" the UI of the web site you are visiting, they would easily be able to:
1. make you *think* you are still at the trusted web site doing what you intended to do, while
2. in reality interacting with a completely different web site that is stealing your keystrokes
   and "clickjacking" you.

Client-side, `<iframe>` would be one of many natural place to launch such an attack. 

1. If the source of an `<iframe>` on a web site could be altered, such as if the `<iframe>` for example 
   could contain a small piece of user generated HTML, CSS and/or JS code, and
2. if the `<iframe>` could overflow its given view frame/layout area on screen, 
3. then the content of an `<iframe>` could invisibly place itself above all the rest of the page
   and clickjack the user.

That is why:
1. **The layout of an `<iframe>`** is locked down with fixed `width` and `height` properties.
2. The content of an `<iframe>` can **not overflow**, never ever.
3. If an `<iframe>` contains more content than can be fitted within its fixed `width` and `height`,
   then this content can only be accessed by *scrolling* inside the `<iframe>`.
4. `<iframe>`s are their own "scroll-browsing contexts", that as long as they're content is bigger
   than their layout frames need their own scrollbars.
   
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
What if you wanted to avoid the annoying scroll behavior of `<iframe>`s? What if you wanted a 
`<responsive-iframe>`, a `<true-inline-iframe>`?

But, what if you don't want two sets of scrollbars? To solve this issue, the web app must implement
its own form of overflow, its own way of making the frame of the `<iframe>` expand to its content size 
in a way that 1) doesn't trick the user and 2) removes the need for additional scrollbars.
And, the `<iframe>` must also transpose the scrolling event from the `<iframe>` too its parent.



## References

 * [Wiki: clickjacking](https://en.wikipedia.org/wiki/Clickjacking)
