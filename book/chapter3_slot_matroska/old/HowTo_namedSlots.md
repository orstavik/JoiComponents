# Named `<slot>` and assignable nodes.

There are two types of `<slot>` elements: 
* **empty-name slot**: `<slot></slot>` or `<slot name></slot>` or `<slot name=""></slot>`.
* **named slot**: `<slot name="nick"></slot>`.

As shown in the previous chapters, 
all `<slot>` elements refer to childNodes of the `host` element.
The no-name `<slot>` simply refers to all the child nodes of the `host` element
that either has no `slot` attribute or an empty slot attribute.
The "empty-name slot" *does not* slot the host's child elements that have a `slot`-attribute
with a non-empty value. The empty name slot assigns to all child nodes of the host 
except the named child nodes.

A named `<slot>` refers to an explicit subset of the child elements of the `host`.
Here, the `<slot>` element inside the shadowDOM has a particular `name`-attribute such as `name="nick"`.
This `<slot>` only points to child elements of the host that has a corresponding 
`slot`-attribute such as `slot="nick"`.
So,
1) when the `name`-attribute of the `<slot>` element 
2) equals the `slot`-attribute of the host node's child element 
3) is the child element assigned to the slot.

We extend our GreenFrame slightly to illustrate how child elements are slotted.

## Example: LabeledGreenFrame
In this example we will add a label to our `<green-frame>` custom element.

```html
<script>
  class LabeledGreenFrame extends HTMLElement {       
    
    constructor(){
      super();
      this.attachShadow({mode: "open"});
      this.shadowRoot.innerHTML =             
        `<style>
          :host {
            display: block;                                  
            border: 10px solid green;
          }
        </style>
        <slot></slot>
        <div>
           <slot name="label"></slot>    
        </div>
        `;                      
    }
  }
  customElements.define("green-frame", GreenFrame);
</script>

<green-frame>
  <img src="aPicture.jpg">
  <span slot="label">Painted by: Noot Hert Han</span>
  <div slot="inTheLightDomYouSeeMe">But in the flattened DOM you don't</div>
  <span slot="label"> So Mebo Dy</span>
</green-frame>
```

We can imagine the flattened DOM looking like this:
```html
<green-frame>
  <style>
  :host {
    display: block;                                  
    border: 10px solid green;
  }
  </style>
  <img src="aPicture.jpg">
  <div>
    <span>Painted by: Noot Hert Han</span>
    <span> So Mebo Dy</span>
  </div>
</green-frame>
```
Notice the following in this example:
1. Only `<img src="aPicture.jpg">` is added in the empty-name slot position.
Both of the other two host node child elements have a different `slot`-attribute, 
and is therefore excluded from the empty-name slot.
2. The `<span slot="label">` is included in the flattenedDOM, but 
not the `<div slot="inTheLightDomYouSeeMe">`. 
When a host child is given a `slot`-attribute, but 
no matching named `<slot>` can be found in the shadowDOM, 
the element is dropped from the flattened DOM and view.
3. The second `<span slot="label">` is also included in the flattenedDOM.

## Opinionated advice
There are limitation to using named slots. 
Often, when you need to name slots, you also need to alter or add other elements
around the named slot elements.
But, you don't want to alter the lightDOM, transposed children directly from within the shadowDOM.
That would be reaching into the lightDOM, and we wan't to avoid that.
So, if you mark lightDOM elements with the `slot`-attribute and suddenly feel the urge to 
also make changes in or around the slotted element, this is a sign that you do not want the `slot`
pattern, but are on your way to creating a pair of elements using the [HelicopterParentChild pattern](../../chapter6_html_comp/Pattern2_HelicopterParentChild.md).

<!--
All `<slot>` elements refer to children elements of the `host` element in the lightDOM.
The no-name `<slot>` simply refers to all the children of the `host` element.
"Named slots" refer to the children (or descendants) of the `host` element 
that has an attribute called `slot` with the same value as the `name` attribute 
of the slot in the shadowDOM inside the custom element. 
-->