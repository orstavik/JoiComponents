# Pattern: ScrollOutside

## What is `scroll-above`?

On touch based devices, "pull-to-refresh" is common UX app behavior. It goes like this:

1. Drag down with a single touch/finger when the app/document is *at its top position* (cf. `document.scrollTop = 0` inside a browser). It would be as if you tried to scroll upwards when you are already looking at the top of the page at the beginning. When this occurs its called a `scroll-above` event.

2. During the drag, a reload icon will gradually appear from above the window. The icon becomes fully colored/clear when activated. The icon is a visual feedback to the user that he/she is about to or will trigger a "pull-to-refresh" action.

3. The document/app will reload its content when you "let go" and release the drag in this activated state. To refresh the apps content is commonly the default behavior associated with the `scroll-above` event.

4. Scroll and pull-to-refresh behavior are exclusive: if a touch-drag gesture has triggered a pull-to-refresh, the same touch gesture cannot be altered to instead start scrolling, and vice versa.

 * On some touch devices, a darkened arc can also appear when you scroll *above* the document. However, the darkened arc occurs when you scroll above the document during a normal scroll, ie. within a touch-based drag gesture that has triggered a scroll action. The darkened arc is a visual que that the scroll to top is complete. 
 
## `scroll-outside`, extending `scroll-above`

One could easily imagine that the `scroll-above` event:
 
1. applies to all scrollable elements, not only the main document,
2. being implemented for mouse `wheel` scrolling and/or a mouse-based drag event,
2. functions at the bottom of/below the document, same as at the top of/above the document, and in fact
3. functions on all sides of a scrollable element: left, right, top, bottom, or even N, E, S, W, NE, SE, SW, and NW.

To extend the `scroll-above` event in this manner would constitute a generic `scroll-outside` event. As the `scroll-above` event and pull-to-refresh conventions are already established and proven viable, a generic `scroll-outside` seems plausible. Sure, a default action for different `scroll-outside` events would in many app contexts confuse the user and cause serious UX problems. As would implementing a new default action for most events. But, no-one said a `scroll-outside` event would require default actions, like pull-to-refresh. Nor that it would need to be utilized for all applications and situations. A `scroll-outside` event could be invoked when needed and suited. And when used, the `scroll-outside` event could enable up to 8 or more(!) actions on suited elements where only 1 action (refresh) on the main document is available today. 

Thus, a `scroll-outside` event can extend the room for user action:
 * without requiring neither extra screen real-estate, 
 * nor new finger gestures (still only a one-finger drag),
 * and staying in line with existing touch conventions.

## `scroll-outside` *require* visual feedback

The `scroll-outside` is an event that depends on visual feedback of its action: without the reload icon appearing from above the screen, and becoming colored/clear, the user would have a hard time knowing that he/she was about to reload the page.

## Implementation: `scroll-below` and `scroll-above` as composed events

Both `scroll-below` and `scroll-above` are composed events. And, they are tied to a state property of the element being scrolled: `.scrollTop`.

To complicate matters further, it is not possible to simply use the `scroll` event to detect the `scroll-below` and `scroll-above` events: no `scroll` events are dispatched when a user attempts to scroll on a scrollable element if it is already scrolled to the top or bottom position.

Thus, to detect when a `scroll-below` and `scroll-above` event occurs, the following sequence of events must occur. 

1. First, the element is at the top position if `scrollTop <= 0`; the element is at bottom position if `scrollTop >= scrollHeight - offsetHeight`.
2. Then, a scroll inducing event must occur, such as:
   * a `wheel` event going up when the element is at the top position, or down when the element is in bottom position.
   * a touch based drag going down when the element is at the top, or up when the element is at the bottom.
   * (a mouse based drag following the same logic as the touch based drag can be implemented if the developer desires.

## todo

make the reference implementation of this composed event.
The composed event must set up a register of elements that can actively listen for such events, and this register must keep track of elements that listen for touch drags and mouse drags and mouse wheels.

The composed event also will manage the `scroll` event and the check of the `scrollTop >= scrollHeight - offsetHeight` and `scrollTop <= 0` checks.

But, there is a problem with using the `scroll` event as an initiator.. It doesn't work on startup. And it doesn't work if the element height is mutated via js or otherwise, which will not trigger a `scroll` event.  

## References:

 *