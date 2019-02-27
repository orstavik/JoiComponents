# Pattern: StylePropertyChangedCallback

We have a DOM. The DOM consists of several nodes.
The style properties of these nodes can change.

To find the current style of any element, we need to call `getComputedStyle(el)`.
This method returns a style object whose properties can have changed since last check.
We can set this check up in the following way.

```javascript
(function(){
  var elements = new WeakMap({
    el1: {
      "--scope-depth": undefined, 
      "color": undefined
    }, 
    el2: {
      "--empty-cells": undefined, 
      "--color-palette": undefined
    }
  });
  
  function addElement(el, propsArray) {
    //todo maybe I need to safeguard el and propsArray arguments..
    if (!elements[el])
      elements[el] = {};
    for (let prop of propsArray) {
      if (!elements[el].hasOwnProperty(prop))
        elements[el][prop] = undefined;
    }  
  }
  
  function removeElementProps(el, propsArray) {
    if (!elements[el])
      return;
    for (let prop of propsArray) {
      if (elements[el].hasOwnProperty(prop))
        delete elements[el][prop];
    }  
  }
  
  function removeElement(el) {
    delete elements[el];
  }
  
  var currentEl;
  function iterateAllElementsAndStyles() {
    var iterateElements = Object.keys(elements);
    for (var i = 0; i < iterateElements.length; i++) {
      currentEl = iterateElements[i];
      var observedStyle = elements[currentEl];
      var newStyle = getComputedStyleValue(currentEl);
      for (var j = 0; j < observedStyle.length; j++) {
        var prop = observedStyle[j];
        var newPropValue = newStyle.getPropertyValue(prop);
        var observedPropValue = observedStyle[prop];
        if (newPropValue !== observedPropValue){
          observedStyle[prop] = newPropValue;                  //att!! mutates the observedStyle
          currentEl.styleChangedCallback(prop, newPropValue, observedPropValue);
        }
      }
    }
  }
})();
```

A very similar method is used for layout using offsetHeight.

# Pattern: MutableTreeOrderIteration

When we are running a sync iteration over the elements to call the styleChangedCallback(...) for
the elements, we want this to run in TreeOrder. This means that we need to sort the elements 
in TreeOrder before we run them.
```javascript
var iterateElements = Object.keys(elements).sort(function(a,b){
  return a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING
});
//todo test this sort order.
```
However, we might add or remove elements *while* the `iterateAllElementsAndStyles` loop is preceding.
If we add something in lower tree order, that is ok. If we add or remove an element 
with higher treeorder, that is bad. If the elements in the tree are moved in such a way that we during
iteration encounter an element that is higher in the tree than we were, that is wrong.

```javascript
function addElement(el, propsArray) {
  //todo maybe I need to safeguard el and propsArray arguments..
  if (!currentEl.compareDocumentPosition(el) & Node.DOCUMENT_POSITION_FOLLOWING)
    throw new Error("styleChangedCallback has caused a modification of lightDOM structure.");
  if (!elements[el])
    elements[el] = {};
  for (let prop of propsArray) {
    if (!elements[el].hasOwnProperty(prop))
      elements[el][prop] = undefined;
  }  
}

function removeElementProps(el, propsArray) {
  if (!currentEl.compareDocumentPosition(el) & Node.DOCUMENT_POSITION_FOLLOWING)
    throw new Error("styleChangedCallback has caused a modification of lightDOM structure.");
  if (!elements[el])
    return;
  for (let prop of propsArray) {
    if (elements[el].hasOwnProperty(prop))
      delete elements[el][prop];
  }  
}

function removeElement(el) {
  if (!currentEl.compareDocumentPosition(el) & Node.DOCUMENT_POSITION_FOLLOWING)
    throw new Error("styleChangedCallback has caused a modification of lightDOM structure.");
  delete elements[el];
}

var el;
```