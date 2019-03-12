# Pattern: TreeOrderedCssomTraversal

This pattern traverses a list of CssomElements and calls `styleCallback(...)` on each one for
every observed style property that has changed since last traversal.

A. Available resources
   1. all the CssomElements are connected to the DOM, assuming random order.
   2. Each CssomElement has a `styleCallback(...)` method.
   3. Each CssomElement has a list ObservedStyles of its observed style properties and their previous 
      value.
   4. The elements in the CssomElements list can be completely rearranged between each bout of
      traversal.
   5. If the list of CssomElements is currently being traversed and processed,
      then the CurrentlyExecutedElement is the CssomElement currently being processed, 
      otherwise CurrentlyExecutedElement is undefined .

B. The traversal is completed as follows.

1. At the beginning of traversal:
   1. sort the CssomElements in TreeOrder.
   2. define an empty list called ProcessedElements.

2. Traverse the CssomElements and set each element as the CurrentlyExecutedElement.
   
   1. Get the ObservedStyles from the CurrentlyExecutedElement.
      1. If the CurrentlyExecutedElement has not been observed before, 
         the LastKnownValue of each ObservedStyle is undefined.
      2. else, the LastKnownValue is the value of the CSS property from the previous traversal.
      
   2. If the CurrentValue of an ObservedStyle on the CurrentlyExecutedElement is different
      than the LastKnownValue, then;
      
      1. trigger `styleCallback(observedStyleName, LastKnownValue, CurrentValue)`,
      
      2. update the LastKnownValue to be the CurrentValue.
         
      3. Check CyclicalCssomMutations
   
         1. IfStyleWasAltered checks that CurrentValue is the same as LastKnownValue for
            all ObservedStyles on all ProcessedElements, including the CurrentlyProcessedElement.
         
         2. If so, this means that the `styleCallback(...)` on the CurrentlyExecutedElement 
            has caused a side effect of CSSOM mutations that could conceptually trigger a cyclical 
            `styleCallback(...)` sequence.
            1. Throw an Error message stipulating that:
               1. the `styleCallback(...)` on the just now executed element caused this side-effect.
               (There is a possibility that another element mutated the DOM in such a way that did 
               not directly trigger the CSSOM to change, and that the cyclical relationship only is 
               triggered accidentally later. However, this is considered to be an off the books edge 
               case thus far.)

   3. Add CurrentlyExecutedElement to a list of ProcessedElements.
      
3. When the traversal finishes, set CurrentlyExecutedElement to be undefined.
   
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

function CyclicalCssomMutationsError(current, currentProperty, altered, alteredProperty){
  throw new Error("Cyclical styleCallback Sequence Error:"+ 
                   "\n"+current.className + "." + "styleCallback('"+currentProperty+"', oldValue, newValue) " +
                    "\nhas triggered a change of an observed style of " + altered.className + ".style."+alteredProperty + 
                    "\n that could trigger the " + 
                   altered.className + "." + "styleCallback('"+alteredProperty + "', oldValue, newValue) "+
                     "\nto be called again, cyclically within the same frame.");
}

let cssomElements = [];
let currentElement = undefined;

function checkProcessedElementsStyleWasAltered(triggeringProp, processedElements) {
  for (let el of processedElements) {
    const observedStyles = currentElement[observedStylesMap];
    const currentStyles = getComputedStyleValue(el);
    for (let name of Object.keys(observedStyles)) {
      let newValue = currentStyles[name];
      let oldValue = observedStyles[name];
      if (newValue !== oldValue)
        CyclicalCssomMutationsError(currentElement, triggeringProp, el, name);
    }
  }
}

function checkCurrentElementStyleWasAltered(observedStyles, currentElement, triggeringProp){
  const newStyles = getComputedStyleValue(currentElement);
  for (let name of Object.keys(observedStyles)) {
    let newValue = newStyles[name];
    let oldValue = observedStyles[name];
    if (newValue !== oldValue)
      CyclicalCssomMutationsError(currentElement, triggeringProp, currentElement, name);
  }
}

function traverseCssomElements(){
  cssomElements = cssomElements.sort(function(a, b){a.compareNodePosition(b) & Node.DOCUMENT_POSITION_PRECEDING});
  const processedElements = [];
  for (let i = 0; i <= cssomElements.length; i++) {
    currentElement = cssomElements[i];
    const observedStyles = currentElement.getObservedStylesMap();
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
      CyclicalCssomMutationsError(currentElement, currentProperty, el, "*");
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
      CyclicalCssomMutationsError(currentElement, currentProperty, el, "*");
  }
  cssomElements.splice(cssomElements.indexOf(el), 1);
}
```

## References

 * 
