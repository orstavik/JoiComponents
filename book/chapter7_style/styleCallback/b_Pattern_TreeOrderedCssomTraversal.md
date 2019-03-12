# Pattern: TreeOrderedCssomTraversal

This pattern traverses a list of CssomElements and calls `styleCallback(...)` on each one for
every observed style property that has changed since last traversal.

A. Available resources
   1. all the CssomElements are connected to the DOM, assuming random ordered.
      The elements in the CssomElements list can be completely rearranged between each bout of
      traversal.
   2. A variable element called CurrentlyExecutedElement.
      This element is undefined by default.

B. The traversal is completed as follows.

1. At the beginning of traversal:
   1. sort the CssomElements in TreeOrder.
   2. a list ProcessedElements is an empty list.

2. For each element called CurrentlyExecutedElement in the SortedCssomElements list.
   CurrentlyExecutedElement is a global property.
   
   1. StyleWasCalled is false.
   
   2. The ObservedStyles the list of all CSS properties on that element.
      1. If the CurrentlyExecutedElement has not been observed before, 
         the LastKnownValue of each ObservedStyle is undefined.
      2. else, the LastKnownValue is the value of the CSS property from the previous traversal.
   3. If the CurrentValue of an ObservedStyle on the CurrentlyExecutedElement is different
      than the LastKnownValue, then;
      1. trigger `styleCallback(observedStyleName, LastKnownValue, CurrentValue)`,
      2. Set StyleWasCalled to true
      3. update the LastKnownValue to be the CurrentValue.
   
   4. Add CurrentlyExecutedElement to a list of ProcessedElements.
   
   5. If IfStyleWasAlteredIsActive, then Check IfStyleWasAltered.
   
      1. IfStyleWasAltered checks that CurrentValue is the same as LastKnownValue for
         all ObservedStyles on all ProcessedElements.
   
      2. If so, this means that the `styleCallback(...)` on the CurrentlyExecutedElement 
         has caused a side effect of CSSOM mutations that could conceptually trigger a cyclical 
         `styleCallback(...)` sequence.
         1. Throw an Error message stipulating that:
            1. the `styleCallback(...)` on the just now executed element caused this side-effect.
            (There is a possibility that another element mutated the DOM in such a way that did 
            not directly trigger the CSSOM to change, and that the cyclical relationship only is 
            triggered accidentally later. However, this is considered to be an off the books edge 
            case thus far.)

3. CurrentlyExecutedElement is undefined.
   
C. IfStyleWasAlteredIsActive is false by default, but can be turned on with a global flag. 

D. Add and remove elements 
1. if CurrentlyExecutedElement is not undefined, then 
   check if CurrentlyExecutedElement contains the element to be added or removed.
   1. If true, 
      add it in the correct order in the CssomElements. 
      This index will be after the current index of Traversal.
   2. If false, Throw an Error message stipulating that:
      1. the `styleCallback(...)` on the just now executed element caused this side-effect.
2. Elements can be added and removed from the to CssomElements.
   Elements added are done so in TreeOrder

## Implementation

```javascript
const observedStylesMap = Symbol("observedStylesMap");

function throwError(current, currentProperty, altered, alteredProperty){
  throw new Error("Cyclical styleCallback Sequence Error:"+ 
                   "\n"+current.className + "." + "styleCallback('"+currentProperty+"', oldValue, newValue) " +
                    "\nhas triggered a change of an observed style of " + altered.className + ".style."+alteredProperty + 
                    "\n that could trigger the " + 
                   altered.className + "." + "styleCallback('"+alteredProperty + "', oldValue, newValue) "+
                     "\nto be called again, cyclically within the same frame.");
}

let cssomElements = [];
let currentElement = undefined;

function getSetObservedStylesMap(el){
  if (el[observedStylesMap])
    return el[observedStylesMap];
  el[observedStylesMap] = Object.create(null);
  for (let style of el.constructor.observedStyles())
    el[observedStylesMap][style] = undefined;
}

function checkProcessedElementsStyleWasAltered(triggeringProp, processedElements) {
  for (let el of processedElements) {
    const observedStyles = currentElement[observedStylesMap];
    const currentStyles = getComputedStyleValue(el);
    for (let name of Object.keys(observedStyles)) {
      let newValue = currentStyles[name];
      let oldValue = observedStyles[name];
      if (newValue !== oldValue)
        throwError(currentElement, triggeringProp, el, name);
    }
  }
}

function checkCurrentElementStyleWasAltered(observedStyles, currentElement, triggeringProp){
  const newStyles = getComputedStyleValue(currentElement);
  for (let name of Object.keys(observedStyles)) {
    let newValue = newStyles[name];
    let oldValue = observedStyles[name];
    if (newValue !== oldValue)
      throwError(currentElement, triggeringProp, currentElement, name);
  }
}

function traverseCssomElements(){
  cssomElements = cssomElements.sort(function(a, b){a.compareNodePosition(b) & Node.DOCUMENT_POSITION_PRECEDING});
  const processedElements = [];
  for (let i = 0; i <= cssomElements.length; i++) {
    currentElement = cssomElements[i];
    const observedStyles = getSetObservedStylesMap(currentElement);
    const currentStyles = getComputedStyleValue(currentElement);
    for (let name of Object.keys(observedStyles)) {
      let newValue = currentStyles[name];
      let oldValue = observedStyles[name];
      if (newValue !== oldValue){
        observedStyles[name] = newValue;
        currentElement.styleCallback(name, oldValue, newValue);
        checkProcessedElementsStyleWasAltered(name, processedElements);
        checkCurrentElementStyleWasAltered(observedStyles, currentElement, name);
      }
    }
    processedElements.push(currentElement);
  }
  currentElement = undefined;
}

function addElement(el){
  if (currentElement){
    if (! (currentElement.compareNodePosition(el) & Node.DOCUMENT_POSITION_CONTAINS))
      throwError(currentElement, currentProperty, el, "*");
  }
  for (let i = 0; i < cssomElements.length; i++) {
    let inList = cssomElements[i];
    if (el.compareNodePosition(inList) & Node.DOCUMENT_POSITION_CONTAINS)
      return cssomElements.splice(i, 0, el);
  }
}

function removeElement(el){
  if (currentElement){
    if (! (currentElement.compareNodePosition(el) & Node.DOCUMENT_POSITION_CONTAINS))
      throwError(currentElement, currentProperty, el, "*");
  }
  cssomElements.splice(cssomElements.indexOf(el), 1);
}
```

## References

 * 
