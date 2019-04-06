# Problem: The SpaProblem

## Problem: Relative locations has IDE support

`/` and folder convention is part of the URI convention.
"/path/resource.type" in URLs mirror "folder/file.name" in the filesystem of desktop computers.
This enables developer IDE to support automatic refactoring of normal and relative path-based links.
There is little to none such support for `#`-based links.

Having no design-time support for matching links with resources is a big issue.
Without design-time support a project might quickly develop link-to-resource gangrene. 
As IDE tools no longer rename links and resources in tandem, 
developers might quickly either:
 * give up and let broken links flourish, or
 * freeze up and let the fear of broken links hamper development.

## The SpaProblem

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
   
## MPA next

But, everybody is adding routers to their page. Complex routers. 
So, what can other types of links accomplish that #-tags cannot?

## References

 * 
 
## Old

1. Systems relying on both the path and the #-tag of URLs will likely need to implement a parser
like [path-to-regex](https://github.com/pillarjs/path-to-regexp) on the client.
But, system relying on #-tag will also need to implement relative linking in some instances where
regular path-based navigation do not.

 