# Problem: how to format links?

When we navigate a web app, we need to find a way to express where we need to go.
The way we express these location greatly influence the way we see them, also as developers:
when we look at a map of the world, we think about the countries we can fly to and 
what films to watch on the plane;
when we look at a map of a subway system, we think about which route connects with what other route, 
and which book to read on the ride.
Similarly, the means of transportation also influence our choice of destinations.
Look at an airplane, and think about travelling abroad again.
Found that old subway stub in your pocket, and you think about your commute to work the next morning. 

With this in mind, lets find out how to get where inside our web app. 

## Where to go? 

1. **One file**.
In the beginning, the web was a group of hyper-text documents stored as files.
The files were stored on server disks.

The file is conceptually *quite* **static**, but not *absolutely* static, 
as it can for example be updated twice a week or upgraded every year.
The file frame a wholistic, **unary** view to the user, and 
although it can link up other resources from within, from the outside it is an **externally closed** entity.
The archetype of the web link, `http://www.example.com/public/index.html`, mirrors this destination.

2. **One pure function page** (server-side).
The web grew and soon more varied sources of data emerged on the web.
For example, new data could come from a database and be too large to be shown in a single document.
In order to show this data to the user, the web server needed to first select and compose the page via a function.
To navigate to the function page of his choice, the user would "link" to the function as if it was a file on a server,
but then add query arguments as a suffix to that link.
PHP is a classic example of such function pages with links such as 
`http://www.example.com/db_viewer/page.php?search='socks'&results=40`.

   As files function pages are **unary**. The represent the entire view.
But, the function page is **externally open**, not externally closed as files.
Queries in the link are parsed into argument and sent to the function that use them to shape and fill the page.

   This openness makes the function page more dynamic, but within limits. 
The first limit is the cost. As going back and forth to the server is costly, thus changing the page is costly.
The second limit is complexity. As change is managed server-side, 
managing change relating to client-side needs to keep track of different sessions based on session identifiers,
often in an environment with limited support for session data. It is much harder to keep track of the state
of thousands of concurrent clients in a single server-side function-page than it is to keep track of a single state
in each client itself.
Both add a high cost to change thus reducing the dynamic abilities of the server-side function page.

3. **One stateful function page** (client-side).
As the abilities of JS gradually improved, the function page moved from apps running server-side
into SPA client-side.
The SPA client-side took with them the familiar concept of function pages, and implemented them in JS.

Client-side function pages differ from server-side function pages in that they live in the short term memory in the client.
This greatly reduces the cost per change, making it feasible to view the client-side function page
as much more dynamic than its server-side older sibling.
Client-side the developer can schedule page visits in seconds that previously would have been restricted to minutes.

This increase in dynamics, help us see the nature of a function page.
As the user interacts with an app during a session, pages gets filled with content that become *part of that page*.
We can think of a session between a user and a web app as a discussion.
Sure, sometimes the user wants the app to have the memory of a gold fish and 
ask the same stupid question whenever the user returns.
But often, the user expects the app to remember what "the user and app talked about earlier".
The user wants to switch between different pages and have each page remember its own and listen in on other 
pages state.

Client-side dynamics thus spotlight how **function pages are stateful**. 
They resemble objects that through their properties remember things that has happened.
Server-side function pages also has this ability, but 
it is much more costly and complex to obtain.
Pages resemble files, but they are dynamic and also contain per-session data about the 
"current, ongoing discussion between the user and the app".

4. **One of many components**
As a destination, all function pages and files share one important property: they are unary.
Each function page or file describe a complete destination. Typically, they capture the whole view.
When we navigate to a file or page, we end up in *one* place.
No stopping at the next gas station to buy some snacks and take a break.

Another way to look at the places the user visits in a web app is as a set of components.
This is more an **inside-out perspective**, the way the developer sees the app's locations.
Making a web app, the developer will compose each page as a composition of components.
Some components might be reused across pages, such as a menu or footer component.
So when the user navigates to a single page, the developer might see this as the user navigating to a group 
of components.

Here, the term component is used in a general sense. A component means anything from 
a function, class or object that has an internally or externally associated state.
A component can thus be implemented as for example:
1. a JS object with properties and methods to control the view,
2. a web component with an internal state, or
3. a reducer function (pure) combined with one or more properties in a global state.

In many ways, components resemble stateful function pages.
They are stateful, dynamic and externally open. But, components are not unary.
Users and developers likely desire to visit several component destination per journey.
Components are partial, they do not cover the entire view.
Components is more one of many locations in a journey than a destination itself.

In some instances, components might depend on each other. In other instances they might go side by side.

# References

 * [HTML spec on links](https://www.w3.org/TR/html4/struct/links.html)
 * [path-to-regexp](https://github.com/pillarjs/path-to-regexp)
 * [Article on routing](http://krasimirtsonev.com/blog/article/deep-dive-into-client-side-routing-navigo-pushstate-hash)
 * [Video on routing strategies](https://codecraft.tv/courses/angular/routing/routing-strategies/)
 * [Demo of pushstate and popstate](https://geeklaunch.net/pushstate-and-popstate/)