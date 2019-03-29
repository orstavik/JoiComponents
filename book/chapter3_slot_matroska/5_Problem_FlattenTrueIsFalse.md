# Problem: FlattenTrueIsFalse

In [HowTo: `assignedNodes()`](../chapter2_slot_basics/5_HowTo_assignedNodes), we saw how
`.assignedNodes()` can be used to introspect the flattened DOM state of a `<slot>`.
In this chapter we will look at how `assignedNodes()` behaves in a SlotMatroska.

`{flatten: true}`, does something the flattenedDOM doesn't. It unwraps a series of `<slot>` elements
that you *assume* are irrelevant, and then removes them from the result. But this is *not* what the
flattened DOM looks like. And, the `<slot>` elements might very well be styled and structured 
and play no less a role in the flattened DOM than a div.

The `{flatten: true}` must have a special case for the top most `<slot>` elements. If it did not stop
unwrapping at this point, it could return empty. However, this means that the `{flatten: true}` will
find the fallback nodes of the strange top-level `<slot>` elements, but not of mid-level
`<slot>` elements, and not of 




1. flatten true essentially removes all slots from the list of assigned nodes and *replace* them with
   their assigned value. recursively. This is how the slot would behave in the flattened DOM if it was 
   a normal variable. But this is also what we know to not be what the flattened DOM actually look 
   like.
   
   The layers in SlotMatroska might be meaningless (as in unstyled), they might not.
   
   So flatten: true gives a false impression if you imagine it to represent what the DOM looks like.
    
   This logic is not applied to main document level slots. These slots remain. That one might consider
   ok as adding a slot in the main document DOM, which by definition cannot receive any lightDOM o, which is a bit weirdo)
   that it assumes are irrelevant.
They might be, but they also might be styled. 

when 


# References

 * 

