# Pattern: RomanNumberAttributeValue

> Why cannot HTML attributes be queried as numbers? Why not make some expressions that would
> try to match an attribute value with a numeric expression? Why? Why??

When automatically generating HTML attributes, an oft recurring problem is how to process number values.
In the previous chapter we saw how steps is one way to solve this problem. But, although necessary,
predefined steps is not always the best solution. Another solution is.. to go back 2000 years in the
development of mathematics. When in Rome, do as the Romans. When setting numeric value on an HTML 
attribute, use addition-only Roman numerals.

## The rules of RomanNumberAttributeValue.

 * Only *one* Roman numeral per attribute.
 * Only *integer values*.
 * The Roman numeral always *begins* the attribute string value (no whitespace in front). 
 * The Roman digits are in ALL CAPS, ALWAYS.
 * No whitespace between the Roman digits.
 * The Roman numeral is concluded with a dot `.`.
 * Only use Roman numeral additions, **NO Roman subtraction**!
 * *After* the Roman numeral you can write what you want with whitespace and small letters.
   no capital letters as they might be mistaken for digits.
 * Zero don't exist. It is just `.`.
 * Positive numbers are prefixed with `+`.
 * Negative numbers are prefixed with `-`.
   
The value of the Roman digits:
 * `M` = 1000, 
 * `D` = 500, 
 * `C` = 100, 
 * `L` = 50, 
 * `X` = 10, 
 * `V` = 5, 
 * `I` = 1, 

This means that the following numbers would be:
 * `1024` : `+MXXIIII.`
 * `1280` : `+MCCLXXX.`
 * `-7` : `-VII.`
 * `-999` : `-DCCCCLXXXXVIIII.`

## HowTo: select RomanNumberAttributeValues

Below is a description of how Roman numerals can be selected using CSS selectors (and querySelector).

To select an attribute that:
 * is a Roman numeral:
    * `[att^="+"], [att^="-"]`
 * equals an exact number (`==`), use the `^=` operator:
    * `att == 1280` is `[att^="+MCCLXXX."]`
 * does not equal an exact number (`!=`), use the`:not()` and `^=` operator: 
    * `att != 1280` is `:not([att^="+MCCLXXX."])`
 * is bigger than or equals a number (`>=`), use the `*=` operator several times: 
    * `att >= 1280` is `[att^="+MCCLXXX"], [att^="+MCCC"], [att^="+MD"], [att^="+MM"]`
    * `att >= 3` is `[att^="+M"], [att^="+D"], [att^="+C"], [att^="+L"], [att^="+X"], [att^="+V"], [att^="+III"]`
    * `att >= 3` is also `[att^="+"]:not([att^="+II."]):not([att^="+I."])`
 * is less than or equals a number (`<=`), use the `*=` and `:not()` operator several times: 
    * `att <= 1279` is `[att^="-"], [att^="+"]:not([att^="+MCCLXXX"]):not([att^="+MCCC"]):not([att^="+MD"]):not([att^="+MM"])`
    * `att <= 3` is `[att^="-"], [att^="+I"]:not([att^="+IIII"])`
 * Numeric interval: `640 <= X <= 1279`:
   `[att^="+DCXXXX"], [att^="+DCL"], [att^="+DCC"], [att^="+M"]:not([att^="+MCCLXXX"]):not([att^="+MCCC"]):not([att^="+MD"]):not([att^="+MM"])`

1. When you ask for less than or equals, 
   it is simpler if your numbers end with 4, 9, 49, 99, 499, 999, etc.
2. When you ask for bigger than or equals, 
   it is simpler if your number end with 0, 5, 10, 50, 100, 500, 1000.

## Example: 

```html
<style>
  [att*="DCC"], [att*="M"] { /*att >= 700*/
    color: gold;      
  }
</style>

<div att="MCCVXXX">I'm 1280</div>
<div att="DCXXXX">I'm 640</div>
<script ></script>
```

Roman numerals CSS selectors are ugly. Heck, Roman numerals are ugly. 
That is why people chose the beautiful zero-based Indian numbers way back in the good old Roman days.

## 1. Function: `convertToRoman(integer)`

### 1. Function: `convertToRoman(integer)`

Function that converts an integer to a Roman numeral as specified above.

### 1. Use a sibling attribute to automate the roman value of a numerical value

Best strategy. Use a parallel attribute.

you have an attribute `width`
you make a parallel attribute `width-roman`
Every time `width` changes, you:
1. create an `attributeChangedCallback("width", oldValue, newValue)`
2. convert newValue to a `romanNumeral,
3. `setAttribute("width" + "-roman", romanNumeral)` 

## 2. Selector side 

### 2. Function: 

`romanIntervalSelector(selectorPrefix, attributeName, bigger, smaller)`
`romanGreatThanSelector(selectorPrefix, attributeName, smaller)`
`romanLesserThanSelector(selectorPrefix, attributeName, bigger)`
`romanEqualsSelector(selectorPrefix, attributeName, equals)`

Functions that automatically creates a selector for a romanIntervalSelection as specified above.

### 2. 

How to automate such selectors.. 
Must it be done via JS? 
Is there no way to make it a global function?
Can it be solved together with CSS colorCalc functions such as `hslCalc(color, a,b,c,d)`?


## References

 * [MDN: Attribute selectors](https://developer.mozilla.org/en-US/docs/Web/CSS/Attribute_selectors)