# Problem: how to get there? (Problem: UncannyLinks)

1. dynamic /-path only or dynamic /-path with query-parameters
   the browser will reload the page, dom and js
   dynamic server-side navigation, static clientside navigation
   unary, matches single locations
   externally closed, no arguments / depth in the navigation syntax
   to make it externally open, you need path-to-regex style semantic interpretation
   to make it plural, ie to address several different components in the same path, (nest or combine),
   the path-to-regex style semantic interpretation must is specialized and require more complex route maps
   
   query parameters are usually frowned upon as they seem uncanny as 
   too technical, too verbose, too complex morphologically and 
   
2. HashAndSlash #/, 
   links are inside the app are described as in 1. inside the app.
   links are then intercepted (HighjackLinks).
   A # is then added as a prefix to the link (and existing #location stripped for simplicity)
   and the link is passed on to the browser
   
   the # prefix in the link is out-of-place. Makes the link look altered/hacked => UncannyLink.

3. HighjackAndPushState
   links are described as in 1.
   Links are then Highjacked, but instead of adding #-prefix and then giving the link to the browser,
   the Highjacker instead uses the pushState method to update the location bar,
   notifies the router of the altered path and **completely bypasses the browsers own link-manager** 
   (and cuts it out of the loop completely).
   
   This enables completely familiar /-links for modern browsers (ie >IE11).
   But the problem to make it externally open and plural remains, requiring path-to-regex style grammar 
   that includes semantic rules (which segments are component paths and which segments are arguments).
   
   Shareable links are MPA. The server can prepare and speed up loading of shared links.
   However, with a web component structure, it is an open question how plausible such speed up are.
   This theoretically enables a "single-trip/no-round-trip" load with all used web components inlined
   while at the same time *not* loading web components not yet in use.

4. HashDot
   links are described using HashDot format.
   This format has syntactic support for both arguments and plural components (ie. arguments and multiple hashtags).
   Draws upon hashtags and filetype syntax to create familiarity.
   Will likely be perceived as forreign and uncanny if the parameter values are not familiar.
   Too many hashtags, string arguments, and long arguments should be avoided to remain recognizable.
   
   Shareable links are *purely* SPA. 
   This cannot *both* inline all the web components the user needs for a link, while at the same time
   *not* loading all web components in the SPA. 
   
## Advanced Routing 
   
* HashDot routing

1. shortcuts
   Links are on the format "component + args".
   Routes are on the format routeA => routeB.
   Routes have variables for individual arguments.
   Routes have variables for all arguments.
   Routes are then matched and then translated.
   How to avoid circular translation:
      1. no "expanding" rule is run twice? All the hashtags on the left side is also on the right side.
         this is the simplest, fastest solution i think. Can be marked during preparation.
      2. the same hashtag cannot be added twice in the resolved output?
   
   Shortcuts can be used to make the route simpler.
   Shortcuts can simplify the tag name, the location bar is simple, while the system gets the full component path 
   so the reducer state mananger/controller can skip getting involved with route interpretation.
   
   Shortcuts can also enable the developer to maintain his links simpler, in a shared map. 
   When links are updated on the serverside, if these are only directly accessed via the routemap, 
   then the routemap is the only place that then needs updating. Vice versa for altering links in the app view.
   
2. simplification.
   The same rules can be run in reverse.
   Routes are also on the format routeA <= routeB.
   This can be used to simplify the links the user sees in his address bar.
   This means that the developer can manage pure function composition of routes 
   (ie. both add routes (make shortcut) or remove routes (simplify) based on general rules in the routemap.
   
* Advanced HighjackAndPushState routing.
   The interpretation of rules in HashDot can be applied to HighjackAndPushState routing.
   But, as the HighjackAndPushState require semantic interpretation to separate component from arguments,
   this is likely too complex too be valuable. I'm not sure if this can be successfully pulled off.
   
### Anti-patterns
#### 1: link path-to-actionable inside the router.
This is not necessary. There is no need to mix parsing and translation of paths with 
how to link path to component (the interface to both app functionality and app state).
This linking is best done either:
1. in a reducer function for the single state manager
2. in a custom event listener on routechange
3. in a controller component.

## AntiPattern: Harmonize History state with App state. 

HowTo associate app state with native history state?

The user might expect the "navigation state" to change at most every few seconds. Let's say 2-3 times per 16 seconds.
When the user presses back and forth, he will expect to make a jump that is at least a couple of seconds long.

The app might receive events that forces it to change the app state upto several times per frame. 
Let's say 2-3 times per 16ms. App state time is roughly 1000 times faster than user navigation time.

Thus, except for a few rare web apps that can accept the app state to change no faster than user navigation time,
harmonizing app state with navigation state will cause one of two problems.

1. All app state changes are pushed as navigation states. This will flood the navigation state with hundreds of 
statechanges almost immediately rendering it useless. This would also burden the memory and processing of the browser extremely,
as adding navigation states likely adds an immutable "stringified" state. todo, check this out.

2. App state is slowed down to navigation time. 
This will limit the developers ability to make state changes greatly.
And app state now becomes useless as single state forcing the app to retain state within its components again.

## Pattern: DoubleBack, Back, DoubleForward, Forward

The router can also use time to compose routechange gestures.
DoubleBack is two backs within 300ms.
DoubleForward is two forwards within 300ms.
Using such gestures, the developer could for example in a video-player use Back as 30sec back and DoubleBack
as back to start (which should be set up as a navigation change).
In a drawing app, Back would be ctrl-z, while DoubleBack would go back to "previous navigation change".

In order to implement such a move, the router must be told to 
immediately "undo" the first navigation Back, and then see if the user makes another back before the app approves it.
Todo: this pattern really needs to be tested. I am not sure it is possible. 
associate Back with app-state changes and 
DoubleBack with navigation changes. 

This will associate the back button with something like "ctrl+z".
A create thought here is to make a "double back", a jump back within 300ms, mean something else than different than a "single back".


To harmonize a single state with the native history state thus means 1 of several bad choices:
1. your apps state works in user naviagtion history mode, ie. super slow. 
This means that changes to the state cannot be backtracked
2. the navigation history works in app state mode, ie.
   
## Alternative 1: HashAndSlash

Many SPA that use page-internal-links today follow this recipe:
1. Convert path+argument data into a `/`-based format.
   The `/`-notation makes the links *look* normal, even though they are not.
2. Add `#` or `#!` infront of the `/`-based location.
   This `#` would not belong in a normal `/`-based location, and 
   this makes the composed **HashAndSlash** link look slightly different and thus suspicious.
3. Convert the `/`-based link back out into path+argument data.
   This often require the parser to be aware of semantic properties of the different segments
   in the links as some segments might be path names while other argument values.
   
The **HashAndSlash** approach has two major drawbacks.
First, it looks familiar, but different. Uncanny. 
To add a deeper syntax would break even more with established convention,
thus the `/`-format is kept unary and flat.

Second, double conversion. 
It requires conversion of key/value-pairs into a flat, unary `/`-delineated format,
*and* back again.
                          
In the [SlashMPA](todo) chapter, we will describe in detail how paths and arguments can be converted
in and out of the flat, unary `/`-delineated format.

## Alternative 2: HashDots

> Why? Familiarity. You don't want the link to look strange.

The HashAndSlash approach search for familiarity *inside* established convention for web app navigation.
But, it is possible to find familiarity *outside* this cultural domain too.
Today, the `#` symbol is primarily associated with hashtags.
Hashtags is a means for *thematic* linking and navigation(!) in social media.
This external convention can be drawn upon to create new familiarity for the user, 
which would ease adoption and lessen suspicion.

When we apply the hashtag convention to internal navigation in an app,
some core navigation premises are turned inside out:

1. Singularity vs. plurality
   * Each `/`-segment in a path points to a different folder. 
   But, when you combine segments, you only get one outcome (cf. `/this/is/a/single.file`).
   Archetypically, when `/`-segments are combined, they to point to a *single* file.
   * Individual `#`-tags also point to individual themes.
   But, a tweet can link to many different themes at the same time by listing an array of `#`-tags 
   (cf. `tweet! #thinkingOutsideTheBox #moreIsMerrier`).
    Arhcetypically, multiple `#`-tags point to multiple themes.

3. Flat vs. deep.
   * Morphologically, the `/`-segment and the `#`-tag resemble each other.
   They both have a prefix symbol (`/` and `#`) followed by a word.
   * The morphology of segment folders is flat. Archetypically, a folder only has a flat name.
   * The morphology of hashtags is also flat. Archetypically, a hashtag theme also only has a flat name.
   * However, the morphology of *last* `/`-segment in a path (the filename-segment) is deep. 
   Typically, filenames are suffixed with a `.` and then a filetype.
   Furthermore, several such suffixes can be added to compose a structure (cf. `script.min.js.map.tar.gz`).

3. File vs. theme
   * The typical iconic value of a `/`-segment  is a folder or a file.
   * The typical iconic value of a `#`-tag is a theme or a currently running cultural conversation.
   
How to these three premises relate to the task of navigating inside a web app?
We start in reverse order.

**App internal links point to pages or views, not files nor themes.** 
Inside a web app, we typically need to point to a page in the memory of the app.
Sometimes, such pages are modularized and stored as files.
But more often, pages in a web app *are not files*.
Pages often represent a component or a function in a single state machine.

Furthermore, the components or state functions also rely on the state of the app 
(stored either inside the component or in a global state).
For example: if you navigate back to a search page, 
you often want this search page to remember your last queries.
As such, pages are not as static as a "file", because they room data about the 
"current, ongoing discussion between the user and the app".
A component or function inside an app is not a cultural macro-construct like the hashtag themes,
but they often can be a constructed micro-theme in each session between the user and the app.
When the user says "search" the second time, 
a "good app" should often go back to the state of "search" as was constructed by the user the last time. 

In a running web app, components and state functions resemble files as they are all data and/or function modules.
In a running web app, components and state functions resemble themes as per-session, stateful data constructs.
Both concepts are guiding and misleading.

**App internal links are deep; components and state functions often require input.**
When navigating to a page inside a web app, we often need to pass it data:
 * a search page might need a query string, or 
 * a product page might need some categories and price range information.

This is the same usecase as the query-string (ie. `?query=this&query=that`) for server-side web apps.
The need for query-strings show the deep data structure needed when navigating to server-side 
components/functions and the need to go beyond the flat structure of `/`-segments.
`#`-tags also match this requirement poorly.

However, filenames has deep structure, and it could be possible to use `.`-suffices to
pass page arguments.

**App internal links are often unary, but sometimes plural.**
Sometimes, we navigate to a page/view that is well defined as a single component.
But, quite often we do not.
A page or view can often be just a collection of sub-pages/sub-views.
Things start to get messy when we:
1. get many combinations of such pages which in essence either require us to
   pass try to pass data to several such 

You can see this when paths become "nested". Then you need to pass data into more than one unit.

Inside a web app, we typically to not need to navigate to a 
 internal navigation, we typically do not need to point to neither folders, files, themes or discourse;
   *Inside an app we typically need to point to one or more components and/or values for these components*.

   * Inside an app, we often need to point to just a single component that can resemble a file.
   This component we might also need to pass
   * App internal navigation using hashtags should therefore embrace plurality conceptually.
   An app internal link can contain many hashtags, and the route itself can be used to compose
   unique instances of the view.
   * A side effect of this premise, is that the router itself does not need to unify multiple hashtags.
   *Not* squeezing multiple entries into a singular output reduces the processing effort.

   
Neither `/`-segments nor `#`-tags 
A path is a composition of one or more components.
* 

When we merge the convention of hashtags into url, can we also merge the convention of `.` in 
   filenames into hashtags? Would `https://app.shoestore.com/#marathon.42` make sense? 
   My personal opinion is that it does.


A component or function inside an app is not a cultural macro-construct like the hashtag themes,
but they often can be a constructed micro-theme in each session between the user and the app.

In a running web app, components and state functions resemble files as they are all data and/or function modules.
In a running web app, components and state functions resemble themes as per-session, stateful data constructs.


# References

 * [HTML spec on links](https://www.w3.org/TR/html4/struct/links.html)
 * [path-to-regexp](https://github.com/pillarjs/path-to-regexp)
 * [Article on routing](http://krasimirtsonev.com/blog/article/deep-dive-into-client-side-routing-navigo-pushstate-hash)
 * [Video on routing strategies](https://codecraft.tv/courses/angular/routing/routing-strategies/)
 * [Demo of pushstate and popstate](https://geeklaunch.net/pushstate-and-popstate/)
 
 
## Draft, should I put in this in this chapter??

> Parsing #-location as if it was a path location = to spoof the path location.
> This is discussed under MPA router.

Systems relying on both the path and the #-tag of URLs will likely need to implement a parser
like [path-to-regex](https://github.com/pillarjs/path-to-regexp) on the client.
But, system relying on #-tag will also need to implement relative linking in some instances where
regular path-based navigation do not.

 