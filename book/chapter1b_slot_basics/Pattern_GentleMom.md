# Pattern: GentleMom

> The GentleMom pattern apply to most aspects of a custom element, not just slot fallback nodes.

*The GentleMom principle: 
Always try to honor the wishes of first outside parents and then inside children,
before you substitute their wishes with your own.*

The GentleMan pattern in [What is: slot fallback nodes](WhatIs_slot_fallback_nodes.md) 
describes why and when to provide `<slot>`s, and why and when to provide fallback nodes.
But, what should we do when we *link slots*? 
How should the web component where the slots are linked, treat:
1. the `<slot>`s it provides to its user web components, its outside parents?
2. the fallback nodes of its inner web component `<slot>`?
3. the fallback nodes of its own `<slot>`?

As described above, when linking `<slot>`s, a web component should first of all follow the GentleMan
pattern. That means providing `<slot>`s where necessary, and ensuring that a graceful fallback will occur.
But, in addition to the GentleMan pattern, a web component that creates a slot link, 
should also avoid overwriting the fallback nodes of its children if no special reasons require it to do so.
The GentleMom would therefore prioritize first slotable nodes from its outside parents,
and then rely on the inner web components own fallback nodes, 
if no special circumstance compels it to fill in its own fallback value.

## Example: the GentleMom Fail!

Unfortunately, with the current implementation (and spec?) for `<slot>`s, this pattern is broken.
The following example illustrate how.

**This example is BROKEN!!**. 
```html
<script>
  class PassePartout extends HTMLElement {       
    
    constructor(){
      super();
      this.attachShadow({mode: "open"});     //[1]
      this.shadowRoot.innerHTML =             
        `<style>
          div {
            display: block;                                  
            border: 20px solid grey;
          }
        </style>

        <div>
          <slot id="innerSlot">
            Thank you for your interest!
          </slot>
        </div>`;
    }
  }
  class GreenFrame extends HTMLElement {       
    
    constructor(){
      super();
      this.attachShadow({mode: "open"});     //[1]
      this.shadowRoot.innerHTML =             
        `<style>
          div {
            display: block;                                  
            border: 10px solid green;
          }
        </style>

        <div>
          <passe-partout><slot id="outerSlot"></slot></passe-partout>
        </div>`;
    }
  }
  customElements.define("passe-partout", PassePartout);
  customElements.define("green-frame", GreenFrame);
</script>

<green-frame></green-frame>
```
**This example is BROKEN!!**. 

## Diagram

## Why did it break?

**This example is BROKEN!!**. But why? 
The GentleMom pattern breaks because of peculiarities in the algorithm that flattens a `<slot>`: 

If a `<slot>` has no slotable elements, then it will use its own fallback nodes.
But, if a `<slot>` has another `<slot>` as a child, and 
that other `<slot>` has neither any slotable nodes nor fallback nodes, then 
this will have registered that the inner `<slot>` has slotables, but 
when it tries to add those slotables, it comes up empty.

## Next-best alternative: GentlePap

> "Not the Momma!" baby from [Dinosaurs](https://en.wikipedia.org/wiki/Dinosaurs_(TV_series))

This next pattern will base itself on a cultural dogma that 
fathers are not as sensitive and respectful of their children's own wishes as mothers are. 
Mothers and fathers alike will respect and listen to directives coming from the outside, but 
fathers will overlook their childrens wishes and put words in their children mouths. 
If this dogma is true or not, I don't know. But as a recognizable metaphor,
it serves our purposes.

As the GentleMan and GentleMom, web components following the GentlePap pattern will 
prioritize and show content from their outside parents.
But, unlike the GentleMom pattern, the GentlePap will provide its own fallback nodes *always*, 
even though the inner child's `<slot>` do provide similar and as appropriate fallback nodes.

## Example: NotTheMomma!

```html
<script>
  class PassePartout extends HTMLElement {       
    
    constructor(){
      super();
      this.attachShadow({mode: "open"});     //[1]
      this.shadowRoot.innerHTML =             
        `<style>
          div {
            display: block;                                  
            border: 20px solid grey;
          }
        </style>

        <div>
          <slot id="innerSlot">
            Thank you for your interest!
          </slot>
        </div>`;
    }
  }
  class GreenFrame extends HTMLElement {       
    
    constructor(){
      super();
      this.attachShadow({mode: "open"});     //[1]
      this.shadowRoot.innerHTML =             
        `<style>
          div {
            display: block;                                  
            border: 10px solid green;
          }
        </style>

        <div>
          <passe-partout><slot id="outerSlot">
            Not the momma!
          </slot></passe-partout>
        </div>`;
    }
  }
  customElements.define("passe-partout", PassePartout);
  customElements.define("green-frame", GreenFrame);
</script>

<green-frame></green-frame>
```
The GentlePap pattern works in current spec and browsers.

## Diagram

## What happened?

As in the previous example, `<slot id="innerSlot">` finds 
the `<slot id="outerSlot">` as a slotable node.
Also, as in the previous example, when `<slot id="outerSlot">` tries to find a slotable node itself,
it again comes up empty handed.
But, counter to the previous example, the `<slot id="outerSlot">` *has* fallback nodes,
and during the resolution, it will return those fallback nodes.


## Discussion: Why GentleMom?
In addition to being a GentleMan, the GentleMom is equally gentle and helpful towards her children elements.
If there is no compelling reason why she should, the GentleMom will not provide a default fallback content of her own slot.
Instead, she will let her children, who is nearest to the situation, 
provide the fallback content of their own slot.
The GentleMom will not overrule/overwrite the fallback content of her children if she does not have to.

The reason the GentleMom principle is benefitial is that the GentleMom custom element operates in a context of change.
The many and updating documents that might use the GentleMom element will of course change. 
But(!) In addition the custom children element that she relies on, will also change. 
In general, by allowing the children element to make as many decisions as possible, 
these children elements become more independent and can be updated and evolve more freely without 
negatively interfering with the function of the parent, consumer element. 
Put simply: Low coupling is good, and this is a situation that calls for low coupling.

## Example: RedPage
Lets us see this problem in action. 
Here we will make a GentleMom element that we call RedPage. 
The RedPage uses a BlueHeader. And it is used in a web page we can call GreenBook.html. 
Simple. GreenBook.html -> RedPage -> BlueHeader.

But. There is a problem. We have a social situation. 
 * Mrs Blue is making BlueHeader with a slot.
 * Mrs Red is making RedPage. RedPage passes its slot content into the slot of BlueHeader.
 * Mrs Green is making GreenBook.html that uses RedPage.
 * You are Mrs Red. You know that you have to enable the Mrs Green and a 100 other ladies to pass in different slot content to their instances of your RedPage element. You are a GentleMan toward them. But, you also want to allow Mrs Blue to update BlueHeader and make corrections and adjustments to the fallback content of BlueHeader, without you updating your RedPage more than strictly necessary. So, you want to be a GentleMom towards mrs Blue.

Below is the GreenBook.html example. To make things easier to read, 
the custom element definition of both RedPage and BlueHeader is inlined in the html page.
```html
<h1>GreenBook.html</h1>
<script>
  /*Managed by Mrs Blue*/
  class BlueHeader extends HTMLElement {
    constructor(){
      super();
      this.attachShadow({mode: "open"});
      this.shadowRoot.innerHTML = `
<h2 style="background: blue"><slot>Blue title</slot></h2>`;
    }
  }
  customElements.define("blue-header", BlueHeader);

/*Managed by Mrs Red*/
class RedPage extends HTMLElement {
    constructor(){
      super();
      this.attachShadow({mode: "open"});
      this.shadowRoot.innerHTML = `
<blue-header><slot name="header"></slot></blue-header>
<div style="color: red"><slot>Red title</slot></div>
`;
    }
  }
  customElements.define("red-page", RedPage); 
</script>

<red-page id="gentleMom">
  <span slot="header">Green page 1</span>                                      
  <span>The planet is green, not blue.</span>
</red-page>
<red-page id="gentleMom"></red-page>
<!--
This should show "Red title", but today with slots this doesn't work. 
See the StylingSlots chapter explanation.
Instead "Blue title" is shown.
--> 
```

The [GreenBook.html example](https://codepen.io/orstavik/pen/dgyWMM) in action.

## References

 * dunno