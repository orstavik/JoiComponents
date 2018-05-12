# Intro: Style in web components

The main function of web components in regards to CSS is to hide it.
CSS and its global scope is any system architects nightmare, and 
if CSS and style had been critical in order to make a page work, 
CSS and the way it is organized would have been changed looooong ago.
And that is why we want to hide it. 
CSS reminds us of all the old rules we wrote some time ago, that had a purpose back then, 
a style that have since been reworked several times, but we are afraid to remove the old rules
because some of the new rules that we have made implicitly relies upon them.
Yes, please, hide that stuff!

No wait.. That looks wrong.. We don't want to hide stuff we don't understand! 
We *only* want to hide stuff that we *do* understand. And. We don't really want to hide it: 
we just want to split it up into manageable bits, modularize it, 
so that we can design, test, deploy, maintain and sleep knowing about, without numbing our 
sensibility to system failure.

So, ok, that is what we will do here. We will not hide anything in css that is ugly.
We will only encapsulate style stuff that is understandable and that can and should 
be put into a web component. We will make CSS prettier. And I promise you: 
web components *do* provide a mechanism to uncook half the bowl of CSS spagetti. 

