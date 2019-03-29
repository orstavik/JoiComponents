# Pattern: GentleMom

*The GentleMom principle: 
Always try to honor the wishes of first outside parents and then inside children,
before you substitute their wishes with your own.*

The GentleMan pattern in [What is: slot fallback nodes](3_WhatIs_slot_fallback_nodes) 
describes why and when to provide `<slot>`s, and why and when to provide fallback nodes.
But, what should we do when we *link slots*? 
How should a web component that link slots treat:
1. the `<slot>`s it provides to its user web components, its outside parents?
2. the fallback nodes of its inner web component `<slot>`?
3. the fallback nodes of its own `<slot>`?

When linking `<slot>`s, a web component should first of all follow the GentleMan pattern. 
The web component should provide its users with all the relevant `<slot>`s, and 
ensuring that each `<slot>` has a graceful fallback with relevant child nodes.
But, a web component that links slots should also avoid overwriting the fallback nodes of its children 
if no special reasons require it to do so.

Thus, GentleMom's would try to fill a slot according to the following priority: 
1. if the outside parent has slotable childnodes, use those first,
2. if the GentleMom needs to specify her own fallback nodes to an inner child, do that.
3. but if the GentleMom does not need to override the fallback nodes of the inner child,
   use the inner web component children's own fallback nodes.

## Example: the GentleMom Fail!

If there is no compelling reason why she should, 
the GentleMom will not provide a default fallback content of her own slot.
Instead, she will let her children, who is nearest to the situation, 
provide the fallback content to their own slot.
The GentleMom does not overwrite the fallback content of her children if there is no need.

Unfortunately, the GentleMom pattern fails according to the current DOM specification for `<slot>`s.
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
**This example FAILS**. "Thank you for your interest!" is *not* displayed.

## Diagram

## Why did it fail?

The GentleMom pattern breaks because of peculiarities in the algorithm that flattens a `<slot>`: 

If a `<slot>` has no slotable elements, then it will use its own fallback nodes.
But, if a `<slot>` has another `<slot>` as a child, and 
that other `<slot>` has neither any slotable nodes nor fallback nodes, then 
this will have registered that the inner `<slot>` has slotables, but 
when it tries to add those slotables, it comes up empty.

## Next-best alternative: GentlePap

> "Not the Momma!" Baby Sinclair from [Dinosaurs](https://en.wikipedia.org/wiki/Dinosaurs_(TV_series))

This next pattern will base itself on a cultural dogma that 
fathers are not as sensitive and respectful of their children's own wishes as mothers are. 
Mothers and fathers alike will respect and listen to directives coming from the outside, but 
fathers will overlook their childrens wishes and put words in their children mouths. 
If this dogma is true or not, I don't know. But as a recognizable metaphor, it serves our purposes.

As with the GentleMan and GentleMom, web components following the GentlePap pattern will 
prioritize and show content from their outside parents.
But, unlike the GentleMom pattern, the GentlePap will provide its own fallback nodes *always*, 
even though the inner child's `<slot>` do provide similar and as appropriate fallback nodes.
The children with their `<slot>` may try to speak all they like, but GentlePap will never listen.

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

## Discussion: GentleMom as low coupling

All web components operates in a context of change.
A web component must not only anticipate to be used in many different apps and contexts, but
also anticipate that *all* of these apps and contexts will be updated, enhanced, refactored, etc.etc.
over time.
To adapt to this changing landscape *above* the web component, 
web components should be made with as *low coupling* to their context of use as possible.

But, web components that also use other child web components in their shadowDOM
operates in a context of doubly change, change both above and below.
The child web component also needs to update itself to keep efficient, become more performant,
fix bugs, get better style, etc.etc.
The parent web component that use this other web component can and do freeze the version of the
child web component it uses, these changes are not fluidly running into established apps, usually.
But, to keep fresh and not grow stale, the when the web component updates and changes, 
it should for good housekeeping also update its children.
By allowing the children element to make as many decisions as possible, 
these children elements become more independent and can be updated and evolve more freely without 
negatively interfering with the function of the parent, consumer element. 

The GentleMom pattern is not only a rule for `<slot>`s and slot fallback nodes;
the GentleMom pattern applies to most aspects of a custom element in general.
The GentleMom is a pattern of *low coupling* for web components "in the middle".
The GentleMom has a truly attractive ethos of being sweet and kind to those with less power 
than herself in the situation. Following this ethos also makes her more adaptable to change.

## References

 * dunno
 
## Old
 
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
 