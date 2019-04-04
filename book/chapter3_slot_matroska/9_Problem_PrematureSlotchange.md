# Problem: PrematureSlotchange

When the browser creates a web component that use another web component in its shadowDOM, 
then the `slotchange` events of the inner web components are triggered *before* the declared DOM
is complete. This means that when some `slotchange` events are triggered, they will run against a
DOM branch that essentially *doesn't exist* from an HTML perspective. We call this the 
PrematureSlotchange problem.

In [Theory: DomNodesAndBranch](7_Theory_DomNodesAndBranch), we discussed the theoretical background
for this problem. In this chapter we will exemplify what it looks like. We start with a slightly
modified version of our `<grand-father>` example.

## Example: `<grand-father>`


```html
<script>
  function log(e){
    const transposedNodes = e.target.assignedNodes({flatten: true});
    let output = "";
    if (transposedNodes.length)
      output = transposedNodes[0].data;
    console.log(this.tagName + ":      " + e.target.tagName + "#" + e.target.id, "      => " + output);
  }

  class GrandFather extends HTMLElement {
    constructor(){
      super();
      this.attachShadow({mode: "open"});
      this.shadowRoot.innerHTML = "<the-father><slot id='grandFather'></slot></the-father>";
      this.shadowRoot.addEventListener("slotchange", log.bind(this));
    }
  }
  class TheFather extends HTMLElement {
    constructor(){
      super();
      this.attachShadow({mode: "open"});
      this.shadowRoot.innerHTML = "<the-child><slot id='father'></slot></the-child>";
      this.shadowRoot.addEventListener("slotchange", log.bind(this));
    }
  }
  class TheChild extends HTMLElement {
    constructor(){
      super();
      this.attachShadow({mode: "open"});
      this.shadowRoot.innerHTML = "<slot id='child'></slot>";
      this.shadowRoot.addEventListener("slotchange", log.bind(this));
    }
  }
  customElements.define("grand-father", GrandFather);
  customElements.define("the-father", TheFather);
  customElements.define("the-child", TheChild);
</script>

<grand-father>matroska</grand-father>


<h3>Explanation: </h3>
The flattened DOM looks like this:
<pre>
...
  < grand-father >
    #shadowRoot
      < the-father >
        #shadowRoot
          < the-child >
            #shadowRoot
              < slot#child >
                < slot#father >
                  < slot#grandFather >
                    matroska
</pre>

Constructing this DOM produces six logs:
<pre>
THE-CHILD:      SLOT#father       => 
THE-FATHER:     SLOT#father       => 
THE-CHILD:      SLOT#child        => 
THE-CHILD:      SLOT#grandFather  => matroska
THE-FATHER:     SLOT#grandFather  => matroska
GRAND-FATHER:   SLOT#grandFather  => matroska
</pre>

A view of the DOM in which the three slotchange events are executed.

<pre>
                         in-complete DOM                              completed DOM
  < grand-father >                           § < grand-father >                     _
    #shadowRoot                              §   #shadowRoot                         *6
      < the-father >                   _     §     < the-father >                   |
        #shadowRoot                    *2    §       #shadowRoot                     *5
          < the-child >                |  _  §         < the-child >                |
            #shadowRoot                *1 *3 §           #shadowRoot                 *4
              < slot#child >           |  ^  §             < slot#child >           |
                < slot#father >        ^     §               < slot#father >        |
                  < slot#grandFather >       §                 < slot#grandFather > ^
                    ""                       §                   matroska          
</pre>

<ol>
  <li>
    When log 1, 2, and 3 run, the DOM is in a temporary state. 
    The grand-father element is created, but it does not have any child nodes yet: 
    the "matroska" text node is not yet registered as its child.
    This means that when the log functions run assignedNodes({flatten: true}), it is empty.
  </li>
  <li>
    When log 4, 5, and 6 run, the DOM is completed. The "matroska" text node is now registered
    as a child of the grand-father host element, and the assignedNodes({flatten: true})
    return the anticipated result "matroska".
  </li>
</ol>
```

## `slotchange` triggered on incomplete DOM branches

When the `<grand-father>` element is declared, its constructor creates a second web component, 
`<the-father>` in its shadowDOM. `<the-father>` in turn creates a third web component in its shadowDOM,
`<the-child>`. At *the same time* a text node child "matroska" is declared a child of the 
`<grand-father>` element.

From the perspective of HTML, these operations *all* happen *at the same time*. They are
instantenous, declaratively synchronous. From the perspective of HTML, it therefore *never* exists 
a DOM branch that looks like this: 
```
<grand-father></grand-father>
```
but only a DOM branch that looks like this:
```
<grand-father>matroska</grand-father>
```
However, the first *two* `slotchange` events are dispatched at a time when "matroska" is not a child 
of the `<grand-father>` element. The first two `slotchange` events occur at a time that doesn't exist
in the world of HTML. 

One might argue that this context *do* exist in JS time. And practically, as `slotchange` currently
function, one would of course be correct. It does. 
But. This is wrong. No DOM branch reaction should be triggered based on a DOM branch that does not
exist in *both* HTML and JS time. Web component reactions, ie. DOM node reactions, *can* trigger at 
such temporary stages because they *should not* rely on data from the temporary, incomplete DOM 
branches. The state of the surrounding DOM *should not* matter to them, and therefore they can be run
earlier. But `slotchange` is a DOM branch reaction. It relies on data about the DOM branch context
that surrounds it. And therefore it *should not* be run until this DOM branch context is complete
*both* in HTML and JS time.

The solution to this problem is to *delay* the reactions of `slotchange` event listener until the 
earliest, appropriate point when the DOM branch is complete both from an HTML and JS perspective.
In later chapters about the `slotCallback`, I will do just that.

## `<script>` trigger `slotchange` events too

There is another way to trigger `slotchange` events to be dispatched prematurely: `<script>`s.
Below is an example to illustrate how and when.

## Example: ScriptTriggerSlotchange

```html
<script>
  class GreenFrame extends HTMLElement {

    constructor(){
      super();
      this.attachShadow({mode: "open"});
      this.shadowRoot.innerHTML =
        `<style>
          div {
            border: 10px solid green;
          }
        </style>
        <div>
          <slot>This is life!</slot>
        </div>`;

      const slot = this.shadowRoot.children[1].children[0];
      this.shadowRoot.addEventListener("slotchange", function(){
        console.log(slot.assignedNodes({flatten: true}));
      });
    }
  }
  customElements.define("green-frame", GreenFrame);
</script>

<green-frame>
  <script>theSunIsShining();</script>
  <pre>¯\_(ツ)_/¯</pre>
  <script>takeABreak;</script>
  <pre>  |   | </pre>
  <script>relax;</script>
  <pre>  | 6 | </pre>
  <script>putYourFeetUp;</script>
  <pre>   === </pre>
  <script>enjoyLife;</script>
  <pre>  |   | </pre>
  <script>letSomeOneElseDoTheJob();</script>
  <pre>  | | | </pre>
  <script>tomorrow === aNewDay;</script>
  <pre>   ^ ^ </pre>
</green-frame>
```

## References

 * 