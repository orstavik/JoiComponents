# HowTo: compose with Events and HTML

## HowTo: direct HTML from DOM Events

How DOM Events direct HTML is handled as "tacit knowing". 
Different HTML elements will react in different ways to certain mouse and keypress events; 
this behavior is described in the spec; and that's literally it.
The developer "just knows how it works", and it is not explicitly written anywhere in the HTML template. 

However, not all is hidden. The `<a>` link element has its `href` attribute whose whole function is to give
data and meaning to link `click`s. Although not fully described, traces and hints of the HTML elements
reactive pattern to DOM Events are frequently visible in HTML attributes.
Further still, many HTML elements (cf. `<select>`) are joined in a relationship with other elements
(cf. `<option>`) and their properties (cf. `selected` and `multiple`). 
Between them, such codependent HTML elements and attributes describe quite extensively how the 
HTML elements will react to native DOM Events without any interference from JS nor CSS.

When making custom HTML elements, ie. web components, an important task is to describe the new HTML
element's builtin reactions to DOM Events. The guidelines for doing so largely overlap with the guidelines
for handling DOM Events in general.

1. Avoid DOM Event mutation: Avoid altering their data and stopping their propagation.

   Exception: You can likely call `preventDefault` on elements in the web components shadowDOM
   without causing confusion.

2. Spawn new DOM Events from within the web component using the AfterthoughtEvent pattern. 
   Let trigger events complete their propagation before your custom composed event.
   
3. Alter your shadowDOM and its shadowCSSOM in response to the DOM Event; 
   do not alter the lightDOM of your custom element in response to a DOM Event.
   
   Exception: You can alter the HTML attributes of lightDOM elements in 
   HelicopterParentChild relationships such as `selected` in the `<select><option>` pair.

## HowTo: direct DOM Events from HTML 

We have two means to direct DOM Events from HTML:

* HTML attributes. HTML attributes would be considered normal and familiar way to direct DOM Events 
  from HTML.

* HTML elements. HTML elements are *only* used natively to create and direct browse `click` and `submit`
  DOM Events. With regards to browsing only, this is a familiar pattern. But, with regards to other
  events, this approach will quickly feel strange and archaic.

## HowTo: direct DOM Events from HTML attributes
   
HTML attributes is the most common way to direct DOM Events. 
Examples here include `autofocus`, `draggable`, `download`, `href`, and many more.

Mostly, HTML attributes *direct* DOM Events already triggered somewhere else.
`download`, `href`, `rel`, `method`, `action` are names of HTML attributes that give data and direction
for browsing DOM Events such as `click` and `submit`.
But navigation is not the only event that can be guided by HTML attributes.
`autofocus` directs the `focus` event to target a particular `<form>` input element to put the cursor 
there when the page loads. In fact, most HTML attributes have some influence on the interpretation
of DOM Events default behavior.

HTML attributes can also *create* DOM Events. There are not that many examples of such HTML attributes
that create native events, but there is one: `draggable="true"`.

```html
<div draggable="true">drag me</div>
<div>can't drag me</div>

<script>
window.addEventListener("dragstart", e=> {console.log(e.type);});
window.addEventListener("drag", e=> {console.log(e.type);});
</script>
```

When `draggable="true"` is added to the `<div id="a">`, new native, composed DOM Events 
such as `dragstart` and `drag` will be dispatched.

Still, `draggable` is not very popular. The main reason I don't like the draggable pattern 
is that it is difficult to control the visuals of the drag, not the control of the drag DOM Events 
themselves.
The pattern of creating drag DOM Events with an attribute is a good pattern.

## HowTo: direct DOM Events from HTML elements

In the early beginning of HTML, another approach was used to create and direct DOM Events: `<a href="...">`.
Events from HTML, via HTML elements whose sole function is to either create an event via altering the 
behavior of the `click` DOM Event.
`<a href="...">` has locked itself deep in our web platform and collective psyche.
It represent both something deeply familiar and unfamiliar at the same time, an archaic linguistic
structure.

`<form action="...">` also create and shape DOM browsing events. So, `<a href="...">` is not completely alone.  
`<form action="...">` is however a bit tidier, as it actually *create* a DOM Event, not just mutating the
existing `click` event. As DOM Event creation and directing goes, `<form>`-create-`submit` is much 
prettier than `<a>`-mutate-`click`.

`<base>` is a third DOM element, whose sole function is to mutate the interpretation of the browse DOM Events.

Finally, `<input>`, `<button>`, `<select>`, and `<option>` also help populate `<form>` browse events. 
These elements also fulfill an important visual and structural function in a web page, but 
in addition to this view and content behavior, they also populate the data of the `submit` DOM Events.

However, HTML elements mainly direct *one* DOM Event type: browsing. Few other DOM Events are added 
to the web app via HTML elements in this way.                                          
Therefore, while we see `<a>`, `<form>` and `<base>` as familiar, it is likely that we would consider
other possible event creating elements for obtrusive and wrong. For example, imagine that you 
instead of adding `draggable` attribute to a `<div>`, instead wrapped it in a `<draggable>` element.
The drag events being added via the separate `<draggable>` element, 
as the browse events are added with `<a>` and `<form>` elements.
There is not technical barrier for such a `<draggable>` element. Technically, this is quite simple.
But, stylistically it would "look wrong". It would "needlessly" deepen the DOM hierarchy. It would
fill the DOM with non-DOM type of units (HTML elements are things, not actions, except for links of course).

For global events I recommend using HTML attributes over HTML elements to both create and direct them.
It is a reason why the `<a href>` pattern didn't catch on. It is because the DOM elements should depict
"things" and not "actions". It is because the DOM deepens too much, especially conceptually, but also 
stylistically in white-space, if it *does* contain "actions" in addition to "things".
So, to create and direct global DOM Events, use HTML attributes.

However, there are still valid and useful roles for composing DOM Events using HTML elements.
And to understand which roles HTML elements can play, where, when and how they can play these roles, and 
why, we need to look more closely at the different compositional patterns HTML elements creating and 
directing DOM Events can conform to.

## Four patterns for composing DOM Events with HTML elements

HTML elements can compose DOM Events following four patterns:

1. EventComposer (`<a href="...">`). When added to the DOM, this element will make something happen.
   It will dispatch a DOM Event or at least append an existing DOM Event with a defaultAction, 
   the DOM Events ugly cousin. The EventComposer element *depicts no thing, only one action*.
   And the EventComposer pattern is restricted to only compose events from other events. 
   
   The EventComposer pattern is familiar, but archaic. It is used with `<a href="...">`s,
   but I recommend against using this pattern for all other events.
   I consider it out of style for use in web components.
   
2. EventCreator (`load` DOM Event from the `<img>` element).
   HTML elements can dispatch atomic events, DOM Events triggered by native events or JS callbacks.
   
   The atomic event reflect a state change in the web component itself, they are *not* a direct 
   reaction of another DOM Event. One example of an HTML element that use the EventCreator pattern in
   this way is the `<input>` element. When in focus and the user creates a `keypress` event, this
   element will also dispatch a `change` event. However, this `change` should be considered indirectly
   triggered by the preceding `keypress`; the `keypress` alters the `value` of the `<input>` (the 
   element's state), and then this state change triggers the atomic `change` event. This is made 
   more clearly evident in that other changes of the `<input>` element's `value` attribute triggered
   by calling `setAttribute("value", "somethingelse")` will also make the `<input>` element dispatch
   a `change` atomic event.
   
   The EventCreator pattern is both familiar and still-in-fashion. 
   I recommend using it when making web components. Make sure that it is a state change of the web 
   component that directly triggers the DOM Event and not another DOM Event.
   
3. EventHelper (`<base>`). 
   The `<base>` element's purpose is to *alter* or *mutate* the interpretation of an already created 
   browse events from `<a>` and `<form>`.
   The EventHelper element can be positioned anywhere in the DOM, regardless of the propagation path of
   the DOM Event it "helps". The EventHelper "helps" the interpretation of the associated DOM Event 
   via HTML attributes that specify some property used to interpret the DOM Event.
   
   The EventHelper is an anti-pattern because it breaks the normal scope of DOM Events and their 
   interpretation.
   Looking at a DOM Event, you don't anticipate that there might be some other element somewhere else in 
   the DOM that might influence its function.
   Normally, all the data necessary should be contained in:
    * the DOM Event itself, 
    * its details, 
    * its target's attributes, and/or 
    * the attributes of elements in its propagation chain.
    
   The `<base>` element is a lone exception to this DOM Event scope. 
   Looking strictly at the data listed above, you cannot see where the baseURI is set.
   Furthermore, several competing `<base>` elements can be added, and thus an arbitrary rule
   specify that only the first `<base>` element with said attribute will be active.
   
   The `<base>` element has been cemented in our collective web programming consciousness.
   "We know how it works". And so, for this single archaic practice we can and do use it.
   But, the EventHelper pattern does not scale. Imagine the chaos and breach of DOM hierarchy
   is several different DOM Events were "helped" in this way by several different HelperElements,
   elements that could use different algorithms to decipher which one of several competing HelperElements
   were to be the active one for its particular DOM Event. Were it not for the tag-and-tab-syntax of XML
   (`<...>` with indentation), the DOM would no longer be the DOM we know and love.
   
   I therefore recommend *against* using any form of EventHelper. Do not make elements who essentially
   provide an attribute that influence the interpretation of DOM Events that are not part of its propagation
   chain. 
   I would also recommend *against* using EventHelper elements that influence the *interpretation* of
   events that propagate outside of its target. The exception I would make for this rule is the
   global `<body>` element, and elements that will dispatch a new composed event based on a trigger event:
   EventDirector (described below as part of the EventOrchestra).
   
4. EventOrchestra (`<form>`, `<input>`, `<button>`, `<select>`, and `<option>`). 
   The EventOrchestra pattern is a group of elements that come together to orchestrate DOM Events. 
   The EventOrchestra consists of different members playing different roles:
   1. The EventDirector (`<form>`) is triggered by a DOM Event coming from an OrchestraMember (`<button>`).
   2. OrchestraMembers can play different roles: some might provide DOM Events (cf. `<button>`), 
      some might provide DOM Event detail (cf. `<input>`, `<select>`, and `<option>`), and 
      some might provide both.
   3. When a DOM Event (in the lightDOM where the EventOrchestra is presented) sets off the 
      EventDirector, the EventDirector use JS functions to extrapolate all the event data needed
      from all its OrchestraMembers (this should be done as on-demand getter functions so as to avoid
      unnecessary processing during the dispatch of the composed DOM Event.)
    
   The EventOrchestra operates on *two* levels of the DOM, on top *a single* EventDirector, and 
   below him a group of OrchestraMembers that from the EventDirectors point of view are the leaf nodes.
   However, like in a `<form>`, the `<input>` and `<button>`s must not be direct children of the 
   EventDirector. You can wrap them in other elements. 
   
   To avoid complete chaos here of EventOrchestras overlapping other EventOrchestras, in two or three 
   interwoven layers, the HTML spec specifies that "interactive elements" should
   not be wrapped around OrchestraMembers between it and its EventDirector. In other words,
   you can put an EventDirector and its members *inside* an OrchestraMember of another EventOrchestra
   (like a full `<table>` inside a `<td>` of a wrapper `<table>`), but you should not interweave
   two EventOrchestras (which would look something like `<table><form><td><input>` or  
   `<form><a href=""><select>`).
   
   In itself, the EventOrchestra pattern is far more complex than the previous three HtmlToEventComposition 
   patterns. This is in itself a drawback. But, the EventOrchestra pattern is also far more powerful. 
   Web page *genres* (genres: defined as recurrent, rhetorical interaction patterns) can be captured 
   with such compositions. This pattern is therefore suitable to describe *and reuse* the architecture 
   of whole web apps, the high-level components of such apps.
   I therefore recommend using the EventOrchestra pattern in your app.
   But be very diligent to *not* interweave (read: complect) them. You can put another EventOrchestra
   *inside* another OrchestraMember, but *do not* place another EventDirector *in between* the 
   EventDirector and OrchestraMember of another EventOrchestra.
   
### Summary guidelines
   
At this point you likely feel less, and not more, comfortable about directing DOM Events from HTML.
However, I will try to summarize some clearer guidelines from the above:

1. The default way to direct DOM Events from HTML is as HTML attributes on the DOM Event target
   or on the `<body>` element.

2. The EventCreator pattern is good. Make sure the atomic events reflect state changes and that they can
   and do get triggered not only by other DOM Events.
   
3. Avoid the EventComposer and EventHelper patterns.
   If you need another global event, use EventToEventComposition and then direct them via HTML attributes.
   If you really need to create a local DOM Event, you are feeling the need for the EventOrchestra pattern,
   not only the need for an EventComposer.

4. The EventOrchestra pattern is not as so much about structuring DOM Events as it is about structuring
   *everything* (ie. the whole app or big chunks of it). Sure, it directs DOM Events,
   but it *also* structures your HTML content, core aspects of the view, provide focal points for
   reactive JS functions *and* create and direct DOM Events, together. EventOrchestra defines genres, 
   not only DOM Events.
   
## References

 * 

## Old drafts

I don't know the reason why `<base>` was designed in this way, but I speculate that it has to do with
pages being generated by server-side scripts where the developer needed to specify the base for 
interpretation of links while not having already written and sent the `<body>` element to the client.
To avoid confusion, one did not want to add a "base-uri" attribute on all elements, thus having to decide 
which such property would win if several different "base-uri" attributes were available in the
target chain. However, several different `<base>` elements could still be added spread around in 
the document, and to guess that the first, top one of these 
elements should be the active one, is confusing (it could have been either the nearest in the target 
chain or the last specified as well). Furthermore, the `href` and `target` attributes
of `<base>` can be described in different `<base>` elements, adding to the confusion.

In any case, the `<base>` and EventHelper pattern does not scale well. Imagine having many such elements,
each describing a different property of different events, elements that can affect events even though
they are situated outside of the events' scope. It would be chaos. It breaks the concepts of the DOM 
Event propagation chain and event's basic scope of interpretation. 
It breaks with the concept of the DOM hierarchy itself. It is an anti-pattern.

                                                                      
## Old draft: Why HTML?

HTML attributes is the primary means to specify behavior of elements in both HTML and JS.
Being readable and writable from both JS and HTML has several benefits:

1. You can compose behavior and reactions in your web app not only from JS scripts, 
   but also from HTML template. Being declerative, HTML template provides a static clarity the 
   imperative JS scripts do not provide.

2. If behavior is controlled and specified by different means in HTML and JS, this leads to conflicts,
   race conditions, and confusion. If a certain property or behavior is specified in your HTML template 
   and then the underlying property or behavior is overwritten from JS, then looking at your HTML 
   template while chasing a bug might be directly misleading.
   
3. As a single point HTML attributes will always be up-to-date. If you instead for example specify 
   aspects of your elements or events behavior as an object property on an HTML element or somewhere else,
   then you would have to marshall or otherwise translate that property from/into the DOM if you want the
   same property controllable/readable in the DOM. For anything that reasonably can be kept as string value
   (ie. not terribly long or that require object or array like structuring), such a move will add
   unnecessary complexity to your app. 
   
   In my opinion, many web frameworks do this mistakenly. The cost of marshalling is not outweighed by the
   ease of use from the JS vantage point alone. It obfuscates the relationship between the scripts and 
   the DOM, inevitably leading to longer learning periods in sum, fragile systems and misconceptions.
   

from both the HTML template and your JS scripts. By controlling your composed events via attributes, 
you thereby make their behavior accessible both via template and script. This is in itself very beneficial,
especially for composed events, but also helps avoid managing conflicting states between script and dom states.
