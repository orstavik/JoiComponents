# WhatIs: `<SLOT>`

## Introduction: The concept of HTML slots
HTML is a language of HTML tags. 
You can put tags next to eachother, and you can put tags inside each other. 
The act of putting together an HTML document by placing HTML tags next to and inside each other is 
called HTML composition.

## HTML tags composed side by side

When you put HTML tags next to each other, 
they will be presented as beads on a string. You may of course use CSS to 
style the structure of this string, make it go upside down, right to left, 
stop after the fifth bead, etc. But, regardless of the shape of the string, 
the beads you put on it is one after the other, sequential.

When you make a web component (a custom HTML tag with an inner html document (a shadowDOM)), 
and place it next to other HTML tags, the web component will
place itself on the screen next to the other tags and 
present its inner html document as its children.
Using web components like this is simple, straight forward.
(And it is a good way to encapsulate HTML and CSS code, 
hiding low level from view and creating several local scopes for CSS, which we really like).  

## HTML tags composed within each other

When you put HTML tags inside each other, you can think of them as frames within frames.
When you set up the first tag, the outer frame, it will fill its own border, 
and create a space for the next frame.
The space for the inner frame we can think of as **a slot**, an opening inside the HTML tag
into which we can put our other tags.

Sometimes, the size of the HTML frame is static, meaning it is fixed from above.
But most HTML frames are elastic, like rubber, meaning that their size and shape 
depends on the size of what is put in the slot.
If the frame receives a small pass photo, it will shrink and wrap itself around the matchbox sized slot.
If the frame receives a large man-sized portait of a medieval king, 
it will grow and wrap itself around that.
And, if there is not enough space around the sides of the frame, 
some frames will adjust their border size, while others will remain fixed and rigid.

HTML tags can also be put inside each other in many levels, like frames within frames within frames etc. etc.
The outer element gives the frame, then comes a passepartout, then another passpartout and on and on,
until the final atomic photo is put in place.
Each frame will preserve **a slot** for its inner content, and each frame will contain its own rules
of whether it should stretch to fill the slot from its parent frame, remain a fixed size, or shrink
to fit the content of its slot.

HTML tags can also *both* contain **several slots** *and* fill **several elements in each slot**.
Each HTML frame control how their different inner slots are positioned against each other.
They can decide to show them side by side, one on top of the other, hide one of them,
stretch one to fit the other, etc. etc.
But, when several HTML tags are put together into the same slot of another the outer tag,
the outer tag will treat the elements as a group. The outer HTML frame will therefore strech to accomodate 
or statically define the frame around this group of HTML tags.

When you make a web component for and place other HTML tags inside that component, 
you therefore need to define the *slot(s)* for those inner HTML tags.
This is done by simply placing a special HTML tag for that element called **`<SLOT>`** 
somewhere in the inner html document of your web component. 
The `<SLOT>` marks the square around which the HTML frame of your web component will wrap itself.

## Example: `<green-frame>` with `<slot>`

In this example we create a simple custom element with a `<SLOT>`. 
The custom element called `GreenFrame` has a single default slot, 
it will stretch to fit that slot, and 
add a 10px wide green border around that slot.

```html
<script>
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
          <slot></slot>
        </div>`;
    }
  }
  customElements.define("green-frame", GreenFrame);
</script>

<green-frame>                                                <!--3-->
  <img src="aNicePicture.jpg" alt="a nice picture">          <!--4-->
</green-frame>
```

Below is a diagram that illustrates how this all fits together:

<img width="100%" src="svg/overview.svg" />

## How did it work?

1. The browser loads the source file `index.html`.
2. The browser's parser starts to parse the `index.html` file and build the `main` html document from that file.
3. As the parser encounters the `<script>`, it runs it, and from it creates a definition 
for the `GreenFrame` web component which it registers under tag name `<green-frame>`.
4. When the browser then encounters the `<green-frame>` tag in the document,
it creates a new html document for that element.
   1. The `this.attachShadow({mode: "open"});` creates the inner document. 
   2. The root of this new html document is placed under the `.shadowRoot` 
      property of its `<green-frame>` element node in the `main` html document. 
      This node is referred to as this web component instance's `host` node.
   3. The parser will then create the inner document content using the text passed into 
      `this.shadowRoot.innerHTML`.
   4. Inside the inner document of the `<green-frame>` component, 
      there is a separate `<style>` for that document, and a `<div>` 
      that wraps around the `<slot>`.
5. When the browser is finished running all its processes to make the two documents, 
   the `main` document and the inner document of the `<green-frame>` host node, 
   it will convert this *multi-document* **DOM** into a single document **flattened DOM**.
6. The browser will then finally render it, by ascribing style to the nodes in this 
   **flattened DOM**, calculating these nodes layout, and then paint them.

## References
 * https://developers.google.com/web/fundamentals/web-components/shadowdom#lightdom
