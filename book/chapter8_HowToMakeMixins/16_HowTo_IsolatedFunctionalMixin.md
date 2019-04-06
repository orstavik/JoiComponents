# HowTo: Isolate functional mixins for web components?

To **isolate** a functional mixin is to decide and clarify which assumptions the mixins can/must
make about its `Base`. Syntactically, the `Base` class can be *any* JS class. But, in practice, 
semantically, the mixin often adds some assumptions about some other properties or methods that the 
`Base` class must include. To make this decision is *to isolate the mixin*.

This decision about what other requirement the `Base` class must conform to is not written in stone.
Often, it is not written down anywhere at all: it is just assumed that the user of the mixin knows
about them. To make reusable functions based on such "insider knowledge" is not a very good practice.
Thus, the "tacit knowing" of how a set of mixins are *isolated* should be written down and 
communicated to its users as part of the API.

## Nesting mixins

Many functional mixins can be combined together on the same element:

```javascript                                               
class MyComponent extends MixinA(MixinB(HTMLElement)) { 
  ...
}
```

The `Base` of MixinA is the product of `MixinB` applied to `HTMLElement`.
This is the main point of functional mixins; they provide a means to implement multiple inheritance.
When making mixins, it is also a good rule of thumb to as far as possible make the order of mixins irrelevant.
This means that `MixinA(MixinB(Base))` and `MixinB(MixinB(Base))` should be functionally equivalent.

The ability to combine our mixins like this, expands the number of classes that can be the `Base` greatly.
Our `Base` must include *both* `HTMLElement` *and* other functional mixins with the same `Base`.

Below, I describe how web component mixins can be *isolated* explicitly in four steps:

## Step 1: Expanding the `Base` to `HTMLElement`

When you are making functional mixins for web components, the `Base` for the functional mixin 
will be either:
1. the `HTMLElement` class, or
2. another class that itself `extends HTMLElement`.

When the `Base` includes `HTMLElement`, all the resources available in the `HTMLElement` 
are available to the functional mixin. This includes:
* `constructor()`,
* lifecycle methods: `connectedCallback()`, `disconnectedCallback()`, `attributeChangedCallback()` ++.
* other methods such as `.attachShadow(..)` and `.addEventlistener(..)`
* and much, much more.

By defining our `Base` element as `HTMLElement` we are adding these rules to our implied assumptions.
We *expanding* our `Base` to include `HTMLElement`.

## Step 2: Constraining the `Base` to `HTMLElement`

Once we have said that the `Base` must be a (sub)class of `HTMLElement`, we also *exclude* most other
JS classes out there. Obviously. We cannot have our cake and eat it too: if we say that the mixin
can use the properties and methods of `HTMLElement`, we cannot at the same time say that the `Base`
can skip these properties and methods if it wants to.

Also, `HTMLElement` has its own "extra" rules that its subclasses must follow. For example:
1. attributes cannot be set in `constructor()`.
2. attributes may not be available in `constructor()`.
3. `disconnectedCallback()` is not triggered when the user closes the window
4. etc. etc.

## Step 3: Constraining the `Base` to ensure compatibility between mixins
To combine several functional mixins together also adds some *constraints* to our `Base`.
Let's look at an example: 
```javascript                                               
function MixinA (Base){
  return class extends Base { 
    connectedCallback(){
      //some important stuff
    }
  }
}

function MixinB (Base){
  return class extends Base { 
    connectedCallback(){
      //more important stuff
    }
  }
}

class MyComponent extends MixinA(MixinB(HTMLElement)) { 
  connectedCallback(){
    //at least useful
  }
}
```

Both `MyComponent`, `MixinA`, and `MixinB` rely on and implement `connectedCallback()`. 
When the element is then connected to the DOM, the `MyComponent.connectedCallback()` is called.
However, if `MixinA` and `MixinB` both rely on their `connectedCallback()` to be run to function 
correctly, then a *constraint* is added to `MyComponent` and `MixinA` that they should call their
`super.connectedCallback()`. The example then looks like this:

```
function MixinA (Base){
  return class extends Base { 
    connectedCallback(){
      super.connectedCallback();
      //some important stuff
    }
  }
}

function MixinB (Base){
  return class extends Base { 
    connectedCallback(){
      //more important stuff
    }
  }
}

class MyComponent extends MixinA(MixinB(HTMLElement)) { 
  connectedCallback(){
      super.connectedCallback();
    //at least useful
  }
}
```
But, there are some problems here:
1. Mixins should be able to be run on their own, ie. MixinA could be applied to HTMLElement directly.
```
class MyComponent2 extends MixinA(HTMLElement) { 
  ...
```
2. The order of mixins should not matter. MixinA could be placed inside MixinB, and it should not matter.
```
class MyComponent3 extends MixinB(MixinA(HTMLElement)) { 
  ...                                                                                  
```

To allow MixinA to be applied both directly to HTMLElement and another mixin that already uses the 
`.connectedCallback()`, a check to see if the connectedCallback method exists on the parent must be added.
This makes MixinA able to handle both HTMLElement and MixinB(HTMLElement) as its base. This same rules must 
then be applied to MixinB. The end result ends up looking like this.
```
function MixinA (Base){
  return class extends Base { 
    connectedCallback(){
      if(super.connectedCallback) super.connectedCallback();
      //some important stuff
    }
  }
}

function MixinB (Base){
  return class extends Base { 
    connectedCallback(){
      if(super.connectedCallback) super.connectedCallback();
      //more important stuff
    }
  }
}

class MyComponent extends MixinA(MixinB(HTMLElement)) { 
  connectedCallback(){
      super.connectedCallback();
    //at least useful
  }
}
```
The `Base` of our web component mixins therefore has the additional contraint that 
"if the mixin overrides one of `HTMLElement`s lifecycle methods, 
the mixin must first check if the superclass has this lifecycle method, and if so call it".
This applies to `.connectedCallback()`, `.disconnectedCallback()`, +++.

## Step 4: Constraining the `Base` using self-imposed restrictions
However, when mixing mixins, the bigger the `Base` of assumption is, the bigger the area of potential
conflicts become and the more taxing on the developers concentration the complexity of the class 
hierarchy becomes. This is especially true for lifecycle methods. Therefore, it is wise to constrain 
the `Base` as much as possible.

Due to the before-mentioned limitations of the HTMLElement constructor, and the lack of a destructor on 
HTMLElement, `.connectedCallback()` and `.disconnectedCallback()` play a crucial role in the lifecycle 
and activity of all HTMLElements. The `Base` for our mixins must therefore include the assumption that
other mixins might use these lifecycle methods. But, apart from these two methods, 
we add the constraint that other mixins do:               
1. *not* implement any other lifecycle methods
2. *not* alter or stop any other events or behavior of the HTMLElement 
without clearly warning the user about this.

## Summary: *Isolated* in IsolatedFunctionalMixins
The `Base` of a functional mixin is the implied assumptions we have about it's constraints and expanded 
properties. In this book, the `Base` of our functional mixins is constrained to:
* HTMLElement or
* functional mixins on HTMLElement that:
   * may or may not implement `.connectedCallback()` and `.disconnectedCallback()`,
   * does not implement any other reactive methods such as `attributeChangedCallback()`, and
   * does *not* alter or stop any other events or behavior of the HTMLElement 
     without clearly warning the user about this.

When the set of constraints is clearly and narrowly defined, the mixins can become more **isolated**.
Outside of the defined constraints, there is little room for conflict.
There are few and clear bindings between the mixin and it's Base.
This means that the mixins can be more freely mixed and are more likely to be used in isolation.
Fewer bindings and implied dependencies also makes the mixins simpler to manage and
enables them to be tested as a unit. The more **isolated** the Base of a set of functional mixins are, 
the more manageable and scalable their use becomes. 
This is why the pattern is called **IsolatedFunctionalMixin**.

Only **IsolatedFunctionalMixins** are needed to trigger **ReactiveMethod** and **EventRecording**. 
Adding a bigger `Base` and additional dependencies for the functional mixins, will likely be too complex
to manage independently by the developer. To lessen that complexity, a custom subclass of 
HTMLElement (cf. PolymerElement) will become prefential, and this shared library must be universally 
applied and creates a universal dependency. It is the intent of this book to avoid any such universal
dependency except a (polyfilled) platform.

## References
* http://justinfagnani.com/2015/12/21/real-mixins-with-javascript-classes/                                                                                               