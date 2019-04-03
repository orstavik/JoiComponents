# Problem: SlotchangeSurprise

First, some facts. In SlotMatroskas:

1. `slotchange` events propagate in the flattened DOM.
2. `slotchange` events propagate across shadowDOM borders.
3. `slotchange` events propagate cross shadowDOM borders **down** the normal DOM hierarchy.
4. If you in a SlotMatroska add event listeners on the `.shadowRoot` of your web components, 
   then these listeners will be processed in reverse document order, inside-out.
5. If you in a SlotMatroska add the event listener on chained `<slot>` elements, 
   then these listeners will be processed in normal document order, outside-in.
6. If you add event listeners for `slotchange` events *anywhere* in a web component, 
   this event listener will capture *both* its own `slotchange` events *and* 
   `slotchange` events that arise in chained `<slot>` elements from lightDOM web components. 
7. `slotchange` events that arise within a web component inside your web component shadowDOM
   will not trigger a `slotchange` reaction. These `slotchange` events will be blocked by the
   `composed: false` property of `slotchange` events. Thank God.
   
## Example: `<the-father>`

```html
<script>
  function log(e) {
    console.log(this.tagName, e.target.tagName + "#" + e.target.id);
  }

  class TheFather extends HTMLElement {
    constructor() {
      super();
      this.attachShadow({mode: "open"});
      this.shadowRoot.innerHTML = "<the-child><slot id='father'></slot></the-child>";
      this.shadowRoot.addEventListener("slotchange", log.bind(this));
    }
  }

  class TheChild extends HTMLElement {
    constructor() {
      super();
      this.attachShadow({mode: "open"});
      this.shadowRoot.innerHTML = "<slot id='child'></slot>";
      this.shadowRoot.addEventListener("slotchange", log.bind(this));
    }
  }

  customElements.define("the-father", TheFather);
  customElements.define("the-child", TheChild);
</script>

<the-father>matroska</the-father>


<h3>Explanation: </h3>
First, the flattened DOM looks like this:
<pre>
...
  < the-father >
    #shadowRoot                   * slotchange listener
      < the-child >
        #shadowRoot               * slotchange listener
          < slot#child >
            < slot#father >
              matroska
</pre>

Take note of two things:
<ol>
  <li>
    The slot elements appear in reverse document order.
  </li>
  <li>
    The slotchange event listeners are attached to the #shadowRoot of each element.
    This causes the inner web component to be triggered first and then the outer web component.
  </li>
  <li>
    If the slotchange event listener were attached to the slot elements instead,
    then they would run in reverse document order.
  </li>
</ol>

Creating this DOM produces three logs:
<pre>
THE-CHILD  SLOT#child
THE-CHILD  SLOT#father
THE-FATHER SLOT#father
</pre>

<ol>
  <li>
    The first log output comes from slot#father being transposed into slot#child.
    The event start bubbling from the slot#child, is then caught by the event listener on the-child#shadowRoot,
    and finally stopped by the border between < the-child > host element and its #shadowRoot.
    <pre>
...
  < the-father >
    #shadowRoot
      < the-child >                        _
        #shadowRoot                        *1
          < slot#child >       slotchange  ^
            < slot#father >
              matroska
</pre>
  </li>
  <li>
    The second and third log output is produced by the same(!) slotchange event.
    The event occurs when the "matroska" text node is being transposed into slot#father.
    The event then bubbles up, and because it is "composed: false", it is stopped by the border
    between the-child and its #shadowRoot. However, because the slot elements remain in the flattened
    DOM in reverse document order as a SlotMatroska, the slotchange event listener on both the
    the-father and the-child element are triggered. Producing two outputs.
    <pre>
...
  < the-father >                       _
    #shadowRoot                        *3
      < the-child >                    |
        #shadowRoot                    *2
          < slot#child >               |
            < slot#father > slotchange ^
              matroska
</pre>
  </li>
</ol>
```

An important takeaway from the example above is that `<the-child>` web component triggers *two* 
`slotchange` reactions. The example above explains *why* this problem occurs. And from the 
perspective of `<the-father>` web component, it might be known that `<the-child>` web component will
receive *two* `slotchange` events during construction. But, the developer of `<the-child>` web 
component has no idea if its used directly in the main document or by another web component.
The `<the-child>` web component has *no idea how many `slotchange` events it will receive during 
construction*. The "extra" `slotchange` events are SurpriseSlotchange events.

All this behavior is *very* strange. `slotchange` events with `composed: false` bubbling past 
shadowDOM borders triggering event listeners in several different web components in both inside-out 
and outside-in order. And, you will receive several extra `slotchange` notifications inside
nested web components. It can make your head spin. And it will. Fast. For a long time.

In the last example, we will scale the example above one layer. We will add the `<grand-father>`.

## Example: `<grand-father>`

```html
<script>
  function log(e){
    console.log(this.tagName, e.target.tagName + "#" + e.target.id);
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
THE-CHILD    SLOT#father
THE-FATHER   SLOT#father
THE-CHILD    SLOT#child
THE-CHILD    SLOT#grandFather
THE-FATHER   SLOT#grandFather
GRAND-FATHER SLOT#grandFather
</pre>

<ol>
  <li>
    Log 1 and 2 are the same slotchange event, ie. slot#grandFather being transposed to slot#father.
  </li>
  <li>
    Log 3 is the innermost slotchange event, ie. slot#father being transposed to slot#child.
  </li>
  <li>
    Log 4, 5, and 6 is the final slotchange event, ie. "matroska" being transposed to slot#grandFather.
  </li>
</ol>

<pre>
...
  < grand-father >                                 _
    #shadowRoot                                    *6
      < the-father >                      _        |
        #shadowRoot                       *2       *5
          < the-child >                   |    _   |
            #shadowRoot                   *1   *3  *4
              < slot#child >              |    ^   |
                < slot#father >           ^        |
                  < slot#grandFather >             ^
                    matroska
</pre>
```

In the above example, the `slotchange` listeners are triggered: 3 x the-child, 2 x the-father, 
1 x grand-father. Principally, as `<the-child>` web component might be made by some outside developer,
`<the-child>` web component has no way of knowing how many times its `slotchange` event listeners
will trigger during construction.

## References

 * 