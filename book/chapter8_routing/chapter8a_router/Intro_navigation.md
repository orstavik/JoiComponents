# Intro: Navigation

Digital networks and connectivity is important. The internet gives us the ability to
downloaded texts and movies to your screen from the other side of the world within milliseconds.
At virtually no intrinsic cost. It is just beautiful. We all love it.

But, without links, digital connectivity would virtually be useless.
Because, without links, you wouldn't find that text or movie.
Links enable every web page, from your grandma's facebook posts to google search and netflix playlists,
to show you where to go. 
For example, if you add 15 links on each page and 5 seconds per page, 
in just under a minute a user could theoretically navigate to one of 15^12 = 129 trillion different web sites
just by clicking. For comparison, the web is estimated to contain only 2 trillion different web pages today.
Add on top of the links the socio-semantic algorithms of search-engines and social media,
and you will find exactly what you want in a couple of seconds or even before you even knew it.

So, if the internet is humanity's new hive-mind, the digital network is the skull keeping 
everything together in one place while the links are the neurons that make up the brain.
In short, the link is the defining feature of both the web and the browser.

## Links and navigating events

Let's not stop here. Let's extrapolate this logical argument.
If links make up humanity's new hive-mind, then the makers of links are.. making life!
Make two links and you are 1 trillionth divinity.
Make an algorithm like Google search or Facebook like, and you are of course a God.

Ok, so how exactly is this divinity wielded? What did God do when she made light?
It was likely something like this: `<a href="http://www.example.com/public/light.html">`.
Remember, in the early days, `https` did not exist.

Now, this fact is usually a bit disappointing. 
Something as important and powerful as links *should be* more complex than a dumb `<a href>`-tag.
Is that all it comes down to? Can't we do *more than that*?

Technically, the answer is that we can do more. There are actually four ways to make links:
`<a href>`, `<area href>`, `<form>` and SVG `<a href>` tags.
More on this is in the next chapter [HowTo: make links](HowTo_makeLinks.md).
However, the final, principal answer to this question is "no". We really can't do more than that.
Links are really that dumb, only minor variations of `<a href>` tags.

## Interpreting links

Ok, so if there is no complexity in making links, 
then surely magical complexity must be wielded when links are interpreted.
Again, one must assume that behind powerful functionality always lies brittle, nail-biting technology.
So, how does the Gods of technology teach the internet hive-mind to interpret dumb links?

Again, the answer is disappointing. 
The club of divinity accepts all applicants with a pulse and keyboard. You are not special.
To interpret links is simply to either:
1. go to a new location by loading a new document or file or
2. go to a location within the current document by scrolling, toggle content or similar.

## The native router

To interpret links the browser has a builtin function: [the native router](HowTo_nativeRouter.md).
When given a url pointing to another document, the native router will download that resource and 
replace the document currently in view with that other document. 
When given a url with a #-location within the document, 
the native router will simply scroll to that location.
((todo move to native router chapter: 1. If the given url points to the same document location with a new hashlocation, then 
scroll to the `<a name="hashlocation">` or element with `id="hashlocation"`.
2. Otherwise, download the new document of the given url and replace the document you have with the 
newly downloaded document.
))

Sure, the native router contains quite a few edge cases and some security checks, 
mostly associated with legacy `<iframe>` support.
But, at its core, the native router is utterly simple.
Thus, in a couple of hours or even minutes, developers can make a [custom router]() to
replace and/or complement the browser's native router.

## Custom routers

With today's platform, a custom router needs two steps to be built:
1. `navigate` event
2. custom router function

#### The `navigate` event

All events that can produce a link interpretation by the native router must be identified.
There are a total of four different native events that might trigger a response by the native router:
`click`, `keypress`, `submit`, and `hashlocation`.
These four events, especially the `click` and `keypress` events, must be filtered 
because only some of these events will trigger such a response.

After filtration, these different native events will all end up triggering a native router response.
Thus, any navigation by the user that can be intercepted by the app, can be viewed as a pure-function 
subset of the four native events. And therefore, the simplest way to is to establish a ComposedEvent
(cf pattern for mixin/gestures) that wraps all the different forms of filtered out, native events and
recast them as another composed event: [`navigate`](Pattern_navigate.md).

My personal opinion is that an event like this should be considered a base feature of the platform,
and therefore a [Proposal: the `navigate` event](Proposal_navigate.md) is given.
The `navigate` event basically would replace the `navigate` event described above, but 
also capture the two problems of [triggering navigation without the possibility of interception
that can be caused by the HTML `target` attribute and the `HTMLFormElement.submit()` method](Problem_submitTargetSubmarines.md)
This proposal would complement, not replace current functionality, thus be fully backward compatible,
while at the same time be possible to fully replace existing composed events in the future.

#### Custom router functions

Once the `navigate` event is established, a [custom router](Pattern_customRouter.md) needs only listen for such events on 
the `document`.
The custom router can then quickly check the value of the `navigate` event request, 
ie. its url or posted content,
to make a decision of which action it would like to perform.
Examples of common such actions are:
1. Load content resources such as texts, new images and other sources via either establishing 
new DOM elements (such as new `<img src="...">` tags) or via ajax.
2. toggle the view of menus or other elements already existing in the app.

When it needs, the custom router simply blocks the native router action by calling 
`.preventDefault()` method on the `navigate` event.

There are a couple of patterns for custom routers:
1. [HashRouter](Pattern_hashRouter.md) does not need the `navigate` event, but 
can simply be made to work using the `#`-location and `hashchange` event.
2. [SlashRouter](Pattern_slashRouter.md) needs the `navigate` event, but 
can in turn use "both folder and filename parts" of the url as parts of its navigation
(or more precisely the parts of the path and segments of the url). 
The SlashRouter should be coordinated with the `<base href="">` element.
3. [MpaSpaRouter](Pattern_MpaSpaRouter.md) is a common extension of the SlashRouter pattern.
The MpaSpaRouter uses the SlashRouter pattern client-side to create a SPA application on the client.
However, when coordinated with a setup server-side that delivers different files based on different
routes specified within the scope of the SPA SlashRouter, 
the server can pre-render and pre-load resources what will be a SPA app once loaded to the initial 
location the user will land, thus getting the MPA benefit of quick rendering of the initial navigation,
and the SPA's benefit of quick subsequent navigation within the app's scope.

## References

 * [w3schools.com: `POST` vs. `GET`](https://www.w3schools.com/tags/ref_httpmethods.asp)

## Old drafts

2. a function that reads the content of the `request` (ie. the `url` and/or post data) 
that
3. triggers either the native router or an alternative, custom JS function in the app script.

To load a new document or file from a new location is done by the browsers native router (described in [Pattern: external router]()).
Different parts of the URL (except the #-location) is used to define the location of the document or 
other resource to load. 

To scroll to a specified location within a document is also performed by the browsers native router [Pattern: internal navigation]().
Internal navigation is supported by the #-location in the URL address.

However, since the act of interpreting both external and internal links is so simple,
web developers can and do implement their own link interpreting structures.
. The act of interpreting links 
When the user chooses and clicks on a link, the browser takes that link address, downloads it, and
present it for the user. In fact, interpreting links is so simple that many web developers 
end up writing their own link interpretation functions, a mini router, a partial "browser within the browser".


Not only do you share your stake in the divine with so
many other makers of the web. Everyone who wants can just grab a slice.
You can't tell your family at the upcoming Christmas party that this giant leap of humanity
that you are part of developing 

But, before we conclude, we will look at the  