# Pattern: requestStyleFrame

## implemented as a sub-sequence of rAF, or using setTimeout
no raf is best.

only runs the methods added.

if it is active, then it can:
 1. run "contained alterations internally"
 2. select between running above or beside alterations in the next rAF or throw an error run-time

it needs a production mode and a debug mode. The debug mode has one or more of the following 
properties check and will throw an Error.
Both DOM changes and CSS changes can alter the CSSOM, above the . This means that 
 
 1. check if new `requestCssomFrame` or `cancelCssomFrame` are added when its active. 
    Contained alterations are ok, non-contained alterations are not ok.
 4. check if the current element alters any and all of its attributes and attribute values.
    including class list, style attribute, id attribute.
    any change of attribute might affect styles being active on that processed element.
    This should also be performed on a) all previously processed elements and b) all parents of 
    all previously processed elements as this might affect their style.
 5. check if the siblings or parents of the element is altered, as that might affect
    which css rules are applied to the current element. 
    `nth-child` and `nth-last-child` are examples of sideways DOM mutations that affect the CSS.
 6. check if the content of a style element in the current document changes, 
    as that obviously can alter the css value of the current or previously processed element.
 7. All of these checks can be handled with ONE other check: checking if getComputedStyle
    is not altered for any previously processed element in the list. 
    If no previously executed style has changed, then you can assume that your TreeOrder is safe 
    enough.

## The `requestCssomFrame(el, propName, callback)`

Make a que that sorts all callbacks based on their elements position in the DOM. Make sure that
the callbacks don't violate certain rules/limitations of DOM mutations, and throw errors.
The que can be altered during the execution of an event (callbacks added), and 
the que can be shuffled during the execution of an event (elements moved up, down, sideways in the DOM).
The only allowed alterations are downward alterations.
If siblings of the host element are changed, that might cause changes to the CSSOM due to rules such 
as `nth-child` and `nth-last-child` for sideways siblings adding and removal.

changes within an element cannot alter the CSSOM as there is no parent selector
https://stackoverflow.com/questions/1014861/is-there-a-css-parent-selector

changes of the host element class list and attributes can cause changes to its CSSOM, 
which we need to check. Therefore, in addition to checking the head and tail of the que as a whole,
we need to also check that no attributes nor the css classlist has changed on the current processed 
element. 

All these checks should be able to turn off during production once you are certain your code has no 
side-effects.

Although DOM and CSS changes within an element dirties the CSSOM, requiring a new update,
as there are no selectors (except the :host selector that i conveniently overlook for now.. argh..)
that can alter the CSSOM of an element.
Changes within they are likely to cause the least 
efficiency problems in processing the CSSOM. They are therefore the only acceptable changes 
that will not trigger loops.

If the callback has no side-effect (upward, leftward, rightward) DOM mutations from the point of 
view of the host element, then no styles should be altered during the CSSOM and it will be efficient.
This could be tested that if the head up to the current element is in the same order, and 
the tail is in the same order, then anything modified since last time is "within and underneath the 
current element".

## References
 * 