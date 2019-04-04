# Anti-pattern: TwoConstructors

Some argue that as much of the work needed to set up custom elements should be done in 
`connectedCallback()`, and not the `constructor()`. Following this argument, 
the `connectedCallback()` is used as a second, delayed constructor.

The arguments *for* using `connectedCallback()` as a second constructor is that:

1. using `connectedCallback()` instead of the `constructor()` to set up for example the shadowDOM 
   ensures that heavy tasks that are not needed until later are delayed for as long as possible.
   As elements might be constructed ahead of time *before* they are connected to the DOM, thus
   delaying setup tasks until `connectedCallback()` helps spread out work to clear performance 
   bottlenecks.

2. postponing element setup tasks to `connectedCallback()` enables the construction phase to 
   both read and set HTML attributes on the host element at setup time. HTML attributes can
   neither be read nor set on the host element in the `constructor()`, and so by postponing the
   setup until the time when these values have been set, can help the developer avoid doing unnecessary
   work in the constructor that will later be done differently in the `attributeChangedCallback(...)`
   anyway.

However, there are more factors to be considered:

1. Often, we *do* want to delay many tasks associated with web component construction.
   But. Delaying element construction tasks is best accomplished as high as possible in the DOM 
   hierarchy of the app, not inside a general web component oriented towards reuse. Other patterns 
   such as [TemplateSwitcheroo](6_Pattern_TemplateSwitcheroo.md) that work higher up are here *both* 
   more efficient as it delays more tasks *and* give better control of both the timing and (visual) 
   side-effects of delayed web component construction.
   
2. Construction of web components should strive to avoid reading and setting HTML attributes.
   All HTML attributes' default value should be "not set" by default. This is a principle of HTML:
   it promotes cleaner HTML templates where no unnecessary HTML attributes scattered about; and it 
   reduces attribute processing such as `attributeChangedCallback(...)` invocations. 
   Instead of simply moving the setup of the web component to the `connectedCallback()` and establish a 
   second constructor, the developer should therefore instead try to re-design the web component so 
   that it no longer depends on any attributes being read or set during construction.
   
3. HTML attributes that control the display of shadowDOM elements can often be implemented using 
   CSS-based patterns such as `:host([attribute])`. These techniques are *both* less brittle *and* 
   more efficient when attributes are altered dynamically.

4. If reading or setting HTML attributes cannot be avoided, there is still no absolute rule that 
   says setup cannot be performed in `connectedCallback()` or `attributeChangedCallback(...)`.
   Doing setup in `connectedCallback()` as a second constructor can be a good fallback alternative,
   its just not the default pattern when setting up web components.

## References

 * 
