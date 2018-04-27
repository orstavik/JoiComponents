# Intro: HTML is list 

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
This example contains a header: "Shoppinglist", and then one item: "Milk".
At the time when I start to write this list, I only know of one item I need: "Milk".
But, after 5 minutes, I remember. I need "Bread" too. Sure thing, lets add that to the list.
```html
<body>
  <h1>Shoppinglist</h1>
  <div><span>Milk</span></div>
  <div><span>Bread</span></div>
</body>
```
The only thing I need to do is simply to add the extra div-item after milk inside the body.
"Of course," you might say, "tell me something I *didn't* already know!"
"Sure," I respond, "but first, I must tell you even more that you already know." 
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
It looks ok. We recognize it. Then, we add "Bread".
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
That cannot be. So we must give that span a role to play in our example. 
To do that we add "Butter" to the same part of the list as "Milk". 
We want "Milk" and "Butter" grouped together since they are positioned beside each other in the store fridge. 
Now lets see how that looks in our HTML list:
```html
<body>
  <h1>Shoppinglist</h1>
  <div><span>Milk</span><span>Butter</span></div>
  <div><span>Bread</span></div>
</body>
```
and JSON list:
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
Wow, wait a minute. Here we see a difference! Here was something new.
In order to add "Butter" next to "Milk" and separat from "Bread", we used the `span` separator.
In HTML we could simply add `<span>Butter</span>` after `<span>Milk</span>`, 
*one* operation.
But, in JSON the `{"span": "Milk"}` was not a child of a list, an array `[]`.
To add "Butter" as a span next to "Milk" we need *two* operations in JSON:
1. change the structure of the `div` holding the "Milk" `span` into an array, and then
2. add the `span` with "Butter".

Now, you might be a bit annoyed with this example. You might find it unrealistic. I agree with you on that one.
You might also be a bit annoyed with this example because I sorted "Butter" with "Milk".
You are thinking loudly: "Hey man, 'Butter' belongs with 'Bread'! 
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
    {"div": 
      [
        {"span": "Milk"}
      ]
    },
    {"div": 
      [
        {"span": "Bread"},
        {"span": "Butter"}
      ]
    }
  ]
}
```
See what I did there? You know I didn't agree with you. I still want "Butter" with "Milk".
But instead of standing up to you, my imagined reader, 
I chose to comply with your barking orders. 
But! I did not like it. Therefore I chose to do as little as possible,
and I did *not* to clean up and remove the array I 
previously put inside the `div` with the "Milk". 
My original idea of sorting "Milk" and "Butter" together can still be traced in the code.
Ahh, my self esteem restored once again through passive aggression. Phu!! Close call that one.

So, what does all this imagined discussion about a simple shoppinglist document show us?
The evolution of the two lists show that while an expandable `list` is something that must be 
**expressed** in JSON as an array, every element in HTML is **implicitly** part of such a `list`.
All HTML elements are children of a list by default. To illustrate this, here is what the list 
would loook like in JSON if we completely replicated the HTML structure:
```json
{
  "body": [
    {"h1": 
      [
        "Shoppinglist"
      ]
    },
    {"div": 
      [
        {"span": 
          [
            "Milk"
          ]
        }
      ]
    },
    {"div": 
      [
        {"span": 
          [
            "Bread"
          ]
        },
        {"span": 
          [
            "Butter"
          ]
        }
      ]
    }
  ]
}
```   

### When to use JSON and when to use HTML?
If I want to think about data as with my JS thinking-hat on, an imperative frame of mind, I would use JSON.
If I want to handle data that I know I will reason about while developing JS code, I would use JSON.

If I want to make static UI components that I want to reason about with a declarative mindset, I would use HTML.
If I do not want to make a cognitive shift into the mode of a JS programmer, I would use HTML.