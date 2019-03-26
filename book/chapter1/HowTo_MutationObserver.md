# `MutationObserver`

## `MutationObserver`

The DOM is dynamic. 
In JS, elements and nodes are added to and removed from the DOM all the (run-)time.
In the normal DOM, such changes are observed using the `MutationObserver` API.

```javascript
function onChange(changes) {
  for (let c of changes) {
    console.log(c.target, "'s .children have changed.");
  }
}
const someElement = document.createElement("div");
const myObserver = new MutationObserver(onChange);
myObserver.observe(someElement, {childList: true});
someElement.appendChild(document.createElement("span"));    //someElement's children have changed.
```

The `MutationObserver` observes changes in the list of `.children` of individual DOM nodes.
You create a `MutationObserver` object with  a particular function, and 
then you register a particular node and what type of mutation in the DOM you would like to observe.
Then, when such a mutation happens to the DOM, the function is run.

This function is given the list of all the changes for all the changes you asked for on that object.
(But if you only specified `childList: true`, this list contains only one entry).
And then you can add the reaction you need to the change. 
The MutationObserver does not work for recursive changes, 
and so if you for example need to observe changes in the entire DOM, 
you would need to add such `MutationObserver`s to all DOM nodes with children.
