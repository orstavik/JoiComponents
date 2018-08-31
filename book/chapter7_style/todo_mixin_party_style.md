# Make a mixin for ::part style (PartyStyle)

Use the coming css standard for ::part first (and then later ::theme).

essentially creates a polyfill by doubling the ::part and ::theme styles if they are not available
using css variables.

creating a parallell bridge with css variables housed in style party-style elements 
on both sender/receiver side.
The mixin should be turned off if the browser supports ::part and ::theme.


## On the declaration style side, the lightDOM scope,

The mixin creates a global registry of all documents (parent documents of the receiver).
documents are given an id, if they don't already have one, that will be used in their ::part rules.

It will then search these documents for `<style part-theme>`, style elements with the party attribute.
   * The contents of these style elements will be observed for changes.
   * First time, and with every change of content, the style element will be parsed to find
     rules that contains ::part() or ::theme()
   * If there is a changed or new ::part() or ::theme() rule, it's contents will be converted into a
     css variable that contain both the ::part() and the ::theme() descriptor and css property name.
     These new rules will be stored in a new style `<style party-style>` tag added to the head of 
     the document.

### What triggers 1?

 * the connectedCallback of elements with the Mixin. They will run recursively up the document parent chain.
 * a custom function. 

     
## On the receiver side, the shadowDOM scope.

Every time the shadowDOM changes, 
the mixin will search the shadowDOM to find elements with the `part` attribute.

the mixin will then make two rules, part and theme:
1. the CSS selector to these elements are [part="partname"], 
2. find the id of the parent document,
3. make CSS variables for that part id [--document_docid_part_partname_css_property],
4. make CSS rules for those selectors for part, either make them for ALL properties (bad) or look into the global register
to find out which rules are needed,
5. add the rules inside the selector, and add these rules to a `<style party-style>` 
element inside the shadowDOM.

It will also make "theme" rules that are similar, 
but that do not include "document_docid_" as they should be inherited freely down document borders.


### what triggers receiver side?

Every time an element with this mixin connects, it will:

1. check if it is connecting to a new document. 
2. If it is a new document, it will rewrite its own part rules, with new part id.

3. every time the shadowDOM changes, it needs to find its party-styles, and check if they have changed.
using regex.
