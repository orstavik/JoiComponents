## Pattern: GrabMouse

> You know I'm automatically attracted to beautiful—I just start kissing them. 
> It's like a magnet. Just kiss. I don't even wait. And when you're a star, they let you do it. 
> You can do anything. Grab 'em by the pussy. You can do anything.
> 
>   From ["Donald Trump *Access Hollywood* tape"](https://en.wikipedia.org/wiki/Donald_Trump_Access_Hollywood_tape)

Sometimes, in the midst of an EventSequence, it can seem as if the mouse has got a will of its own.
Its own behavior or default action that seem to come out of nowhere.
It doesn't happen all the time.
But near some elements, the mouse does something completely unexpected: it selects text. 

When you make an EventSequence, this behavior is often unwanted. You have a completely different agenda,
you are doing something else. So, what do you do? You GrabMouse.

## GrabMouse's defaultAction

To control the defaultAction of text selection by mouse, there is currently one main alternative:
CSS property [`user-select`](https://developer.mozilla.org/en-US/docs/Web/CSS/user-select).

You might have expected that this event would be controlled from JS via the [`.preventDefault()`]() 
of `mousedown` or `mousemove`, or from HTML as an attribute. But no. The default action of the mouse is
far harder to both read and understand than that.

First, there are no HTML attributes to control mouse events, you can only control it from HTML via 
adding the CSS property `user-select` to the `style` attribute.
                                            
Second, from JS you can control text selection via a separate event `select`. This event could be
understood as a composed event that should be preventable from its preceding `mousedown` and `mousemove` event,
but it isn't. The `select` event is unpreventable and will in the same way as `click` is dispatched 
regardless of any `.preventDefault()` calls on its preceding `mouseup` event.

This could spell trouble. If the `user-select` CSS property was read, captured, and locked *before* 
the `mousedown` event was dispatched. However, it is not. If you set the `user-select` property during
the trigger event function for `mousedown`, you will control the text selection behavior.

To control the actions of mouse events during an EventSequence, we therefore need to:
1. set `user-select: none` on the `<html>` element when the sequence starts (ie. on `mousedown`) and
2. restore the the `<html>` element's original `user-select` value when the sequence ends 
   (ie. on `mouseup` and/or `mouseout`, cf. the ListenUp pattern). 

However. `user-select` is an experimental technology and not supported by old IE.
And the `select` event is. To ensure maximum control, adding a secondary event trigger for the `selectstart`
event and calling `.preventDefault()` on this event will ensure that no text selection will occur 
during your mouse-oriented EventSequence.

## GrabMouse's getaways

Sometimes, when handling mouse events, the mouse will breakout from your control. 
When the mouse tries to getaway from your control, you should not attempt to stop it.
When that happens, you need to abort your current EventSequence and reset the situation.
But, you must detect when the mouse escapes you, so that you asap can politely excuse yourself and 
restore normality.

To illustrate how mouse events get away from your control in the midst of your EventSequence with it,
we will use two examples:
 * an `alert()` message is called in the midst of an EventSequence and 
 * the mouse pointer is moved out of bounds. / outside of the scope of the window object.

## Example: `grab-n-drag-mouse`

The `grab-n-drag-mouse` EventSequence:
1. grabs the mouse on `mousedown`,
2. detects `mousemove`s, and
3. ends on `mouseup`, while also
4. handling mouse accidents.

## References

 * 