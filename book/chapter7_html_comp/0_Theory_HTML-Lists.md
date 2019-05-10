# Theory: HTMList 

> Do you want to create a single element? Or a list of elements?
> Maybe you don't know yet. Maybe you start with a single element and end up with a list.

## Lists in HTML syntax

When you write a data structure, it might be hard to know if a part of the data you structure 
should be a single item or a list of items.
HTML solves this dilemma by presupposing that every item can be part of a list. 
Lets look at an example:

```html
<body>
  <div><span>Milk</span></div>
</body>
```

This example contains *one* item: "Milk".
And when I start to write this list, this is all I think the list will contain: "Milk".
But, after 5 minutes, I remember. I need "Bread" too. Sure thing, lets add that to the list.

```html
<body>
  <div><span>Milk</span></div>
  <div><span>Bread</span></div>
</body>
```

We simply need to add the extra `<div><span>Bread</span></div>`-item after the 
`<div><span>Milk</span></div>`.
"Of course," you might say, "tell me something I *didn't* already know!"
"Sure," I respond, "but first, I must tell you even more that you already know." 

## Lists in JSON syntax

Let's make and change the same shoppinglist in JSON.
We start with the one `Milk` item.

```JSON
{
  "body": {
    "div": {
      "span": "Milk"
    }
  }
}
```

It looks ok. We recognize it. And then we add `Bread`.

```JSON
{
  "body": [
    { 
      "div": {
        "span": "Milk"
      }
    },
    {
      "div": {
        "span": "Bread"
      }
    }
  ]
}
```

Here something different happens: a new syntactic level was added.
In the first JSON example, the `"body"` contained an object. But, in order to add the `Bread`,
we had to replace the object content of the `"body"` with an array `[` and `]`.
We had to add a new syntactic list level in JSON.
While in HTML the list structure was already there, omnipresent. 

## HTMList benefits

The main annoyance now is the unnecessary `span` nested inside the `div`.
That cannot be. So we must give that span a role to play in our example. 
To do that we add "Butter" to the same part of the list as "Milk". 
We want "Milk" and "Butter" grouped together since they are positioned beside each other in the store fridge. 
Now lets see how that looks in our HTML list:

```html
<body>
  <div><span>Milk</span><span>Butter</span></div>
  <div><span>Bread</span></div>
</body>
```
and JSON list:
```JSON
{
  "body": [
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

In order to add "Butter" next to "Milk" and separat from "Bread", we used the `span` separator.
In HTML we could simply add `<span>Butter</span>` after `<span>Milk</span>`, 
*one* operation.
But, in JSON the `{"span": "Milk"}` was not a child of a list, an array `[]`.
To add "Butter" as a span next to "Milk" we need *two* operations in JSON:
1. change the structure of the `div` holding the "Milk" `span` into an array, and then
2. add the `span` with "Butter".

Now, you might be a bit annoyed with this example. You might find it unrealistic. 
I agree with you.
I sorted "Butter" with "Milk". "Butter" belongs with "Bread".
Its called "bread and butter" for a reason. 
Let us move "Butter" to its "Bread" brother. In HTML:

```html
<body>
  <div><span>Milk</span></div>
  <div><span>Bread</span><span>Butter</span></div>                                          
</body>
```
and JSON:
```json
{
  "body": [
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
In JSON, the problem is not only the two operations needed to turn the `"div"` around `"Bread"` into
a list; In JSON, we also have the task of the list around "Milk" remaining.

## Why HTML lists?

It is easy to view the syntax of HTML and JSON as quite similar from a static standpoint.
If we foresee a datastructure that will not be changed, it makes little difference if we use HTML
or JSON. But. For *dynamic* data structures, ie. datastructures that anticipate change,
the difference grows.

HTML anticipate that elements can be added at every point. Every node is **implicitly** a list.
Every time we add, move and remove nodes from another HTML elements, only the node moved and removed
is altered, *not* the parent node. This is different in JSON.
        
### Why JSON objects?

The drawback of the HTML list syntax is that *all* parent-child relationships are 1:n.
Even if we wanted to, we cannot use HTML syntax to restrict a parent-child structure to 1:1.
This means that we must handle all such 1:1 restrictions as *semantic* constraints.
And there exists several such 1:1 relationships in HTML:
  * an `<html>` element can only contain one `<head>` and one `<body>`. 
  * a `<details>` element should contain one `<summary>` and one list of other content nodes
  
In JSON, we can express 1:1 and 1:n relationships syntactically:

```
{
  "head": ... ,
  "body": ...
}
```

```
{
  "details": {
    "summary": ... ,
    "content": [
       ...
    ]
  }
}
```

## Why care?

When we are making web components, the lack of syntactically restricting HTML elements to 
1:1 relationships becomes problematic. We often have to keep in the back of our minds that
"more than one element *can* be slotted in here or there". All our web components are syntactic
lists. Even when we don't necessarily think of them as such from a semantic standpoint.

The *everything-is-a-list-always* syntax of HTML is not bad per se. It is just different.
And different can be a problem, especially when most of us are used to restricting 1:1 data 
structures syntactically in both:
1. other programming languages such as JS and 
2. in "singular" and "plural" in our natural languages.

HTMList syntax is a problem because it is difficult to imagine and "think in".

Most of the patterns in this part of the book therefore concerns:
 * how to 'think in' HTMList?
 * how to process lists where we 'think about' items?
 * how to semantically restrict 1:1 data structures?

## References

 * 