# Event: DragFling

* EarlyBird, CallShotgun
* ReplaceDefaultAction (not PriorEvent nor AfterthoughtEvent)
* FilterByAttribute                                                                         
* EventSequence
* EventAttribute
* TakeNote
* ListenUp
* GrabTarget
* GrabMouse / GrabTouch, for the mouse and touch version respectively.

We make one for touch and one for mouse, as they have noe listeners that overlap.
The only thing to save by having them as one, is lines of code for for example the ReplaceDefaultAction
and FilterByAttribute patterns.

## What is the dragFling Event

tomax short description of what and how the drag and fling events work.

## dragFling attributes

 * `draggable`: will trigger
    * `dragging-start`
    * dragging-move
    * dragging-end
    * dragging-cancel: 
      1. on the mouse leaving the window 
      2. the window loosing focus as a consequence of for example alert being called.
      3. tomax
 * draggable-mouseout
 * draggable-distance
 * draggable-duration
 * fling: will trigger the fling event

## Code

```javascript

//[1] mark each use of the patterns only,
//[2] mark the description of what the dragFling event does if it works out ok.

```

1. comment
2. comment

## Example 1: Slider

```html

```

## Example 2: Shuffleboard game

```html

```

## References

 * 