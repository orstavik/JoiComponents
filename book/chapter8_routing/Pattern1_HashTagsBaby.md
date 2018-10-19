# Pattern: HashTagsBaby

A Single Page Application, or SPA, is a webapp that is delivered with a single entrypoint html file.
SPAs often need has lots of content that it needs to split across different views within itself,
and so SPAs very often comes with a menu to let the user choose different views/internal pages.
The SPA need to set up an internal navigation system *within* the SPA *on* the client.

But, the web already has a navigation system: links `<a href="...">`.
To both describe, organize and present navigation choicepoints, links is the goto HTML solution.
Broadly speaking, we can say there are two types of links:

1. Normal links, point to *page-external* resources, both from the same origin and unknown origins.
When the browser is given a normal link, it will *by default* **load the link resource**.
To *load the link resource* means both to:
1. fetch a file from either the network or browser cache,
2. construct and connect a new DOM from these files, *and*
3. initiate and load ES6 modules anew.

We will return to the problem of re-loading resources later in this chapter.

2. Hash-links, point to *page-local* anchors, elements with an `id` attribute that matches the `#`-tag of the link.
When the browser is given a hash-link, it will *not* load any new resource *by default*, but 
only scroll so that the first element with a matching `id` comes into view. 

## How to navigate a SPA with hash-links?

When we make a SPA, we can of course use *page-local* hash-links to navigate the app.
By simply adding several `<a href="#linkA">` and `<a href="#linkB">`, four things will happen:

1. Our page gets filled with links to page internal locations. 
These links are look and style in familiar ways.

And, every time one of these links are pressed, the browser:

2. append the `#` at the end of the location bar,

3. dispatch a `hashchange` event, and

4. **not(!)** reload the original page.

If the SPA only uses hash-links for its *within app navigation*, the
SPA can then simply listen for the `hashchange` event.
When the SPA receives the `hashchange` event, it would do two things:

1. First, unless the SPA specifically wants to utilize this builtin feature in the browser along side
   its own, internal navigation process, block the browser from accidentally scrolling to an element
   on the screen that happens to have an `id` attribute matching the #-tag (ie.`event.preventDefault()`).

2. Process the new #-location to change either its view and/or content. 

That is it! The simplest router your SPA can have is: none/the native browser.

## #benefits

The benefits of #-tag navigation is first and foremost its simplicity.

1. All your internal navigation is done using good old links: `<a href="#linkA">`.

2. Your SPA internal links follow the simple, established convention of web internal links: `#whatever`.

3. All the links in your browser that will *not* cause a reload starts with `#`;
   all the links in your browser that will cause a reload does not start with `#`.

4. Links to an SPA that includes internal navigation in the SPA can be shared.

5. All user actions that should trigger a *page-local* navigation both:
   1. updates the location bar, and
   2. dispatch a `hashchange` event on the window.
   
6. When the #-tag changes, the browser will **not**:
   1. trigger a reload of the DOM nor ES6 modules,
   2. halt CSS animations when the hash-tag changes, nor
   3. abort `async` scripts running in the background.
   
As chapter [Problem: Back'n'Forth](todo) will show, point 6 is hugely important. 
If users *only* could navigate a web page clicking links, other alternatives would be much better.
But, browsers and users do more. Users can also navigate using the Back and Forward buttons (functions)
in the browser shell. When these buttons are clicked (or triggered), the browser *always* reload the page.
So a major benefit of #-tag navigation is that it will **not reload the page** 
when the user goes Back and Forward.

## #drawbacks

But, everybody is adding routers to their page. Complex routers. 
So, what can other types of links accomplish that #-tags cannot?

### The SpaProblem

**Browser do not include #-tags in its communication with the server**.
Links shared with #-tags loaded by the user will therefore *always* 
only query for the SPA generic root entry point.

The SpaProblem hinders the server from making server-side rendering or other optimizations.
The SPA hides the internal navigation both at startup and run-time *from the server*, and 
SPA based on #-tag navigation are therefore difficult to convert to a MPA (multi page app)
that loads faster for different entry-points.
   
The SpaProblem also prevent the server to directly harvest user statistics.
If 1000 users open "https://my.spa.com/#productA" and 
50 user open "https://my.spa.com/#productB", the server only sees
1050 requests to "https://my.spa.com/".
This makes the SPA utterly reliant on client-side statistics.
   
### Are #-tag links ugly?

Another common complaint about #-tags is that they are ugly.
I believe this stems from the time when SPA was the exception and 
server-side applications based on php was the norm.
People and developers were used to seeing web app naviation on the form of
"http://my.website.com/folder1/folder2/aFile.php?query=this&query=that".
In the year 5 B.T. (before twitter), #-tags was less familiar. 
At that time, sneaking the unconventional #-character into something like
"http://app.website.com/#/this/still/looks/like/folders/toMe" would likely cause more suspicion.
While for example http would not. And suspicious-looking urls are ugly.

Today, the #-tag has even entered high politics. The "#" has come up in the world.
Furthermore, people now expect web apps to live client-side and not rely on a folder hierarchy.
Still, the convention for web links are based on the folder "/", but
the "#"-tag has gained widespread acceptance as a subject- or theme-based marker.
So, #-tags are likely not to be perceived as ugly in url's today as in the year 5 B.T.,
although people might be more sceptical of the content of #-tags than they were back then.

Thus, using #-tags in links are likely still to be perceived as unconventional, but 
today it can be argued that this convention can more easily be turned into something beautiful than 
what it could when SPAs was first introduced.

### Are #-tags convenient?

Compared to the "/path/resource.type" convention in URLs, #-tags are not convenient.
First of all, browsers parse URLs natively.
Browsers will identify the protocol, the server, the segments of the path, 
the filename, a map of query name-value pairs, and finally the #-tag for you in any url. 
But browsers provide no convention nor builtin support for parsing the content of #-tags.

Second, "/path/resource.type" convention in URLs mirror the "folder/file.name" convention for desktop computers.
This enables developer IDE to support updating references to resources adhering to the URI convention automatically. 
This makes it simple to move and rename files during development.
There are no such design-time support for #-tags.

Third, the "/path/resource.type" part of the URI have syntax for relative links: 
"../../another/folder/starting/two/levels/above".
SPA often provide static resources stored in a file system, and 
it can often be beneficial for developers to use relative links between such resources.

This makes #-tags quite inconvenient.

1. Systems relying on both the path and the #-tag of URLs will likely need to implement a parser
like [path-to-regex](https://github.com/pillarjs/path-to-regexp) on the client.
But, system relying on #-tag will also need to implement relative linking in some instances where
regular path-based navigation do not.

2. Another issue would be that #-tag based navigation would likely turn idiosyncratic quite quickly.
   New developers entering the project might therefore have to not only understand the implementation
   of the internal navigation, but also learn the syntax of a custom #-based format.

3. The biggest issue however is that without design-time support for matching links with resources,
   a project might quickly develop link-to-resource gangrene. As IDE tools no longer rename links and
   resources in tandem, developers might quickly either:
   * give up and let broken links explode during development, or
   * freeze up and let the fear of broken links hamper development.
   
\#-tag navigation is deeply inconvenient.

## #strategy

When using #-tags for internal navigation, my advice would be to free oneself from folder-based
convention of path-based navigation. Use the #-tags convention more freely to echo twitter's conventions.
Make a system of reference that do not rely on folder and filename for resource identification, and 
instead use the hashtags to directly refer to the entities in the route-map.
Use the modern conventions of #-tags, and base your router on that, instead of the old folder structure.
It will be simpler, it will look better, and it will hopefully also give you better ways to keep the
flesh of your link-to-resource flesh fresh.

## References

 * 