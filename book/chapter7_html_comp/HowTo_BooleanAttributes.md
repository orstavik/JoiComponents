# HowTo: BooleanAttributes

BooleanAttributes are attributes that are either true or false, on or off.
BooleanAttributes are particularly useful for turning on and off CSS rules. 

To make such a `switch` attribute, the established convention in HTML is to have:
 * true: the attribute is added to the element with an empty value,
 * false: the attribute is removed from the element.
 
In plain HTML you could make two elements with the attribute on and off like this:

```html
<style>
  my-element[switch] {    /*on*/
    background: green;
  } 
  my-element {            /*off*/
    background: red;
  } 
</style>

<my-element id="one" switch>on</my-element>
<my-element id="twoff">off</my-element>

<script >
  const one = document.querySelector("#one");
  one.removeAttribute("switch");                 //turns #one off
  one.setAttribute("switch", "");                //turns #one on again
</script>
```

## Problem: BooleanAttributes in template engines

Template engines such as lit-html or hyperHTML can provide custom functionality that enable the 
developer to *remove an HTML attribute value by passing it the value `false`. For example:

```javascript
let off = false;
hyper.wire`
<my-element switch="${off}">off</my-element>
<my-element switch="${!off}">on</my-element>
`;
```
produces output:
```html
<my-element>off</my-element>
<my-element switch="">on</my-element>
```

But, this functionality is *added* by the template engine.
And, `innerHTML` does *not* support BooleanAttributes in this way.

```javascript
let off = false;
el.innerHTML = `
<my-element switch="${off}">off</my-element>
<my-element switch="${!off}">on</my-element>
`;
```
produces output:
```html
<my-element switch="false">off</my-element>
<my-element switch="true">on</my-element>
```

In `.innerHTML` you should instead use the trinary operator in the string template:

```javascript
let off = false;
el.innerHTML = `<my-element ${off ? "" : "switch"}>on</my-element>`;
```

## References

 * 