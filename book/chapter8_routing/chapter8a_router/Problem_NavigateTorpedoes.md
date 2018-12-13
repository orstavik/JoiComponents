# Problem: NavigateTorpedoes

The web is a troll. With three heads: HTML, JS, and CSS. 
Trolls are genetically challenged with warts, extra fingers, some marbles running around inside its head,
and skin that is a hybrid of vegetation and flesh. 
The web troll is also huge: there are lots of HTML tags with idiosyncratic semantics, CSS rules and 
a JS API that partially complete and compete with itself and HTML.
But the biggest problem 

## Family life on the web

As we all know, the web is a big family. 
HTML is the father of the family. Strict and formal and with a truly fixed opinion about everything.
JS is the mother. She is the pretty one, dynamic, vibrant, and with an answer to almost everything.
Dad thinks he is the decider, but everyone knows that, in reality, its mom who comes up with the solution in the end. 
CSS is the oldest brother. A liberated teen. That somehow has managed to carve out an authoritative role 
for himself long ago when HTML was not married to JS, but was living with another woman called Applet.
Applet was not good at managing a household, so dad was more like a single parent trying to raise CSS on his own.
However, as time has passed, the authority dad granted CSS back, seems more and more like a mistake.

That is the family history. You, the web developer, is a newer addition and the younger sibling in the family. 
From the very beginning you have learned that you are the diplomat in the family. 
The somewhat dysfunctional family.
It is not that your family is broken or anything, just that it has its quirks as all families have.
What your family has going for it is that it has a lot of love going around, 
especially between mom and dad since latest baby Web Components arrived.

As the diplomat, your role in all family interactions is to, in every new situation, 
immediately sense where the potential family conflicts might arise.
What in this situation does not fit with your HTML father's completely fixed and rigid world view?
How can dear JS mother's solo ventures lead the whole family into trouble? And
how will CSS, your passive aggressive older brother, find a way to trip everything up and then blame you?

But, having lived this family for some years, your diplomacy skills are improving.
Especially since you recognized one key factor in most of your family's disputes: 
most problems are caused when one of your family members, most often your mother, 
deliberately or unconsciously does something on her own, outside the normal channels, 
that ends up affecting the one or all of the other family members. 
You have even made up a nickname for such inconsiderate solo ventures: "torpedoes".

## Torpedoes

Imagine that you are out at see. The sun might be shining and you are cruising around in giant cruise ship, or 
there might be a full storm and waves are tossing your small sailboat about. Doesn't really matter. 
Calm seas or hurricane, big ship or small boat, cruising or fighting to stay afloat.
Because, "BAAAM!!", from out of nowhere, a torpedo rams into the hull of your boat, water flushes in,
and the whole thing goes down in a matter of milliseconds.

Torpedoes are good. For you as a metaphor when applying your trade of family diplomacy and web development.
Torpedoes travel beneath the surface, so you can't see them until they hit you and explode.
They are also so menacing, that if you get hit once, you learn to stay away from those waters.

## NavigateTorpedoes

But, family first. Another important fact you have learned about your family life and conflicts, is
that mom and dad both wants to decide where the family should go. Mom and dad both want to decide the navigation.
What happens is that first comes dad, and in his preset, strict manner, lays out a couple of suitable options.
Often, mom doesn't really care, and so she just sits back and lets dad drive the car.
At other times, mom has an opinion, and then she decides which one of dad's options the family should go to.
So far, so good.
The problem comes when mom want to decide where to go, and, not wanting to include dad in the decision,
either chooses a location that is not part of dad's agenda or makes the decision to go to one of dad's
location without informing dad about her decision.
This mom-navigating-without-including-dad should *always* be considered a source of conflict and
you have simply named this type of recurring family interaction as "NavigateTorpedoes".

Thankfully, you are a skilled diplomat by now. And so you can list *all* of these NavigateTorpedoes.

## NavigateTorpedo nr 1: `HTMLFormElement.submit()`

Back when this Applet lady lived with dad, it seemed like a good idea that when JS called
the method `submit()` on one of dad's `<form>`s, neither dad nor anyone else would be able to 
interrupt the navigation decision. When JS calls `.submit()` on a `<form>`, that decision is final,
and the whole family must go there no matter what. Mom's `.submit()` decision is irreversible.
  
Now, when this family dynamics first was set up, you were far too young to truly understand what was going on.
Now you are thinking that this maybe was HTML being infatuated with JS, and 
that it was more a gift or backdoor for HTML and JS to sneak around. 
But, you most definitively know, that now that mom and dad are married, 
HTML would never allow JS to submit something without *both* letting him know about it *and* 
veto it.

Today, mom very rarely use `submit()`. It happens mostly by mistake or as recurrence of old habits.
But, it still *can* happen and occasionally *do* happen.                          
If mom calls `submit()`, she will *directly control the entire family's navigation without alerting or 
adhering to dad*.
So, you, the family's diplomat, must still take this potential torpedo into account.

So, what kind of quarrels happen when `submit()` is called and dad is not alerted about nor van veto it? 
The problem is that sometimes, such as on family holidays, mom and dad do complex navigation.
At these times, mom and dad institute their own route decision process in which they both join in
the navigation decision *every* time. They call this "making/using a router".
The problem is that if mom and dad decides that on this trip they need to verify every navigation decision together,
and mom forgets herself and then calls `submit()` out of old habits, then "BAAM!!", the navigation decision
is final, the family goes there, no matter what. This is both a problem because the family might *go to*
the wrong place, but it is also a problem because the whole family *might leave* the place they currently reside
without first packing up their holiday tent and everything into their car. 
If you leave abruptly while on holiday, you forget stuff. And mom and dad has of course added the
"remember to pack all the stuff" as part of their democratic, orderly "router" navigation process.

You, the little family diplomat, are frustrated that mom and dad don't see this themselves.
You are just waiting for them to arrange a family meeting and agree to remove this privilege from mom
normal family routines and unilaterally decide where to go.
But, things are not as simple. Mom and dad probably has many old, romantic memories from 
when they were sneaking around behind Applet's back. For everyone else, these memories are just images
you wish to forget, but mom and dad sees it differently of course.

## Diplomatic alternative nr.1

Avoid: `formElement.submit()`.

Use instead: `aSubmitButtonInsideFormElement.click()`

## NavigateTorpedo nr. 2: `target` that frame

Family is not only happiness. It is also sadness. And loss.
Before mom and dad got baby WebComponents, the family had two twins called `<frame>` and `<iframe>`.
However, even from birth, `<frame>` and `<iframe>` were sick. Really sick.
In fact, `<frame>` was so sick it never left the hospital.

This was a very difficult time for the family. JS mom and HTML dad had to travel back and forth between 
home and work and the hospital all the time.
They tried to keep things normal for both you, the `<frame>` and `<iframe>` and all the other siblings. 
To make things look normal, even though it really wasn't, they ended up doing a lot behind the scenes
to make things feel ok and safe. However, it didn't really work. They ended up doing too much. 
And it didn't become that safe. So, eventually, things kinda fell apart.
Thankfully, `<iframe>` survived and gradually moved home. `<iframe>` now mostly plays in the `sandbox`.
But. `<frame>` died. `<frame>` is dead.

Mom and dad still struggle to cope with the loss of `<frame>`. The main reason for this is that
`<iframe>` is still around and reminds them of `<frame>`. `<iframe>` also has relapses
and needs to stay in the hospital from time to time. So, mom and dad still often talks about 
navigation as if they are driving to and from the hospital, although their commute is now back to normal.

What they do, is that when they plan to go somewhere, they first state which `<frame>` is the `target` of 
this plan. Now, since `<iframe>` lives on, and has some trips to the hospital, 
this can still be applied in some rare instances.
Also, the family expression of `target="_blank"` is as useful now as it was then.
But, since JS mom now is a big part of the family and has much better ways to control navigation,
`target="that_frame"` is more a source of pain than joy.

The problem with navigate events that are directed at another 'frame', is that they are torpedoes.
When dad was with `<frame>` in the hospital and was telling the others back home were to go,
this was good. The family didn't do much second guessing of navigating events back there and then. 
Now, however, with all the holiday trips and in-app routing going on, `target` torpedoes are not so good.
What happens now is that if mom and dad are on a trip and `<iframe>` comes along, then 
if `<iframe>` suddenly decides to target a link to mom and dad, suddenly `<iframe>` is calling the shots,
without mom and dad finding out before it is too late.
Put shortly, except for `target="_blank"`, navigating events routed via the `target` attribute to another 
frame within the window will essentially torpedo that frame and burden you, the little diplomat.

## Diplomatic alternative nr. 2

Accept: `target="name"` for `<iframe>` children inside your own document.

Appreciate: `target="_blank"`

Avoid: `target="_parent"` and `target="_top"` and controlling the navigation of parent frame.

## NavigateTorpedo nr. 3: `window.open()`, `location.assign()`, `history.pushState`, `history.replaceState`

Any good marriage has a power balance. 
For the web family to function, JS mom must be able to put her foot down and round some corners 
when dad becomes too much of a square.
`window.open()`, `location.assign()`, `history.pushState`, `history.replaceState` are the shoes mom use
to do that.

These four functions are all NavigateTorpedoes. 
Mom decides unilaterally when she puts down one of these high heels.
But. That is how it is supposed to be. These functions should all only be called *to conclude*
the routing process. They should be called at the end of a centralized routing function, not
everywhere in the code. If you want family harmony, that is.

## Diplomatic alternative nr. 3



`window.open()` and [location.assign()](https://developer.mozilla.org/en-US/docs/Web/API/Location/assign)
are a couple of fine women shoes mom keeps in her cabinet.

`window.open()` and `location.assign()` are NavigateTorpedoes. 
Everyone appreciate that mom has them, even you. 
They are to be used when mom means business.
It is a bit confusing that mom has so many similar functions to accomplish this. 
Does she really need that many shoes?
The premise of these methods is that they should only be called when 

They still have a couple of hangups kinda kling to the old habits
 