# Pattern: KeepItLight - app-specific, lightDOM elements

If you are writing a web app, not all of your elements can or should be reusable.
Some of your elements might be tightly connected with your particular app's logic, style, 
datasources and other app-specific features.
If you try to make such elements reusable, you are only adding extra futile work for yourself.
So, keep it simple, and embrace the app-specificity for a handful of your elements in your app.

When you are making such an app-specific element, it is likely that these elements are tightly 
connected with each other:
1. They share styles such as a color palette, fonts, borders, shadows, etc.
2. They share access to the same business layer API such as a single state store.
3. They know about each other one way or the other.

How the app share access to each other (3) and the business layer API (2) is up to the app developer.
This should happen in JS by passing properties, setting global variables, etc.
However, how the app-specific elements share styles such as a color palette, 
should not be considered 

There are two options here:
1. we can keep things light and share a style sheet in the app.
2. we can set up a style sheet with mainly css variables, and 
then map these variables inside the shadowDom of the element.

Benefits of keeping things light is that your app becomes easier to view in devtools. 
However, you can get implicit bindings such as querySelector for things inside another custom element.
You should only have a significant lightDom template on one level, but strategy 1 can split this 
lightDOM across several different components.

App-specific elements form a kind of  

