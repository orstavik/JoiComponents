# Pattern: JsonAttributes

All attributes in HTML elements are `strings`. 
Use JsonAttributes to pass other simple or complex data types such as numbers, arrays and objects.

A JsonAttribute is simply an HTML attribute that *should* contain a string with JSON-stringified data.
To put data into the JsonAttribute, you either write it in directly as Json, or encode it using
`JSON.stringify(...)`. To use data from the JsonAttribute, you decode it using 
`JSON.parse(attributeValue)`.

## Example: AndOne
```html
<script>
class AndOne extends HTMLElement {
  
  static get observedAttributes(){ 
    return ["number"];                         
  }
  
  constructor(){
    super();
    this.attachShadow({mode: "open"}); 
  }
                                      
  attributeChangedCallback(name, oldValue, newValue){ 
    if(name === "number") {                             //this check can be skipped
      const trueNumber = JSON.parse(newValue);
      this.shadowRoot.innerText = trueNumber + 1;
    }
  }
}
customElements.define("and-one", AndOne);
</script>
<and-one number="5"></and-one>
```
which will display: `6`.

## Example: WordArray
```html
<script>
class WordArray extends HTMLElement {
  
  static get observedAttributes(){ 
    return ["words"];                         
  }
  
  constructor(){
    super();
    this.attachShadow({mode: "open"}); 
  }
                                      
  attributeChangedCallback(name, oldValue, newValue){ 
    if(name === "words") {
      const words = JSON.parse(newValue);
      this.shadowRoot.innerText = words.join(' ');
    }
  }
}
customElements.define("word-array", WordArray);
</script>
<word-array words="['Hello','sunshine!']"></word-array>
```

which will display: `Hello sunshine!`.

## Example: SettingsAttribute
```html
<script>
class SettingsAttribute extends HTMLElement {
  
  static get observedAttributes(){ 
    return ["settings"];                         
  }
  
  constructor(){
    super();
    this.attachShadow({mode: "open"}); 
  }
                                      
  attributeChangedCallback(name, oldValue, newValue){ 
    if(name === "settings") {
      const settings = JSON.parse(newValue);
      let txt = "";
      for (let keyValue of Object.entries(settings)) {
        txt += keyValue[0] + ": " + keyValue[1] + "\n"; 
      }
      this.shadowRoot.innerText = "<pre>" + txt + "</pre>";
    }
  }
}
customElements.define("settings-attribute", SettingsAttribute);
</script>
<settings-attribute settings="{'S': 0, 'M': 600, 'L': 1024}"></settings-attribute>
```

which will display: `Hello sunshine!`.

## Anti-pattern: MySpecialWayJustThisOnce

When passing complex data as strings *into* and *out of* a web component,
you need to:
1. encode it (or write it down by hand) and 
2. decode it (and read it).

To do so is not difficult. In fact, it can seam misleadingly simple:
 * A web component needs an attribute "of words separated by comma". 
   No problem, we simply always do `str.split(",")` when we read the attribute value. 
 * Another web component needs a list of numbers.
   Again, no problem. We list them as numbers separated by bar: `123|456|666`. 

We do it "my special way, just this once". We have all been there, we have all done it. 
And we all still do it again and again.

But, the problem with MySpecialWayJustThisOnce is that the use-case around a component has a tendency
to change. Not only when it is reused in a different app. Suddenly:
 * many different components with many different syntactic rules for encoding and decoding simple and/or
   complex attribute values are used side by side. Now, the rules of one attribute might get confused
   with another.
 * during development, one of the words in a "list of comma separated words" contains itself a comma.
   As one word become a quote, and the "list of comma separated words" becomes a "list of comma separated 
   quotes".
 * the data input in the attribute is no longer written by hand, but generated from machine data in 
   the context of use. There are now at least two co-dependent algorithms: one for decoding in the web 
   component itself and one (or more) for encoding in the context(s) of use.

MySpecialWayJustThisOnce is perfectly fine in the beginning. The problem *can* arise as the web 
component and attribute proliferate in good, but unforeseeable ways.

There is no way to avoid the co-dependency between the algorithms of encoding and decoding when 
passing non-string data values as HTML attribute strings. But, there is a way to generalize this 
dependency, reducing potential conflicts. And that is to use JSON, the universal way to pass 
string-encode data between objects on the web.

## References

 * 