# Discussion: Why use web components instead of CSS pseudo elements and CSS media queries?

TLDR; Benefits of web components for styling:
* Remove grid/layout/css media queries and css pseudo elements from the global css.
* Modularize gestures and UIX for layout control together with layout.

### 1. media queries per element size, not window size
Most web apps today implement this using CSS media queries. 
But, CSS media queries has its limitation that it only listens to the size of the entire window.
If you have an individual element which you would like to lay itself out differently based on its size,
CSS media queries doesn't really help. Here, you would need to observe the size of the element in 
question and react to `sizeChangedCallback()`. 

### 2. encapsulate css media queries
Even though CSS media queries can complete the task, 
there are benefits to applying the ResponsiveLayout pattern on elements that fill the window size. 
By using a custom element with the ResponsiveLayout on the app window,
all the CSS code needed for responsive layout of the app is encapsulated.
This makes the code simpler to move, strips the layout CSS rules from the often-crowded global CSS styles,
and makes the layout simpler to test and demo independently.

### 3. add complex custom behavior for UIX (such as response to scrolling, gestures etc.)
Often, UIX behavior related to scrolling and gestures to zoom and drag are tightly related to layout.
For example, elements in a given layout might be rearranged by the user dragging them around.
Or, gestures that zoom might affect the size of the element at which it should rearrange itself 
(An element is 100px wide and should change to "small" layout when it is 80px wide. 
The user zooms in 30%. The element readjusts its calculation for when to convert to "small" to 
be 80px*130% and therefore changes its layout to "small").
If both css layout styles *and* such custom UIX behavior should be added to the global scope of the app,
it quickly becomes both very complex and difficult to develop, test, and maintain in combination with 
the rest of the app.

### 4. provide a more familiar, more transparent and more powerful alternative to CSS pseudo elements 
CSS such as :before and :after are... neither pretty nor powerful.
By using shadowDom to hide recurring boilerplate from the rest of the HTML application,
also encapsulated properly in the context where it is relevant, 
developers get a more familiar (dom elements described in HTML),
more powerful (no limitations on where, how many, with attributes, ++ shadowDom elements might be added),
and more transparent (the pseudo elements are visible and can for example be manipulated in dev tools 
alongside other shadowDom elements).


<!--- 
1. Show the "normal", global-css way of doing this.
To illustrate how this pattern would normally be handled, 
the example is also implemented as a normal HTML+CSS demo.
-->