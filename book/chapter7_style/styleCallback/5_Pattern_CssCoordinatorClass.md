# Pattern: CssCoordinatorClass

The CssCoordinatorClass pattern controls the style of a web component using two native CSS features: 
**CSS classes** and **CSS variables**.
The CSS class *is* the coordinator that can both *coordinate how CSS variables are used* and 
*activate/deactivate different sets of styles on the shadowDOM*.
The user of the web component selects between a series of styles that the developer of the 
web component internally implements and coordinates.

## Internal style coordination

Inside, the web component assumes two things:
1. that the user of the web component will select between and assign zero, one or more CSS classes
   with particular names to the host element and 
2. assign or not assign a value to one or more CSS variables that apply to the host element. 

The web component then uses these two CSS features to *internally control and coordinate* 
the style in its shadowDOM.

*Internally*, the role of the CSS classes is to select between two or more *parallel* set of CSS rules.
Given a CSS class on the host element, then a some CSS rules are activated on the 
webcomponent's shadowDOM elements, while another set of CSS rules are deactivated. 
These CSS rules and classes are often mutually exclusive, although they can overlap.
   
*Internally*, the role of the CSS variables is to provide these internal CSS rules with concrete values.
Once inside the web component, these CSS variables can be applied as values
to *any* property on *any* element in *any* CSS rule. 

When used together, the CssCoordinatorClass can thus selectively choose:
1. which CSS variables to use,
2. which elements to apply a CSS variable to, and
3. which property on these elements to assign the CSS variable value.

## External interface

*Externally*, the control of the internal style is exposed as a list of CSS class names and a list
of CSS variable names:

1. The list of CSS class names are often mutually exclusive: the web component user should choose one,
   not many of them. However, exposed CSS class names can also overlap enabling
   the user to apply several style properties on the element at once.
   
   As all CSS classes, the CSS classes must be assigned to the host element to apply.
   And to assign a CSS class to an element can only be done statically from HTML or dynamically from JS.
   This means that there is no way to control these CSS classes neither statically nor dynamically 
   from CSS.
   
2. The list of CSS variables are not mutually exclusive. The user of the web component needs to 
   externally specify and coordinate both the different CSS variables set on an element.
   When controlled by a CssCoordinatorClass, both CSS variables and CSS classes needs to be
   externally coordinated.

   CSS variables can be assigned both statically and dynamically in CSS.
   CSS variables are CSS properties that can cascade and be activated/deactivated on a specific element
   when different CSS rules are applied to an element or an element's ancestor. 
   CSS variables also cascade past ShadowDOM borders as we have seen before.
   
## Demo: Classy `<blue-blue>` with `night-mode`

In this example we demonstrate how a CssCoordinatorClass both coordinates the use of CSS variables and 
activates/deactivates two style sets inside a web component.

The example is the `<blue-blue>` with a `night-mode` (and default, implied day mode).
When a CSS class `night-mode` is added to the web component, the `--light-color` is used as 
foreground/text color and `--dark-color` is used as background color.
When a CSS class `night-mode` is not present on the host element, the colors are arranged in the 
reverse order, establishing a day mode as the default option.

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
        :host(.night-mode) div {                           /*[2]*/
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
<blue-blue class="green night">green night</blue-blue>
<blue-blue class="night">blue night</blue-blue>
<blue-blue>blue day</blue-blue>
<blue-blue class="greenAndBlue">dark blue text on light green background</blue-blue>
```

When the user of `<blue-blue>` attaches a the `night-mode` CSS class to the host element, then 
this activates the second CSS rule which overwrite the properties set in the first CSS rule.
If the user does not set any `night-mode` class, only the first CSS rule is activated. 

## Benefits and drawbacks

One benefit of the CssCoordinatorClass pattern is that the CSS classes can cluster several 
codependent style variables into a simple selection. Compared to managing and coordinating several
codependent CSS variables on the outside, this greatly reduces the complexity of controlling the style
of a web component.

Another benefit is efficiency. Managing a web components internal style using only native CSS 
classes and CSS variables adds practically nothing to the cost of processing the selection.

Third, using only native CSS to control the style of a web component is ergonomic for the
user of the web component. Style controlled by CSS and CSS classes is a familiar concept.

One drawback of ClassyCssCoordinator is that CSS classes must be applied to the host element either
in HTML template statically or from JS dynamically. This means that the style aspects that the 
ClassyCssCoordinator CSS class controls can no longer be turned on or off from CSS alone.

Another drawback is that ClassyCssCoordinator is a bit limited. It cannot assess and react to the 
values of the elements style, something like `if color == "blue" then border-color = red`. 
This is a common limitation of CSS, but doing arithmetic on CSS property values becomes more, and not
less relevant for reusable web components.

## References

*