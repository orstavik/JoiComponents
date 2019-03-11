## Pattern that describes a simple Frame element.

It does nothing to the slotted elements except to place them in:
 * A special part of the frame,
 * or in the middle or background.

The FrameElement takes a part of the view, it can be like:

 * a border, like a donut or picture frame. 
 * only an area on one of the sides
 * or an area fixed above the other elements, 
   like a bottom-right action-button or a band crossing 
   the top of the visual area 5 cm from the top.
   
The FrameElement can have special behavior such as having the frame appear when dragging 
down on the screen, or 
reducing a shadow and slightly moving a button.

The FrameElement is in direct competition with normal CSS. 
But, it just adds the ability to do lots of :hover, :drag-down, :click and stuff.