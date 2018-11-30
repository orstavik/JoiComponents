# Proposal: `slashchange`

## Purpose 

The `slashchange` event enables MPA routing that use the segments in the URI.
 
## The `slashchange` event is controlled by the <base> element

When a 'slashchange' attribute is added to the currently active <base> element,
navigation "within the base URI" does not trigger a reload of the page, but
instead trigger a "slashchange" event on the window.
```html
<base href="/a/location/to/somewhere" slashchange />
```

The slashchange event detail contains the `{base, link}`. 
The link is the "link relative to the base".
To get the complete link, you only need to add `base` + `link`.
This complete link would have been what the browser would have navigated to.
the complete link can also be relative, as the base can be relative.

## Current solution

As `slashchange` does not exist, the following solution can be used instead.

```html
<script src="slashchange.js"></script>
<base href="/something/thatShouldEndWith/Slash/" onload="addSlashchangeEvent()" />
```

The current solution is implemented by using the pattern "highjacking 

As the current solution needs to alter 

WithinBaseLinks are any link that occur within the base.href, ie. starts with the base.href.
The slashchange event should never occur independent of the <base> element with the href.

of the
These two lines will highjack any clicks that is within the base ().

