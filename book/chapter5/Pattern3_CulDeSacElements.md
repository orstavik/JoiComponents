# Pattern: CulDeSacElement (`<img>` and `<input>`)

Some elements should not have children. They simply do not manage to give them any space in their life, 
and would not know what to do with them. If they do get children, they would probably try to just 
place them somewhere they wouldn't be seen or heard from.

`<img>` and `<input>` are two such elements.
As visual elements they plan to use all the visual space themselves.
If you try to add a child to an `<img>` or `<input>` element, 
that child element is put in the DOM, but cannot be seen anywhere on the screen.
They are leaf node elements: visual dead ends in the DOM tree.

However, in a web app as a whole, dead end elements are valuable.
For example, a web app can have several complex graphical units on the page.
It might be a specific type of button with lots bells and whistles, 
a logo with text that is used in many different places, or 
a game graphic with animation.
These graphical units form DOM branches with only a single path connecting it to the rest of the DOM,
a DOM cul-de-sac.

Such CulDeSacElements are useful to take out and separate from the rest of the app.
As there is only one binding between the CulDeSacElement and the rest of the DOM,
making CulDeSacElements of the dead ends greatly helps to clarify the remaining app structure.
This is especially true when the branch repeats itself identically or along highly similar patterns
allowing the same CulDeSacElement to be reused in several places.
But this can also be true for individual dead end DOM branches that are only used once,
because it can avoid confusion and prevent the establishment of unnecessarily complex bindings between elements in the app.

![image of suburbia/cul-de-sac](cul-de-sac-newport-pelican-hill.png "dead ends")

Urban planning uses cul-de-sacs to create safe pockets of slow traffic near houses.
The small dead-end roads cars drive more slowly so children can play in the courtyard.
The traffic inside the cul-de-sac is straightforward. 
The distances are short, so there is no obstacle to making it slow.
And the traffic is low-volume as there are few houses.
At the same time the main roads connecting the cul-de-sac gets fewer inlets.
This creates fewer intersection and allows for higher speed and higher volume of traffic.
So, in principle, everybody wins: kids can play on their tricycles in the courtyards by the cul-de-sac;
while mom and dad can drive hastily to work on the main, connecting roads.

### Example: a graphical CulDeSacElement (with animation?) An image with a custom frame?


## lightDom CulDeSacElements - Keep it light!
However, there are situations where [cul-de-sacs create obstacles](http://chrisnorstrom.com/2011/10/the-great-cul-de-sac-problem-and-how-to-fix-alleviate-it/).
Especially when it comes to CSS.
If you make a CulDeSacElement that uses shadowDom, 
all the elements inside the CulDeSacElement must be given their style via CSS variables, attributes or worse.
This can create long, cumbersome paths in order to similarly style two visually related elements 
that for in the DOM needs to be structured in two separate CulDeSacs.
 
One strategy to alleviate this problem is to place the child elements in the lightDom of the CulDeSacElement, 
instead of in the shadowDom.
This is essentially saying that all CSS cars can drive on the lawn.
And when the JS cars with document.querySelector("") sees the CSS cars driving on the lawns of the houses,
they are likely to follow suit.

However, sometimes it is good to drive on the lawn.
You live in the countryside.
This CulDeSacElement is only used in this app, and you want to organize it as a whole, 
but you will also police that it is only these selected few cars that are allowed to drive on the gras 
between only those selected houses, and all other cars that try to do the same will be severely punished.
If so. Then keeping it light and driving on the lawn is your thing. 
You will personally ensure the safety of the other inhabitants.

