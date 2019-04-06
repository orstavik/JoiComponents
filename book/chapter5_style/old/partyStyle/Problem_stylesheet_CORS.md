## Problem: Stylesheets are CORS blocked in Chrome

READ access for .cssRules for NON-CORS styleSheets is blocked.
This creates a problem for web components polyfilling CSS shadow parts spec.
Or building other "receiver-based" custom CSS rule initiative. 

By implementing such rules via CSS variables (custom properties), 
such rules can be made dynamic and flexible same way as normal CSS rules as the web component is moved around in the DOM.
This is very handy for polyfilling proposed CSS initiatives such as CSS shadow parts.
But, this is also very handy for setting up more custom rules and experimenting
in the wild with new syntax and concepts of style modularity and transposition.   

## Example: I can style you, but you can't read me

WebComponentA wants to let its users style it from CSS (not via JS or html attributes).
WebComponentA therefore sets up an API for which rules from the parent document(s) 
that will be transposed into the custom element.

These rules mirror precisely the CSS shadow parts specification.
But, the rules could be in ANY CSS format, or as comments inside the CSS description.

When WebComponentA is connected or adopted into a new document, 
then WebComponentA searches all its parent documents for CSS rules matching its API.
For every rule it finds, it makes a copy of that rule in a special style element 
dynamically created for this purpose.
These new rules set the values for CSS variables / custom properties that are unique enough not to be overwritten.

Inside WebComponentA, the same CSS variables are used to receive the altering style.
This works using the original selector on the host node.

But. When the webcomponent reads its parentdocument.stylesheet.cssRules, 
the cssRules are prohibited from reading from other CORS sites.
This creates a problem when you are **reusing** a web component built by someone else from a different source,
such as a CDN.
To counter such a problem, the user document must make also import the same resource that 
WebComponentA is using and manually register its stylesheets with that resource.
```html
<link href="https://app.server.com/myStyle_with_CSS_shadow_parts.css" rel="stylesheet"/>
<web-component-a><web-component-a>
<script type="module">
import {WebComponentA} from "https://cdnB.org/WebComponentA.js";			//WebComponentA imports PartyStyleMixin.js
customElements.define("web-component-a", WebComponentA);
//WebComponentA tries to transfer the styles from app.server.com/myStyle_with_CSS_shadow_parts.css,
//but is rejected read access due to CORS.  

//in order for the style from app.server.com/myStyle_with_CSS_shadow_parts.css to be converted to CSS variables,
//the parent document must also import PartyStyleMixin.js
import {parsePartyStyleDocument} from "https://app.server.com/PartyStyleMixin.js";
parsePartyStyleDocument(this.getRootNode());           
</script>
```
This will result in two `PartyStyleMixin.js` modules being loaded.

## Workaround
Limit the style to only be allowed in regular style tags. 
As these are not CORS restricted when PartyStyleMixin.js is loaded from the same source.
 
The 

an additional call 

 not-yet standard nor browser supported API for attributing styles from CSS rules that applies to the host node.
Lets call this API CSS shadowy parts.
Which looks exactly like the CSS shadow parts proposed definition.
Very nice.

To implement this API, WebComponentA is loading a polyfill mixin similar to that of part-theme.js of Polymer labs.
Whenever this mixin is put into a document or shadowDocument, it will go into the parent document, 
search its rules, when it finds rules that fits the API CSS shadowy parts, 
it will make a copy of these rules, place it in another style set up for this purpose, and copy in the rules. 
But in the copy, instead of assigning properties, it assigns CSS variables instead.
Then inside WebComponentA, the WebComponentA sets up a series of    
 
Therefore, it wants to polyfill CSS shadow parts.
WebComponentA is published from cdnA.org.

WebComponentA is used in AppB.
AppB  


It basically says that it is exposing ::parts(my-input) so that users of the style can _in their CSS stylesheets_
style WebComponentA.
WebComponentA is 
But, to implement 
To impole
It is 

Or a similar style-protocol that enables other developers to establish style protocols
