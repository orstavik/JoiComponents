# Problem: how to format links?

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

**App internal links point to components or state functions, neither files nor themes.** 
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

 