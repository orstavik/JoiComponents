# Intro: Router

There are 3 tasks that a router in an web app usually can get involved in:
1. Parse the given route into a dataobject.
2. Convert this data object into a different form, such as "exploding" a shortcut.
3. link the route data object with one or more specific actionable functions and pass it some parts of
   the route object as arguments.
   
A problem in 1 is to find a familiar, non-disturbing format in the link.
A second problem in 1 is to manage this format on both the client and the server.

The problem in 2 is to find avoid complexity, while at the same time enable efficient routes to be created.
You want your routes to be readable both from the system/developer side and the user side, and
these needs might be different.

The problem in 3 is that this "routing task" conflicts with the state manager. 
Or app controller.