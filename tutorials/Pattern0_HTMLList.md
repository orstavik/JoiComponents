# Pattern 0: HTML is always a list

Do you want to create a list of elements? Or maybe just create a single element? 
Or, maybe you don't know yet. Maybe the element might be one of many in the list, 
or it might be independent?

When writing data structures, it might be hard at the time of creation to know if
the element you write will be one of several or stand alone.
The basic syntax of HTML is designed to solve this dilemma. This is why
HTML presupposes that everything is a list. Lets look at an example:

```html
<body>
  <h1>Shoppinglist</h1>
  <div><span>Milk</span></div>
</body>
```
This example contains a header: "Shoppinglist", and then one item: "milk".
At the time when I start to write this list, I only know of one item I need.
But, after 5 minutes, I remember. I need bread. Sure thing, lets add that to the list.
```html
<body>
  <h1>Shoppinglist</h1>
  <div><span>Milk</span></div>
  <div><span>Bread</span></div>
</body>
```
The only thing I need to do is simply to add the extra div-item after milk inside the body.
"Of course", you might say, "tell me something I *didn't* already know!"
"Sure", I say, "but first, I must tell you even more that you already know." 
Let's look at how this list would have been made, and then changed, in JSON.
We start from the beginning, with our list of one item.

```JSON
{
  "body": [
    {"h1": "Shoppinglist"},
    {"div": 
      {"span": "Milk"}
    }
  ]
}
```
It looks ok. We recognize it. Then, we add bread:
```JSON
{
  "body": [
    {"h1": "Shoppinglist"},
    {"div": 
      {"span": "Milk"}
    },
    {"div": 
      {"span": "Bread"}
    }
  ]
}
```
Again. Not much difference. The only annoyance being the unnecessary `span` nested inside the `div`.
So. Let's give that span a role in our example: we add "Butter" to the same part of the list 
as "Milk", as both reside in the same refrigerator in the store. Now lets do that with our lists in HTML:
```html
<body>
  <h1>Shoppinglist</h1>
  <div><span>Milk</span><span>Butter</span></div>
  <div><span>Bread</span></div>
</body>
```
and JSON:
```JSON
{
  "body": [
    {"h1": "Shoppinglist"},
    {"div": 
      [
        {"span": "Milk"},
        {"span": "Butter"}
      ]
    },
    {"div": 
      {"span": "Bread"}
    }
  ]
}
```
Now, there we see a difference! In order to add "Butter" next to "Milk" and separat from "Bread", 
the children of the first div in JSON must be wrapped as an array `[]`.
In HTML we can simply add `<span>Butter</span>` after `<span>Milk</span>`, 
absolutely no other changes necessary.
But, in JSON the `{"span": "Milk"}` was not already wrapped in an array, and 
therefore we need to do two operations in JSON: 
1. change the structure of the div holding the "Milk" span into an array, and then
2. add the span with the butter.

Now, some of you might be a bit annoyed with this example. Not because it is unrealistic, but 
because I sorted "Butter" with "Milk" based on their position in the store.
You might already have shouted at the screen: "Hey man, 'Butter' belongs with 'Bread'! 
Its called 'bread and butter' for a reason!". Sure. My mistake. I am sorry!
Let me just quickly fix the example and move "Butter" to its "Bread" brother. In HTML:
```html
<body>
  <h1>Shoppinglist</h1>
  <div><span>Milk</span></div>
  <div><span>Bread</span><span>Butter</span></div>                                          
</body>
```
and JS:
```json
{
  "body": [
    {"h1": "Shoppinglist"},
    {"div": [
      {"span": "Milk"}
    ]},
    {"div": [
      {"span": "Bread"},
      {"span": "Butter"}
    ]}
  ]
}
```
See what I did there? Instead of standing up to you, my own imagined reader, 
I choose to comply with your order and do as you tell me. But! I refused to do the extra task 
of cleaning up the div with the Milk and left the array structure there intact from the previous action.
Ahh, my self esteem restored once again through passive aggression. Phu!! Close call that one.

So, what does all this imagined discussion about a simple shoppinglist document, 
written in HTML and JSON, show us? The example above shows that while the concept of a `list` 
is something that must be **expressed** in JSON, every element in HTML is **implicitly** part of a list.
All HTML elements are list items by default. And completely translated from HTML to JSON, the 
example above would end up looking like this:
```json
{
  "body": [
    {"h1": [
      "Shoppinglist"
    ]},
    {"div": [
      {"span": [
        "Milk"
      ]}
    ]},
    {"div": [
      {"span": [
        "Bread"
      ]},
      {"span": [
        "Butter"
      ]}
    ]}
  ]
}
```                        
### Why is the implied list structure of HMTL important?


### When to use JSON and when to use HTML?
If I want to think about data as with my JS thinking-hat on, an imperative frame of mind, I would use JSON.
If I want to handle data that I know I will reason about while developing JS code, I would use JSON.

If I want to make static UI components that I want to reason about with a declarative mindset, I would use HTML.
If I do not want to make a cognitive shift into the mode of a JS programmer, I would use HTML.