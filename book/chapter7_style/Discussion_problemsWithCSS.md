One perspective on CSS is this:
> CSS and its global scope is any system architects nightmare.
If errors in CSS had stopped a web page/app from working, 
CSS and the way it is organized would have been changed looooong ago.

An answer to this perspective is:
> That is why we want to hide CSS. 
CSS is full of old, no-longer in use rules that we wrote some time ago.
Most of the rules had a purpose back then, but now, only a few of the rules do.
But to find out exactly where and when these rules apply can be too tedious, 
so it is better to simply hide the CSS rules in separate files.
A style that have since been reworked several times, but we are afraid to remove the old rules
as some of our elements might need them occasionally or implicitly.
So, yes, please, hide that stuff!

An answer to that again is:
> No wait.. That looks wrong.. We don't want to hide stuff we don't understand! 
We *only* want to hide stuff that we *do* understand. And. We don't really want to hide it: 
we just want to split it up into manageable bits, modularize it, 
so that we can design, test, deploy, maintain and sleep knowing about, without numbing our 
sensibility to system failure.

So our exercise is:
> So, ok, that is what we will do here. We will not hide anything in css that is ugly.
We will only encapsulate style stuff that is understandable and that can and should 
put into a web component. We will make CSS prettier. And I promise you: 
web components *do* provide a mechanism to uncook half the bowl of CSS spaghetti.
