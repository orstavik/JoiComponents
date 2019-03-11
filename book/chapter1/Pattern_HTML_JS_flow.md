# Pattern: HTML to JS flow

The sequence of the DOM resolution callbacks:

1. Individual dom node updates (ie. AttributeChangedCallback)
2. DomBranch updates (ie. SlottablesCallback)
3. Cssom rule attributions (ie. StyleChangedCallback)
4. Layout calculations (ie. LayoutChangedCallback)
5. Paint (no callback)

All these 5 faces of the DOM are in principle synchronic. 
But in practice, you don't calculate all every time, 
you allow js to respond in group/bulk after each step. This is more efficient. 
But. Changes per step is considered a new frame, making it run like this potentially :
1. 1n.
2. 2m, 1m*n
3. 3p, 2p*m, 1p*m*n.
4. 4r, 3r*p, 2r*p*m, 1r*p*m*n.

* So, be careful in 3 and 4.

## Flow in HTML vs flow in single state management?

The user or server or timer in the app triggers, and your app single state changes.
That triggers updates to the entire single state object first. All the computes are performed.
And all the observers are triggered.

This gives the following sequence:
0. User interaction, app timer, persistence layer trigger
1. single state reduce
2. single state compute
3. single state observe. -> trigger DOM update in some elements
4. Individual dom node updates (ie. AttributeChangedCallback)
5. DomBranch updates (ie. SlottablesCallback)
6. Cssom rule attributions (ie. StyleChangedCallback)
7. Layout calculations (ie. LayoutChangedCallback)
8. Paint (no callback, to screen only)

In this sequence you should try to avoid going back up the latter.
No DOM manipulation should for example trigger a single state reducer.
If it does, the frames will be very big. 
[6.] Changes to styles for example. Should try to avoid changing attributes and dom structure
*above* itself in the DOM. Each change at each level should be considered a new frame, and 
one should try to avoid stacking too high.

## implementation

for style. You need a per document check. Each element will register itself, but it will in essense
listen for an styleChanged event coming from the document.

This presupposes that the different --custom-css-properties gets registered in each document.
At each raf, the cycle will check if its statically checked custom properties are changed or not.
It is a StyleObserver, maybe?

In the implementation, there should be one loop running for both style and layout. 
So that if a layout changes a style, then that style will be updated also next.
But, this loop should probably only run in tree-order. So that style and layout are checked as one.

Or is it better if all registered styles are run completely first, then all layout?