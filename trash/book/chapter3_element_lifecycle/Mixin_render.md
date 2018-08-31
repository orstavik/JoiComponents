# Mixin: Render
![lifecycle with render](lifecycle_render.jpg)
There is a third problem. That if we set the shadowDOM inside an attributeChangedCallback, 
then there will be no triggering of this method when the element has NO attributes set.

## Problem: many events can trigger the rendering of an element

An element is "rendered" when its internal components (shadowDOM or lightDOM) and style is set up.
There are many events that can trigger the rendering of an element:

1. The element is constructed. 
2. An attribute that affects the style of an element changes.
3. when an element is connected to the DOM (or disconnected).
4. The element changes size.

## Problem: many render triggers can occur at the same time

Many events that trigger render can occur almost simultaneously.
In the example below, we create three `ChessBoard` custom elements.
```html
<script>
  class ChessBoard extends HTMLElement {
    constructor(){
      super();
      this.attachShadow();
      this.render();
    }
    attributeChangedCallback(name, oldValue, newValue){
      this.render();
    }
    render(){
      let height = parseInt(this.getAttribute("height")) || 8;
      let width = parseInt(this.getAttribute("width")) || 8;
      let color = this.getAttribute("color") || "black";
      const template = document.createElement('template');
      for (let i = 0; i < height; i++) {
        let row = document.createElement('span');
        template.appendChild(row);
        for (let j = 0; j < width; j++) {
          let square = document.createElement('div');
          square.style.background =(j+i)%2 ? color : "white";
          square.innerText = ".";
          row.appendChild(square);
        }
      }
      this.shadowRoot.appendChild(template.content);
    }
  }
  customElements.define("chess-board", ChessBoard);
</script>
<chess-board id="a"></chess-board>
<chess-board id="b" color="red"></chess-board>
<chess-board id="c" height="4" width="4" color="blue"></chess-board>
```
`chess-board#a` has no attributes. 
At startup, `this.render()` will therefore only be called once from the `constructor()`.
`chess-board#b` has 1 attribute. 
When the parser creates this element, it will therefore trigger `this.render()` twice:
1. in the `constructor()` and 
2. in `attributeChangedCallback()` when the parser sets the `color` attribute to `red`.
`chess-board#c` has 3 attributes. 
When the parser creates this element, it will therefore trigger `this.render()` four(!) times:
1. once from the `constructor()`, but also
3. three times when `attributeChangedCallback()` is called 
once for each attribute `color`, `width`, and `height`.

The problem of triggering the `.render()` method in `chess-board#c` 4 times is that the method is costly.
`ChessBoard.render()` runs *both* a double `for`-loop that creates many div and span elements *and*
adds all those elements to the DOM. We only need the result of the last render, 
so how do we avoid running the `.render()` method until we have all the attributes and only run it once?

## Solution: debounce calls to `.render()`

To only call the `.render()` method once, we need to debounce calls to `.render()`.
This is done by:
1. placing a call to `this.render()` in the `requestAnimationFrame()` que, 
2. flag the element as `.isToBeRendered` while it waits,
3. skip any subsequent calls to `this.render()` while it waits,
4. invoke `this.render()` when the time comes in the `requestAnimationFrame()` que, and
5. then remove the flag `.isToBeRendered`.

Implemented in the `ChessBoard` element, it looks like this:
```html
<script>
  class ChessBoard extends HTMLElement {
    constructor(){
      super();
      this.attachShadow();
      this.isToBeRendered = false;
      if (!this.isToBeRendered)
        requestAnimationFrame(() => this.render());
    }
    attributeChangedCallback(name, oldValue, newValue){
      if (!this.isToBeRendered)
        requestAnimationFrame(() => this.render());
    }
    render(){
      let height = parseInt(this.getAttribute("height")) || 8;
      let width = parseInt(this.getAttribute("width")) || 8;
      let color = this.getAttribute("color") || "black";
      const template = document.createElement('template');
      for (let i = 0; i < height; i++) {
        let row = document.createElement('span');
        template.appendChild(row);
        for (let j = 0; j < width; j++) {
          let square = document.createElement('div');
          square.style.background =(j+i)%2 ? color : "white";
          square.innerText = ".";
          row.appendChild(square);
        }
      }
      this.shadowRoot.appendChild(template.content);
    }
  }
  customElements.define("chess-board", ChessBoard);
</script>
<chess-board id="a"></chess-board>
<chess-board id="b" color="red"></chess-board>
<chess-board id="c" height="4" width="4" color="blue"></chess-board>
```

## Discussion: automatic or manual control of the `.render()` callback

There are two main strategies when making a mixin for the `.render()` callback:

1. the author trigger `.render()` **manually** when needed.
2. the mixin trigger `.render()` **automatically** in the
   1. `constructor()`, 
   2. `attributeChangedCallback()`,
   3. `connectedCallback()`, and
   4. `disconnectedCallback()`.

When the developer trigger `.render()` **manually**, 
he/she must add a call such as `this.queRender()` everywhere in the element 
when a change of the elements state that affect rendering have occurred.

The drawbacks of the manual approach are:
1. many boiler-plate calls to `this.queRender()` in the element code, but mostly that
2. the developer is required to partially manage the timing of the `render()` callback:
   The developer must himself in the element observe when a state change that affects the
   rendered content occurs and himself then `queRender()`.

When the mixin triggers the `.render()` callback **automatically**, 
the `.render()` needs to anticipate that 
it will be called many times when no relevant state change has occured.
This means that the `.render()` method needs to cache the relevant state of its previous 
invocation and avoid changing any content that has not changed since that time.
Template libraries such as HyperHTML and lit-html greatly simplify and reduce 
such state-to-template checking and caching,
but even so, the `.render()` method is likely to run many more times than needed.
To limit the number of times the element would need to render, a StaticSetting could be
put in place to skip render on the given callbacks and attribute names.

Another issue with the automatic trigger approach is that the need to `.render()` 
an element are also likely to occur from other events or custom callbacks such as 
`slotchangedCallback()` and `resizeCallback()`.
To support automatic triggering of `.render()` callback would require 
additional mixins such as `RenderOnSlotchanged` and `RenderOnResize`.

## Todo 
the automatic approach has merit. It is very declerativ, less imperative.
Requires less understanding of when the element needs to be rendered and why.
Combines better with React and other approaches.

## abc





the renderCB is isolated. It depends on nothing but the HTMLElement. And it simply adds a call to the renderCB that will be triggered once a rAF every time the element is constructed or attributeChangedCallback is triggered.
but this might be too heavy.
sometimes you don't need to render in the constructor.
sometimes you want to render in the connectedCallback instead of in the constructor.
sometime you only need to render when certain attributes changes, but not others.
and most likely, you don't need to render everytime even such render-affecting attributes changes, but only when they change past a threshold.
in such instances, instead of having a mixin that always triggers the render, you want to have a mixin where you tell the mixin when a render is needed.
.queRender() or .doRender()
and the accompanying methods .cancelRender() or .abortRender()
maybe we don't need these cancel methods.. maybe we do.
the .doRender() method is also very short, it can be a punchline:
this.willRender || (this.willRender = true, rAF(()=>this.renderCB));
this is the entire mixin, these punchlines that debounces the render calls in a rAF.
ok. This is an alternative to setupCallback. This feels better.
a. It has the debounce strategy builtin.
setupCB doesnt
b. It solves the cloneNode problem without need for custom method. setupCB doesn't.
c. It follows the established patterns of other frameworks. Making code and patterns more transportable. setupCB doesn't.
d. it doesn't have the ugliness of a second constructor. setupCB does.

## Problem spin cycle

One problem with the render approach. You have two custom elements A and B. Both have shadowDom. And both set up their shadowDom in their render method.
B is used inside the shadowDom of A.
Now, when you create A, it will que in raf the render of its shadowDom.
You enter the raf cycle. Then B is created. And B ques its render function in the raf. But as we are now already inside the raf cycle, the creation of B will be in the next raf.
Ok. This means that we must have a mixin global que. That elements that should be rendered are added in this que, and then removed once rendered. This could fix this A then B problem.

Ok. The spin cycle problem.
You two elements A and B.
B is part of the shadowDom of A.
Or just a child of A.
A is an element that has to have even number of children.
B is an element that has to have an even number of siblings. If it doesn't, it will add an extra sibling. If A doesn't have even number children, it will add a sibling.
Ok. The soin cycle starts. A is created and B is added as a child. A detects odd number of children and adds a child.
B then detects odd number of siblings and adds a sibling.
A then detects an odd number of children and adds a child.
B then detects odd number of siblings and adds a sibling.
And around it goes.
This is not really a good example, as adding siblings is bad.
But, if a and b changes their size in ways that affect each other, it might be. Or if a parent changes its dom based on a child it might.
If we use a mixin with a custom render que, such problems can be intercepted. But I'm not sure we want to do that.. We could make it so that if an element is attempted queued twice, then it will be queued in the next raf.. Or attempted queued more than 5 times or something, then it is delayed until next raf..
I need a good example of such a spin cycle. Of such a render to render loop.

Also, such a render loop might be well suited to do the same as the ResizeObserver.. It goes treeOrder, not fifo.
Yes, i am not writing for you to do my work;) i am writing to think out loud.
We should probably just copy the basic concept of the ResizeObserver.. That is simple, and it is the same problemish, and it is easy to implement, and it works ok i think. Top down.
And if then a render is triggered twice, it is done in the next raf.