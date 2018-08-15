# Problem: When to setup a custom element

## Example: AboveBelowTheFold

This example illustrates the four main scenarios for when custom elements might be setup.

```html
<html>
<body>
                                                                       <!-- [a] -->
<above-the-fold style="width: 100vw; height: 100vh; display: block;">  <!-- [1] -->
  <div>Critical at load time, setup immediately and connect.</div>
</above-the-fold>
                                                                       <!-- [b] -->
<below-the-fold style="width: 100vw; height: 100vh; display: block;">  <!-- [2] -->
  <div>Not critical at load time, delay setup and connection functionality.</div>
</below-the-fold>
                                                                       <!-- [c] -->
<script defer>
const immediately = document.createElement("div");
document.querySelector("body").appendChild(immediately);               // [3]

const inAdvance = document.createElement("prepped-element");           // [4]
//here you want to setup this element in advance before 3000ms has passed.
setTimeout(
  function(){
    document.querySelector("body").appendChild(inAdvance);
  }, 3000);
</script>

</body>
</html>
```
1. The first element, `<above-the-fold>`, is shown on the screen as soon as the page loads.
Until this element, and its children, are setup and loaded, the page will not be ready for the user.
This element is therefore *critical* for the user experience at load time and 
it must be set up and connected to the DOM immediately.

2. The second element, `<below-the-fold>`, is not immediately visible on the screen at load time.
This element is therefore *not critical* and it might be possible to delay both the setup and 
`connectedCallback()` functionality of this element, and its children elements.
By delaying the element setup and connection functionality *and* the connection of its children to the DOM, 
we can free up resources for more critical elements and user interaction.

3. Third, after the page has loaded, we create a new `<div>` called `immediate`.
This `<div>` is added to the DOM immediately.

4. Lastly, after the page has loaded, we create a new element `inAdvance` (type `<prepped-element>`).
This element will only be added to the DOM at a later point (here simply `3000ms`), 
but we would like to prepare the element as much as possible so that it can be used more efficiently later.

a. b. c.) Different locations where custom element definition might be registered.

## Setup: in the right place at the right time

As we see, custom elements can be created both:
* while the page is loading (both statically from the main html document and dynamically from js)
* after the page has finished loaded (only dynamically from js).

When the page is loading, we have two different scenarios. The element we need to set up is:
* **immediately** critical for the user experience ("above the fold") or 
* **not-yet** critical for the user experience ("below the fold").

After the page has loaded, we also have two scenarios. We need to set up our element:
 * **immediately** when we connect the element to the DOM or
 * **in advance** because we want to set it up while we have idle resources 
   before we later connect it to the DOM.

In sum three different scenarios for when we need to set up our custom element.

1. **immediately**, before the element is connected to the DOM.
2. **in-advance**, create and setup elements that are used later.
3. **not-yet**, elements are immediately connected to the DOM, 
   but setup and connecting functionality is delayed until later.

## References

 * [Above the fold](https://en.wikipedia.org/wiki/Above_the_fold)