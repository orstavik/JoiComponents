# Pattern: CssCoordinatorAttribute

HTML attributes can be used to control the inner CSS of a web component in almost the exact
same as CSS classes. Instead of assigning a named CSS class to the host element, an HTML attribute
is assigned.

## Demo: `<blue-blue>` with attributable `night-mode`

In this example the `<blue-blue>`'s `night-mode` is set using an attribute instead of a CSS class.

```html
<script>
  class BlueBlue extends HTMLElement {
    constructor() {
      super();
      this.attachShadow({mode: "open"});
      this.shadowRoot.innerHTML = `
           <style>
        div {                                              /*[1]*/
           background-color: var(--light-color, lightblue);              
           color: var(--dark-color, darkblue);          
         }
        :host([night-mode]) div {                          /*[2]*/
           background-color: var(--dark-color, darkblue);                
           color: var(--light-color, lightblue);                  
        }
       </style>
       <div>
         <slot></slot>
       </div>`;                                                      
    }
  }

  customElements.define("blue-blue", BlueBlue);
</script>

<style>
  .green {                                           
    --light-color: lightgreen;
    --dark-color: darkgreen;
  }
  .greenAndBlue {                                         
    --light-color: lightgreen;
  }
</style>

<blue-blue class="green day">green day</blue-blue>            <!--[3]-->
<blue-blue night-mode class="green">green night</blue-blue>
<blue-blue night-mode>blue night</blue-blue>
<blue-blue>blue day</blue-blue>
<blue-blue class="greenAndBlue">dark blue text on light green background</blue-blue>
```
1. The first CSS rule sets the element in day mode by default.
   By *not* setting `night-mode` on the host element, day mode is selected.
   The background color is `--light-color` (`lightblue` by default).
   The text color is `--dark-color` (`darkblue` by default).
2. The second CSS rule sets the element in `night-mode`, ie. dark background and light text. 
   By setting the `night-mode` attribute on the host element, the web component user can control the
   inner coordination of several CSS properties (here: the `--light-color` and `--dark-color`).
3. Five different elements are set up orchestrating the `night-mode` StyleCoordinatingAttribute 
   and the two `--light-color` and `--dark-color` CSS variables to achieve different effects. 

## HTML attributes vs. CSS class

Both externally and internally, it makes almost no difference whether we use HTML attributes
or CSS classes to coordinate the inner style of the `<blue-blue>` with `night-mode` web component:
 * `:host([night-mode])` is not much different from `:host(.night-mode)` and
 * `<blue-blue night-mode>` is not much different from `<blue-blue class="night-mode">`.  

Except for not explicitly marking the HTML attribute as having to do with style as a CSS class would,
there benefits and drawbacks are identical.

But. There is one other important difference between HTML attributes vs. CSS classes.
Dynamic changes of an element's HTML attributes is much easier and lighter to observe than 
changes of an element's CSS classes. Especially in web components with their `observedAttributes()`
and `attributeChangedCallback(...)` methods. This we will look at in our next chapter.

## References

 * 
