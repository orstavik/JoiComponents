# Pattern: NavigationControlFreak

Control. That great feeling. You are the master. 
No bad things are going to happen. Only good things.
Why is that? Because *you are in control*. And how do you know that?
Because that great *feeling of control is in you*.

The NavigationControlFreak pattern is about controlling navigation. 
But why do we need to control navigation?
When do we need to do that?
Why do we need to be in control, to feel in control?

## The rationale behind the NavigationControlFreak

To navigate is an action with two sides. You are going *to* someplace.
But you are also going *from* someplace else. Ok. That's nice. But what does this feel like?

Imagine you are going shopping. Christmas shopping. You are stressed out.
So many family members that don't really care about you, and that you don't really care about.
But the gifts still needs to be gotten. And you most definitively don't want to present a bad gift.
You still have *some* pride, after all.

Your mind is working overtime. Solving a myriad of impossible contradictions at the same time. 
The gift cannot be ordinary, as that will make your family care about you even less. 
A bad gift will justify their separation, gradually sement it.
The gifts cannot be too expensive as they might think you are *both* desperate and pitiful *and* 
trying to guilt them into something. So, what to do?

On the one hand, you have the choice of dissociation: 
you can emotionally distance yourself from the whole situation, and say "christmas gifts are of no
importance to me". But you don't want to be that guy. Deep inside, you *do* care. Because deep inside
you sense that dissociation is a luxury you really cannot afford at this task at this point in time.
The emotional gaps around you is already too many and wide.
So, instead you press the stress button. You focus. You need to be creative! 
You dig as deep as you can in your memories. Searching. Trying to find that point of 
personal connection between yourself and that other family member, that which is forgotten by all, but 
still shows that you care.
Your aim is to ignite the neurons that house a fond memory of you in the mind of the other, 
that your gift will hit that sweet spot and make them think of you for a record breaking 15 seconds. 
That gift that will somehow restore that loving relationship that you still long for. It's Christmastime!

It is only when you get home from the five hour, late night sweat fest/shopping trip 
that you realize what on earth controlling navigation has to do with Christmas gifts.
As you put the shopping bags on the floor, hoping to get that good feeling of relief and pride from
the fruits of your labour, that felling of successfully having navigated the emotional minefield that is
Christmas gifts, your mind is instead filled with another, horrible sensation. Where's my favorite mittens?
The truly nice pair of hand wear you so treasure? Those currently too expensive to replace! That still look
good after two winters warming your hands? No!! They are gone..

You took them off every time you needed to fish out your credit card at the checkout.
And when you needed to look closer at those useless nick-nacks in the store shelves. $@#¤%!!...
As the feeling of failure fills your mentally exhausted body with yet another dose of stress hormones,
a clearing opens up in your mind. You bite in the impulse to release that stress as 
either sadness or anger. You don't cry. You don't swear out loud. Instead turn your disappointment into 
anger. And direct it inwards. "I will NEVER AGAIN loose my mittens. I will NEVER loose NOTHING AGAIN. 
I will ALWAYS CONTROL ALL my SHIT before I ever, EVER leave either ANY shelf or checkout counter. ALWAYS. 
NEVER AGAIN." As if delivered by a bolt of lightning, this angry, determined feeling of self control 
instantly appears and balances out the feeling of disappointment that is the consciously felt loss of your
favorite mittens mixed with the subconsciously felt, gradual loss of your only family. 
The desire for self control will never accept nor realize these losses, instead it will harbor them 
to fuel and motivate you to keep this self control in the future. The control-freak-grudge. You need it.
The grudge is the only thing that will help you to *never, ever loose your mittens again*.

With your teeth and resolve gritted, the ControlFreak is established. 
And it returns to your current situation. Bags on the floor. Check.
List of family members. Check. Next, its time for the status rapport, matching gifts with list of family members.
With a mind sharpened by its resolve to control and all other emotions firmly and angrily tucked away,
you see that you forgot your mother's gift. That most important stop. The person you most definitively would
have liked stricken off your list. A short flash of added disappointment strikes you.
You must return to the Christmas mania again. You are not done.

However, after a quick, sober self evaluation, you determine that while the root cause is deep and 
deeply troubling, the last straw causing you to forget your mother's present is not at all troubling you: 
today you simply lacked systematic control during navigation. 
And so, this flash of added disappointment quickly shifts to a feeling of hope!
"When I next time check for forgotten mittens, shoppingbags and wallets in the shop, 
I can check my shopping list, current traffic info and fastest route *and* pricematch on my phone!
I just slightly extend my *plan and control* navigation system to include **where** I go next and 
**how** best to get there. It fits perfectly! I will simply always check that I 
*do not forget anything the places I leave* and *finds the correct route before I go someplace new*.
Wow! Hope! Next time, I will feel no anxiety when shopping Christmas gifts. The future will be better. 
I simply need to control all my navigation choices next time. At every point, both within and 
between shops. Yes! I'll be like a Christmas shopping machine, that will find the best presents, 
that everyone will love, and they will remember their love for me, and I'll be faster than all others,
and find the best prices too. Ahh.. I love you control, you complete me!"

## The Router is a NavigationControlFreak

Your app is you. You Christmas shopping. The trip is *not* the end goal. The trip is a means to an end. 

If your app is small, controlling navigation might not need to be controlled.
Your app only has a few simple links. All in the same store. No external content, no co-gifter agendas
to consider.

However, most apps grow and is given responsibility for more and more.
Your particular app has tons of things on its mind. Your app has baggage. 
It gets content from many different sources.
It needs to go many different places, within shops and between them.
It is not clear where it needs to go at different times, you might need to evaluate the products in store, 
there and then, you might benefit from considering traffic jams, *before* you can decide which location
you should choose.
You don't want to focus on nor control navigation, but you sense that you *must*. 
You feel the loss of the mittens from last year, and it commands you to implement navigation control *now*.

You make a Router. All requests to go to a new location should go to the Router. ALL.
The Router is responsible and *controls* all navigation.

Therefore, first, the Router must *take control* of all navigation. 
The Router must intercept and take control of the navigation within the app.
It must highjack all impulsive navigation events and calls.

Second, the Router implements its controls for *leaving* anyplace.
 * Have you any data with you that you need to store before you leave? If so, store it and check.
 * Do you need to ask your user for permission to leave, are you really sure you want to leave? 
If so, do so.

Third, the Router implements its controls for *going to* anyplace.
 * Where do you want to go? Are there any other places closer by, that you can get to faster for the same result?
 * How is the traffic? Are there any reason to take another route?
 * Is it safe to go there? Maybe its better to go to another store in a safer neighborhood?
 * Is it a good time to be creative? When considering where to go next, should I creatively make some
   value-adding decision?
   
## References
 * [Anti-pattern: OCD](https://en.wikipedia.org/wiki/Obsessive%E2%80%93compulsive_disorder)
 * [Anti-pattern: Fugue state](https://en.wikipedia.org/wiki/Fugue_state)
 * [Anti-pattern: Fugue state](https://en.wikipedia.org/wiki/Fugue_state)