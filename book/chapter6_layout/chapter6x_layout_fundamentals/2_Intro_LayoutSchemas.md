# Intro: LayoutSchemas

As described earliere, we can split the context in which the user interpret the layout of elements in a web app in three: the instinctive, the cultural and the intra-textual. In this chapter we will look more in depth of these three contexts when it comes to layout.

## Instinctively
 
I speculate that we our eyes look for the following aspects:

1. Objects. We instinctively see objects. Both our subconscious and conscious mind benefit from being able to see the entities around us, both static and moving objects. The mind also tries to place objects into view. If you look for a long time at a picture of a football popping up around your screen, and then suddenly that football is given different colors, then your mind would likely try to apply the original colors to that second ball, for a split second. 

2. Objects are defined in 2D. One object has a different color than another object, and by recognizing the contrast between two areas, we recognize the borders of one against the other.

   Human border/line detection is super-active. Because we humans have been in a vision/camouflage arms-race for millions of years. Much of what we eat of meat and most of what eats us, try to use camouflage to avoid our builtin object detection. For example, tigers try to fool us with breaking up their silhouette with stripes. So the human eye must be able to recognize a line that across several different objects. As in the case of tigers, those lines might be the most interesting.
   
   Also, we err on the safe side. If there might be an object there, we try to see all of it. Does something look like half a snake, then we try to imagine the rest of the shape in the second half of the view.
 
3. Objects are defined in 3D. If one object stands in front of another object, then that means something. If a tiger is standing behind a fence, then that means the tiger cannot jump out at you. If that mountain is behind that other mountain, then the map in our head knows there is a straight line from us to the first mountain to the second moutain.

   The parallax effect illustrate the length of those distances. Objects near move more when we move. And we likely need to deal with the nearest objects first, although the speed of moving objects can factor into that equation.
   
   Relief is the spatial placing objects in the foreground against other objects in the background. The eye looks for it. Recognize reliefs, and ascribe it spatial, 3D meaning, even when the surface is known to be flat as paper.

4. Alignment also means something instinctively. If it is one straight line, we can perceive it is one object. It is one three trunk. If it is several straight lines in the same directions, not aligned, our eye might either try to connect the lines to make one object or try to place them in relieff to create many objects. The eye tries to see them as a crooked tree trunk or as several three trunks, one in front of the other. The less recognizable structure the mind can produce and the more work it needs to produce it, produces disorientation and tension. Its ugly.

5. Ratio. The are several ratios that have a natural significance for us. The nose is placed in the center of our face. 1 to 1. Our limbs are the length of the golden ratio to each other. 1:1.618. Or 1:0.618 if you prefer. A third is 1:2. A quarter 1:4. And if you have a grid of 12, you can divide it both in even halfs, thirds, quarters, sixths and twelves. Or 7 and 5. Some of these ratios might resonate instinctively, but i suspect it is rather symmetry and form recognition, rather than the ratios themselves that carry the most recognition.

6. Patterns. Symmetry. Recurring forms. The organic world is filled with symmetries and recurring forms. The two halves of leaves and faces. Everything we eat, or that can move and eat us, is alive and symmetrical. Even the skin of a camouflaged snake has a symmetrical, recurring patterns in its scales. We benefit from recognizing and ascribing symmetries and recurring forms meaning as it is likely that these patterns will turn out to be meaningful.

## Culturally

As described earlier, genres are conventionalized (design and language) schemas for recurrent rhetorical situations for interaction. These schemas are 4D, they stipulate both the time and place for certain communicative functions or content groups. Genres layout when and where we intend to communicate what with whom.

To load quickly into our recognition, so to speak, a web page would do well to resemble (an)other web page that their users are already familiar with. If a user is already familiar with the menu being up top, then that is likely where they will go and look for a menu their first. Thus, by putting your information in the same place as similar information was presented on (an)other website, your users will find it quicker.

In this sense, we can think of us users as animals foraging for information. If you want an animal to quickly locate a tasty menu on your web page, then you place the menu where you know the animal would expect to find it, based on its previous journeys in the jungle. When it comes to the instant, milliseconds orientation on a new site, humans resemble rats in a maze more than philosophers. Instinctively, humans are creatures of habit.
 
Furthermore, if you break the patterns of your human foragers experience, the humans will not find it immediately, but will have to stop and consciously search around the site with their eyes to find the menu. From a developers perspective, this is red flag. Sure, you might want to grab your users attention and get their attention. If your site stands out, it can be a good thing. But. We all know that overall, humans foraging the web for information are neither patient nor particularly inquisitive. So, breaking their habits risks loosing users that simply skip back to where they came from.

In the jungle of the web, there are many different places to search for food for thought. Different web pages have different agendas: some have lots of news, while others are only trying to sell *one* thing; some are vast apps with large hierarchies of templates, pages, menus, data, and differing advanced UIs, while others are contain only an image and header. These locations cannot all fit into the same mold, neither quantitatively nor qualitatively. Thus, multiple, recognizable archetypes of web pages, ie. layout templates, have developed. Similar web sites with similar communicative needs can use the experience their users have from each other as frame of reference, a sort of training ground for the foraging human animals.

For example, if all musicians are familiar with the menu and product placements on `www.rent-a-piano.com` and `www.rent-a-violin.com`, then `www.rent-a-tuba.com` can exploit that. By re-using the recurring design features of both of these other two sites, their new site can make itself instantly familiar, recognizable, and navigational. These recurring design features, the recognizable layout, is functional. It is the genre that facilitate fast, efficient establishment of trust and communication between two culturally associated persons who has never met. It is almost on par with language.

## Intra-textual

Both the cultural layout genres and the human eye instincts both play a role when an actual web page layout is interpreted by a user. Instinctively, being aligned will signify two elements as being related; being slightly off keel will draw attention to it: are the elements related but weakened by a crack in the line, or are we presented with two separate elements, most likely in relief (separated in depth).

The layout relationships thus play against our human eye instincts, our established cultural expectations and the intra-textual relationships within the web page to guide us. Break too much, and your users don't recognize your perspective and find your information; break too little, and your familiar, but might attract too little attention to your web page.

## Different recognizable schemas

The web is full of recognizable genres.:
 
1. The grid with menu, nav, main, header, footer.
2. The page.
3. The symmetrical poster. Like a face, the centered, symmetrical poster that greats you like a face.
4. The dollhouse, a stage filled with rooms for different purposes.
5. The parallax. A flatten layer cake of stages
6. The mind map. Prezi.
 * and many many more
 
The most common pattern today is the responsive grid-page. The grid on a large screen, then page on a smaller screen.

We will discuss these as patterns shortly.

## HTML and genres

The genres are soooo many and soooo varied. And they develop and change soooo fast. Thus, the HTML standard cannot room them all. There would simply be too many different tags and categories and variants. So, unless you are communicating within the common "plain text with images and a feedback form", the standard HTML elements leave you short.

That does not mean however that HTML elements is not the place to describe it. On the contrary, HTML is already full of tags for such "places of interaction". `<h1>` is the place for the name of the page, app, or text. `<form>` is a place where the user can *write back to* the web app. `<nav>` is the element with the intra-site navigation menu. And the web's defining feature, the `<a>` tag is where you shake hands and say goodbye.
