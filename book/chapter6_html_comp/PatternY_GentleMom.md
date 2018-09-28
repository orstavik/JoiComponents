# Pattern: `<slot>` and GentleMom

*Treat all equal and fallback gracefully. A true GentleMom.*

When providing `<slot>`, you need to consider what content should be replaceable by your element's consumers.
This is most often self-evident when you make the element.
But, when making and using `<slot>` elements, 
you should also provide your elements with default, fallback content.
This is done by adding children nodes (HTML elements or text nodes) to the slot element itself.

This chapter describes patterns, GentleMan and GentleMom, for providing 
`<slot>` element to custom element consumer.
These two patterns apply to all aspects of a custom element, not just `<slot>`.

## the GentleMan pattern
When making a custom element, you should let your users/authors provide variable content using `<slot>`s. 
But, when the user provides no content to this `<slot>`, 
you should be a GentleMan and gracefully provide some default fallback content.
The fallback content and the assigned content should be treated equally by the custom element 
(ie. be styled the same).

## the GentleMom pattern
A custom element can pass slotted nodes into another custom element. 
Such an element will become both:
 * a parent element for the custom element into which it passes on its slotted content, and 
 * a child element of the document from where it gets its slotted content.
 
We call this element in the middle the parent element, and 
the document from where it gets its slotted content the grandparent document. 

The GentleMom describes the preferred behavior of such a parent custom element. 
The GentleMom behaves like the Gentleman, in that it lets the author of its own parent document (the grandparent document)
slot in variable content via a slot. 
The GentleMom then passes the same slotted nodes to the slot of its child element.

But, in addition to being a GentleMan, the GentleMom is equally gentle and helpful towards her children elements.
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
<h2 style="background: blue"><slot>Title</slot></h2>`;
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
<div style="color: red"><slot></slot></div>
`;
    }
  }
  customElements.define("red-page", RedPage); 
</script>

<red-page id="gentleMom">
  <span slot="header">Green page 1</span>
  <span>The planet is green, not blue.</span>
</red-page>
```

To see this example in action, see here:

## References

 * dunno