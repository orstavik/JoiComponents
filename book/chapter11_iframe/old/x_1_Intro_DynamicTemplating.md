# Intro: DynamicTemplating

To dynamically load a template essentially means to:
1. from within javascript, either loaded as a file or inline in a `<script>` tag,
2. take a `string` with HTML text and
3. load it into the DOM.

You have an HTML document. Let's call it `spa.html`, but in you project it is likely called `index.html`.
This HTML document has a JS script that will add some HTML fragment to the view when the user clicks
on a button or link (in the menu) on the main page.
This text that makes up this HTML fragment the script might for example get from an AJAX request.

Ok, so in the script in your main HTML document, you have two things:
1. the DOM
2. a string with HTML code, here `stringWithHTML`.

## When: is DynamicTemplating done?

DynamicTemplating is done at many different times during a web apps lifecycle:

1. At startup, both web apps load HTML content as JS strings, and not as HTML template.
   There are many reasons why this is a practical, if not theoretical necessity. 
   
   1. Only one HTML file can be loaded directly in the browser. This means that *all HTML code that
      you want to load as HTML code* must be added into the *single* entry point HTML file.
      Even for small apps, that would be *one big* index.html!
   
   2. The HTML file you are accessing might get its initial data from many different sources and 
      databases. Even though you are getting the front page of a weather web site,
      the data that *drives* the template might be collected both from a) a static source directory,
      b) a database of weather information and c) a database of user preferences.
      If all this data had to be cooked together into one page, that would be *one, big* index.**php**.
      The reason we don't want to do this is that such weather web sites can have millions of users download
      their pages every hour. Now, if the initial page setup and composition is done on each users' browser,
      then that work would be split up and spread across millions of processors; if the initial page setup
      and composition is done on the server, then the millions of individual tasks is done on one poor
      overloaded expensive server processor. And that is why web developers in the 2000s *fled from 
      php to js* en mass.
      
      But, if the entry point HTML file that the user gets on his first round trip to the server 
      is *too* empty, then the web app has nothing to show the user until *after* he has gotten
      back to the server for the *second* round trip. That is why web apps today try to find some middle
      ground. A weather web site might for example keep a reservoir of one hundred of generic index.html
      files based on current weather data for one hundred different geographic areas, a list that its server
      updates once every 5 minutes, and then pass the user one of these index.html files based on its 
      guesstimate of the users location based on the return IP address. This would mean that the web site 
      could present some likely relevant data to its users immediately, while it gets the highly 
      individualized and context specific data within the next second from the second round trip.

2. At startup, in web comps. As HTML imports was rejected in favour of ES6 imports, the HTML template 
   of web components' shadowDOM are loaded dynamically.

3. In use, after startup. User interaction or external data sources adds data that needs to add DOM
   elements. Often, this data is simpler and faster to install into the app directly as HTML template.

I would venture the following hypothesis: When most web developers "think about" dynamic templating, 
we think about # 3: loading extra html template while the app is already up and running. However, 
when most web developers *do* dynamic templating, we *do* #1 and #2: add HTML template based on JS 
strings at startup. 

## How: is dynamic templating done?

HowTo: add a string of HTML to the DOM?
Now, add the HTML code to the DOM, you have some options.

1. use a template engine, such as lit-html or hyper. This will add the template you pass it 
   efficiently, directly into the DOM proper. These template engines typically assumes things 
   such as:
   1. the template you add is completely safe. You are using the template engine to add HTML template
      at startup, and you are the author of both the app and the template, and no external sources 
      can *contribute to* the template before it is loaded. The template loaded will therefore have
      all the rights in your apps, all scripts being added will run in full.
   
   2. the template you add is completely unsafe. The template engine adds HTML template
      from an external source, either the user or a third party database. Template loaded are therefore
      completely stripped of as many rights as it possibly can. (However, to remove all scripts is very 
      difficult! One thing is to strip out all js, that is doable. But, loading images from CSS can also
      be used as a script in coordination with the server. Thus, to *strip* out all "scripting" mechanism 
      means to both block JS *and* loading of web components (of course) *and* all images and url's in both
      HTML and CSS, and that is *far more* obtrusive than one might first suspect).
     
   *  The template are therefore mostly used for "same origin" data sources. For more on third party 
      HTML, read more about Google's AMP for example.
      
    * Sandboxing is the pattern of securing that one part of the DOM will not be able to steal state or
      data from another part of the DOM. It is not simple. And if you need it, you only really have the 
      choice of using an `<iframe>`.

2. make a `<div>` and set `.innerHTML = stringWithHTML`. 

   1. To do this, you need to REALLY know and trust what is in your stringWithHTML as any `<script>`
      inside it will be able to access all the script resources of the main document.

   2. Also, any `<style>` in the added piece of HTML will leak out into the main document.

   3. The browsing context will be the same for both the main DOM and the added DOM. 
      This means that URLs in for example `<a href="relative/link.html">` or 
      `<img src="anotherGallery/image.jpg">` will be interpreted against the *same* `<base>` URI
      as your main document. This can in some rare occasions be true, but most often HTML fragments
      are intended to be used from in many different main documents, and then all such relative 
      links will break down.
   

2. make a web component with a shadowRoot, and add the 
   1. same as above
   2. the style will be separated
   3. same as above
   
3. make an `<iframe>` and set its `srcdoc` attribute.
   1. Here, you can really control the script code. You can sandbox it, heavily.
   2. Styles do not leak at all, not even CSS variables.
   3. Here, you can set a separate base for the `<iframe>` and the main document.
   4. You can get the inner size of the `<iframe>`

## Problem: what to worry about when adding HTML to the DOM?

When you load html script, you need to worry about the encapsulation of:

1. the dom nodes (maybe you need to ensure that wrapper or wrapped scripts cannot read the "content" of each other). The content includes such parameters as size and layout, as content indirectly can be inferred from it. Iframe can achieve this. 

2. Style. Should style be able to pass between the html template added and the html template adding? And if so, how and when and why? Iframe blocks both completely. ShadowDom blocks all but ::slotted and :host and - -css-variables.

3. Scripts. Can they read each other's state? Can they access all methods/all api? Iframe support such limitations. But, template engines such as lit and hyper can also manually restrict the scripts. But this is a subpar solution.

4. Location. Interpretation of href and src attributes in <a href and <img src for example. Iframe supports this with its own <base. Template engines must do manual rewrite of all url's, which is very difficult as custom elements might have url based attributes the template engine don't know about.


there is a lot of complexity in "pasting HTML template" code into a web page... I hate stumbling on such issues I had only partially solved.
The main problem is that "the size of a document is secret information"(!)
Let's say you are making a bad site. You get people to go into it. On this site, you have an iframe with a url that immediately gets loaded. If the user has lots of accounts, then this page would have a height >500px. if the user is not logged in, the height of the page would be 252px. If the user is logged in, but has few accounts, the page would be <500px, but more than 252px.
That is why iframe will not let you know anything about whats inside its frame. not even its size. The user will see this on screen, but the scripts in the evil loading document will not.

Can we solve this problem with intersection observer?
no, this would be to try to hack the browsers.
it can't be solved.
Okay((
the browsers will do anything they can to block it.
i'm blogging, don't respond;)
So, if you use iframe, you have to "communicate" the size of the page in the loaded iframe from the loaded page to the parent page. Ie, you make an "embed"-ready page. This page will alert its parent when its size changes, so that the parent can update its size. This is doable, this is what is done i think.
this can be wrapped in a web component. And then the web component would need to add this code to the child. Yes, that could work. Hm.. maybe its not that bad after all.
If we use the srcdoc attribute on the iframe.
and then in the srcdoc we add
1) a <base> tag with the correct starting address
2) a small script that sends a message about size changes
3) the code we want to paste
and then in the wrapper web component, we add 
a) an event listener for the postmessage that alters the size of the iframe element in its shadowDOM, 
Then that is it. Yes, this is what we need. We have a little polling going on inside the iframe, its not as cheap as css only, but this is tolerable. How frequent the polling can just be set as an attribute on the web comp. The polling can be fixed.
and of course, we just block the cors on the iframe with the srcdoc

the thing we need iframe for:
1) encapsulate css, this is good and bad, we need a way to transport the styles we need want into the iframe as well.
2) run scripts safely. By setting the sandbox and CSP policy, we can ensure that the iframe can run scripts, but still not access state from within the outer frame.
3) seamless add content. There is a lot of unnecessary complexity in making the iframe scale and adjust, but it can be done.
