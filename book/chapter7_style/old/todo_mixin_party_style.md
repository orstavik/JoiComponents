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

 * Every time the element is "adopted" or "connected", it needs to check and potentially run its parent, 
 if that parent has not already set up. The parent is *not* rerun if the document stylesheets have already been processed.
 
 * If you need to rerun a stylesheet dynamically, then you need to call a specific function
 for a specific stylesheet. This you do if you:
    * load a stylesheet from JS with ::part rules, or 
    * add, remove or alter a ::part rule in an already loaded and processed stylesheet. 

### What triggers 1?
 
 * If you change the shadowDOM of an element with ::parts, then you need to rerender 
   the receiver ::parts bridgehead. This you do with a particular function you call manually.
   
 * The local function to the element that adds the ::parts receiver.
   The ::parts receiver contains:
    1. **all** CSS properties?? so that everything can be specified?
    2. A subset of the most important ones that I choose??
    3. A StaticSetting that specifies which properties?? With a default set of properties that I choose??

## Receiver processing

First, the local shadowDOM is searched for all elements with ::parts attributes.

Second, a selector to that ::part is created, simply [part="the name"].

Third, a function sets up:
'property: `css variable using the docid of the document of the host element + the part name + 
            the property name`'. 

if the part is transposing into a shadowDOM, then it sets the variable name of the reference 
to be variable name of the referee. If will then use both the id of the document of the host + id of the shadowDOM document.
 
::Parts transposition.
* => 
     
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

## How to iterate all the applicable stylesheets and their rules from a custom element?

1. the shadowRoot of a custom element is a Document (or DocumentOrShadowRoot mixin in Chrome).
These documents can contain .stylesheets array.
When custom elements are used within other custom elements, 
these documents (ant their stylesheets) gets nested in a chain running from the custom element all 
the way up to the main document. 
A custom element can inherit css variables from any stylesheet in this document chain.
Recursive function that finds all these documents.

```javascript
function getListOfParentDocuments(node){
  return node.host ? [node].concat(getParentDocuments(node.host)) : [node];
}
```

2. To iterate all the stylesheet rules in a document and check their selector, prop, value
Here, we use the CSSOM structure.
```javascript
function foreachRuleProperty(doc, cb){        //the cb(selector, prop, value)
  for (let sheet of doc.styleSheets) {
    for (let rule of sheet.cssRules){
      cb(rule);
    }
  }
}

function processPartRules(rule, docID){
  let selectorBits = splitPartInCSSSelector(rule.selector);
  if (!selectorBits[1])    //does not have a ::part bit
    return;
  let newCSSRuleAsText = selectorBits[0] + "{\n";
  for (let i = 0; i < rule.length; i++){
    let prop = rule[i];
    let newPropName = makeCssVariableEquivalent("--" + "part-" + docID + "-" + prop);
    let value = rule.getPropertyValue(prop);
    newCSSRuleAsText += "  " + newPropName + ": " + value + ";\n";
  }
  newCSSRuleAsText += "}";
  
}

function runOnEveryRule(doc){
  
}
```

3. This is not what we need, we need to filter the rules to only find the relevant ones.

## References:
 * https://meowni.ca/posts/part-theme-explainer/
 * https://tabatkins.github.io/specs/css-shadow-parts/
 * https://developer.mozilla.org/en-US/docs/Web/API/CSSStyleSheet
 * https://developer.mozilla.org/en-US/docs/Web/API/CSSStyleRule
 * https://developer.mozilla.org/en-US/docs/Web/API/CSSStyleDeclaration
 * https://developer.mozilla.org/en-US/docs/Web/API/ShadowRoot
 
 * https://bugs.chromium.org/p/chromium/issues/detail?id=775525 
 The fix/bug above makes it necessary to run the *same* mixin from all CORS origins.
 If not 