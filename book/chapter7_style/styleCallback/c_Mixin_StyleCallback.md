# Mixin: StyleCallback

Basically, the StyleCallback pattern is the NaiveStyleCallback pattern using the 
TreeOrderedCssomTraversal pattern.
The StyleCallback pattern observes a select set of actual CSS properties on a select 
og elements in the DOM. Once per frame, scheduled using a `requestAnimationFrame(...)` task, 
the StyleCallback traverses all of these DOM elements, checks each element's observed CSS
properties and then calls `styleCallback(cssPropertyName, oldValue, newValue)` if that CSS
property value has changed.

The StyleCallback follows the 4 requirements specified in HowTo: TraverseTheCssom:

1. Implementations of the `styleCallback(...)` should only alter the shadowDOM and other inner 
   state in their web component. The `styleCallback(...)` should *not* cause any events to be 
   dispatched outside its shadowDOM, *not* alter, add or remove any HTML attributes on the host
   element, and *not* alter the global state or local/network sources.
   
2. If a first element's `styleCallback(...)` alters the shadowDOM in a way that adds or removes 
   a `styleCallback(...)` task for a second element that is contained within the first element in 
   the DOM, then this change will be reflected in the ongoing batch of `styleCallback(...)` processing.
   
3. If a currently processed element's `styleCallback(...)` alters the CSSOM in a way that it changes 
   the observed CSS properties of other elements that has already been processed in the current 
   `styleCallback(...)` processing cycle, including the currently processed element itself, then this 
   will throw a CyclicalStyleCallbackError. 
   Testing for CyclicalStyleCallbackError can be turned off in production to increase speed.
   
## something


## Conclusion

A fully functioning `styleCallback(..)` that adhere to the requirements in HowTo: TraverseTheCssom 
is possible. It is safe and efficient enough. It will simplify several operations that now add 
complexity to apps and web components, while at the same time add its own practical problems, errors 
and edge-cases. But, `styleCallback(..)` is most relevant in that it adds and reduces the conceptual 
complexity of web components and HTML+CSS+JS programming.

On the side, the `styleCallback(..)` reduces complexity by giving the developer all the tools
needed to make custom CSS property values. The `styleCallback(..)` gives the ability to implement true,
full custom CSS properties (CSS variables only implement custom CSS property *names*, not custom CSS
property *values*). Custom CSS property values is the last missing component 
needed to implement a web component version of native HTML/CSS constructs such as `<table>`. 
Conceptually and practically, this is of great importance.

On the other side, `styleCallback(..)` gives the developer a method to *react to* style changes. 
Now, theoretically, both CSS and CSSOM has always been dynamic. CSS styles can be changed dynamically
as a part of the DOM. But, in practice, since there has been no direct method to observe CSSOM changes, 
CSSOM observation and reaction has been practically very limited.

My own opinion is that `styleCallback(..)` sheds light on the future of HTML and CSS. With a 
`styleCallback(..)`, `<table>` can finally be implemented using only web components technology.
This means that *many* core, first class HTML elements such as `<table><tr><td><caption><dl><dd><dt>can be taken out of the HTML spec proper and 
remade as second class HTML citizen elements: web components.,
custom CSS properties *and* custom CSS values. From my perspective, `styleCallback(..)` is the only
missing piece in that puzzle. And, if then obscure HTML elements can be converted into web components, 
then a) HTML elements, b) custom CSS properties, and c) custom CSS values/types can be moved out of the
HTML and CSS core. For good. This will substantially reduce the semantic diversity of *both* HTML 
and CSS. Furthermore, as developers for the first time will have the full means to implement elements
akin to `<table>`, maybe the dream of wide spread, reusable web components could finally come true. 
I believe that custom CSS property values as an alternative to controlling the style of web components 
using HTML attributes is the last mayor obstacle for the web component dream.

## References

 * 


6. Problem: Observe CSSOM changes and getComputedStyle
7. Problems that require TreeOrder iteration on mutable DOM
8. Pattern: StyleCallback using TreeOrder iteration on mutable DOM and observing CSSOM changes



