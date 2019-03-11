# Pattern: TreeOrderedCssomTraversal

1. This pattern traverses a list of elements that exist in the CSSOM.
   No elements outside of the DOM can be in the list.

2. The elements in the list are at the beginning randomly ordered, but 
   should be iterated over in TreeOrder.
   Set the ElementsProcessedThisCycle to be an empty list.
   
3. Iterate each element in the list as the currentlyExecutedElement.
   1. check if one of more style properties on the currentlyExecutedElement 
      has changed since the lastKnownValue.
      1. if a style property has changed, trigger `styleCallback(propertyName, oldValue, newValue)` 
         on the currentlyExecutedElement, and update the lastKnownValue.
   2. Add currentlyExecutedElement to a list of ElementsProcessedThisCycle.

4. After processing currentlyExecutedElement, all the elements in the ElementsProcessedThisCycle
   should be checked to see if any of their observed style properties have changed since their lastKnownValue.
   If this has happned, that means that the `styleCallback(...)` on the currentlyExecutedElement
   has likely been the cause of side effect of CSSOM mutations that conceptually triggers a cyclical 
   `styleCallback(...)` sequence. If the check fails in this way, an Error message stipulating that the
   `styleCallback(...)` on the just now executed element caused this side-effect.
   (There is a possibility that another element mutated the DOM in such a way that did not directly trigger
   the CSSOM to change, and that the cyclical relationship only is triggered accidentally later.
   However, this is considered to be an off the books edge case thus far.)

5. This check can be turned on and off. 

6. Elements with a `styleCallback(..)` that are:
   1. dynamically added to the list during the traversal and 
   2. positioned as contained within the currentlyExecutedElement,
      
   should be added to the list and have their `styleCallback(..)` be executed in the same cycle.

7. Elements with a `styleCallback(..)` that are:
   1. dynamically added to the list during the traversal and 
   2. positioned as not contained within the currentlyExecutedElement,
   
   should cause an Error to be thrown as an illegal CSSOM mutation.
   
8. 

## Implementation

```javascript

function throwError(current, altered, property){
  throw new Error("Cyclical styleCallback Sequence Error:"+ 
                   "\n"+current.className + "." + "styleCallback(name, oldValue, newValue) " +
                    "\nhas triggered a change of an observed style of " + altered.className + ".style."+property + 
                    "\n that should trigger the " + 
                   altered.className + "." + "styleCallback(name, oldValue, newValue) "+
                     "\nto be called again, cyclically within the same frame.");
}
```

## References

 * 
