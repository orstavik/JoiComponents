# Pattern: ScrollMaster

To `scroll` is a main form of UX in a web page. It is (almost always) ever present. It can be addictive (as in infinite scrolling). It is up there with `click`, fighting for UX supremacy. 

The main document in a web page supports scrolling by default when needed. Scrolling is also added by default to `<iframe>`s. Using CSS, scrolling can also be added to other elements such as a `<div>`. By adding `overflow: scroll` to block-level/`display: block` elements, many elements can be made scrollable on the same page.

## Analogue vs discrete scroll behavior

This *normal* form of scrolling is **analogue**. When you drag your finger up or down a web page on a mobile, touch-enabled device, you scroll up or down as many pixels as your finger moves, in the tempo your finger moves. If you swipe, a similar analogue algorithm calculates the speed and duration for which the scroll continues. PageUp and PageDown keys and (most) wheels on mice on laptops also simulate such an analogue motions.
 
But, the native web platform also implement other scroll behavior. Behavior that is not analogue, but digital and **discrete**. For example, you can use the arrows to flip/scroll between `<option>`s in a singular `<select>`. Thus, what it means to for example `wheel`, `drag`, `swipe`, and `PageDown` on a layout element is not fixed: the meaning of a UX gesture by the user can change depending on the layout concept that layout element espouses.

Native support for analogue scrolling is wide and deep. Native support for discrete scrolling less so. But, this should not make you think discrete scrolling is any less "natural" than analogue scrolling. On the contrary, discrete scrolling is used in *many* apps via mechanisms such as swiping and *feels* quite natural to the user. Think about carousels. Think about the swipe left for next page or person. Thus, when making custom layout web components, my advice is to look for and support discrete scrolling.

## Which events, gestures and UX actions trigger scroll?

**Start trigger events** activate analogue or discrete scroll behavior of a web component. `focus`, `mouseover`, and/or `click` can all function in such a way. Some initial trigger events have a corresponding **end trigger event**, such as `blur` (ends a `focus` session) and `mouseout` (ends a mouse hover session). Other events such as `click` does not have similar end trigger event, and thus usually require a custom, scroll-dependent signal for it to end.

## Events that scroll

There are many different (combinations of) events that can trigger a scroll action for a layout web component:

 * The `wheel` can scroll and dragging a finger horizontally or vertically can move a web page.
 * If you open a map, two finger drag will *pan* the map; the single finger drag is preserved to not interfere with the UX of the main document (ie. the global scroll behavior). 
 * If you activate a `<select>` element with several options, `ArrowUp` and `ArrowDown` will trigger a discrete scroll between options. If the focus is on the main document, keys such as `PageDown`, `Space`, and `ArrowDown` scroll down.

Some web applications alters the direction of scrolling: instead of the wheel controlling  scroll top/down, the wheel will scroll left to to right. It is not far fetched to imagine that if the user hovers over a `<select>`, then the `wheel` would scroll between options.

There are conventions that govern analogue and discrete scrolling. They are many, but not necessarily that far apart. However, they are not written in stone. You can develop them slightly and add to them. The metaphors we live by in the web anno 2019 is for example:

 * drag up scrolls down.
 * wheel moves top/down, alternatively left/right, alternatively zoom out/in.
 * space is next
 * discretely: arrows down/right means next, left/up means previously.
 * discretely: page down/end means multiples next, page up/home means multiples previous.
 * analogically: arrows moves a little left/up/right/down, page down/up moves almost the full dimensions of the frame that is scrolled, and home/end moves all the way to the top/left or bottom/right edge, alternatively to the original position.
 * scrolling with multiple fingers is a way to enable scrolling for several elements in the same area. The more finger, the lower in the DOM/the more precise the scroll.

## Implementation

Scrolling events are sometimes native, sometimes composed events. If they are composed events, they are activated on a web component type basis. 

The web component should not listen for scroll events all the time. Listening for the scroll event should either be activated using the NativeFocus pattern, the OnHover pattern, or similar. 

Once a scroll event is captured by a web component, that almost always should block event propagation and the event's default behavior (`e.stopPropagation()` and `e.preventDefault()`).

Sometimes, the layout web component structures the app globally. In such circumstances, the event might need to always listen for global scroll events. An attribute `active` can be used to state and enact that an element should always be activated.

## `scroll-below` and `scroll-above`

In many instances, you want a layout web component's scroll behavior to be secondary to the normal scroll behavior. The slotted content of the HelicopterChild is to be considered scrollable in a normal sense, and then only when there user tries to scroll down or up when the element is already fully scrolled, then does the HelicopterParent receive a scroll event. 

In such instances, you want two custom, composed `scroll-above` and `scroll-below` events. The `scroll-above` and `scroll-below` events are triggered when a scroll event tries to move beyond the bounds of the scrollable document, either above or below it. 



## References:

 *