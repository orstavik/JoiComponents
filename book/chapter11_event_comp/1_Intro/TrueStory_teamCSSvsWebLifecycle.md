# TrueStory: team CSS vs. Web Lifecycle

## Before the match

In the red corner, weighing in at a total of about 253kg, stands team CSS! Team CSS is made up
of Ada the Kick-Ass-Designer, BigMess Bob and Feeeeeeel-the-Pain Cloe! Behind them, their coach, 
Mr. Big Company, we already see is getting ready to simultaneously throw in the white towel and yell at
them furiously. How about this guy, ha?! He loves to give up early just so he can yell a little.

In the black corner, weighing nothing at all, stands the guy we love to hate, Miiiiiister Weeeeb Chronotope!
As always wearing he is wearing only a black mask to hide his true face and intentions, he literally
jitters in anticipation of digging his teeth into Ada's ass, Bob's man-boobs and Cloe's
forehead. Miiiiister Weeeeb Chronotope everybody, maybe this time somebody finally will understand what
that man is all about and TAKE... HIM... DOWN!!!

## start of the match

"Yeah!! Wooah!" The crowd roars, but before they can really let it all loose the bell rings and the 
fight starts.

In the red corner, Mr. Big Company is of course frantically both blindfolding *and*
tying the hands of team CSS. Having promised to deliver early, Mr. Big Company is behind on time.
And, as always, fighting for Mr. Big Company means that team CSS is only allowed access to *one* of their 
resources! As they seem to have chosen their feet (access to the CSS files), Mr. Big Company is tying 
their JS hands behind their back and blindfolding their HTML eyes. He is a funny guy, that Mr. Big Company. 
He just loves to pigeonhole his poor underlings and apply restrictions so that his teams only need to
talk to him directly and as little as possible with each other. How can we not love this guy?! 
This aaaaaalways leads to such chaos in the end and fights we gladly to pay to watch unfold! 

Out from the black corner, Mr. Web Chrontope formally storms out and immediately starts
circling the whole arena. He is a scary monster that one, black masked, inhumanly fast and with his
constant unpredictable motions in seemingly odd directions that just seem utterly impossible to predict. 
Mr. Web Chronotope sure now how to entertain.

## round one!

Finally, team CSS is ready to move. Kick-Ass-Ada seems ignorant of the things that are about to happen
and confidently parades into the ring. BigMessBob is a happy man, and ready to run into whatever. 
Only Feel-the-pain-Cloe seems aware of what is going on. She is trying to sneak her way slowly into 
the arena as if she was standing on the edge of a swimming-pool filled with ice water and 
dipping only half her big toe into it. She hardly moves.

*BAM!!* And we have our first hit! BigMess Bob just got whacked down as he just ran out into the ring 
leaving behind CSS rules like they were rice-corns at the wedding steps of his best friend. 
From the right, and incredibly fast, came Web Chronotope hurdling. But Bob is getting up again! 
Completely unaffected about what just happens. He just continues to run and spread even more CSS rules
about. *BAM!!* Hit again, and up again. Wow, what perseverance! It is almost like he can just run around 
and add CSS rules infinitely, no matter what happens. *BAM!!* 

*SLAM, WOING-WOING!!* Wow, Kick-Ass-Ada just got curled up into the ropes! She accidentally tripped in one
of the CSS rules from BigMess Bob had left behind, and as she fell she got rammed by Web Chronotope 
again circling in from the right. Woooah. What a spin of that girls head! She never saw neither the CSS
rules nor Web Chronotope coming AT ALL, and just got thrown up straight into the ropes! 

## round two

But what is Feel-the-Pain Cloe doing?! Has she retreated to her corner? 
She is definitively leaning into the ropes, but now she lifts her left leg and stretches it out. 
Hey! She is kicking! What a development this is! What touch-action we see from Cloe! 
Or is it a user-select kick? Hard to see from this angle.
Anyway, doesn't matter, 'cause now Mr. Web Chronotope in coming in from the right again. 
And he runs *SMACK!* into Cloe's foot. Feeeeeel-the-paaaaaain Cloe!! Mr. Chronotope is down
for the first time in this match, with an exquisite pointer-action property/foot maneuver Cloe and
team CSS is wiping the floor with Mr. Web Chronotope.

Cloe is shouting out to Bob and Ada and they also start kicking all over the place. The match has 
completely turned around. What looked like a clear win for the inhumanly fast circling tactic of Mr. 
Web Chronotope has been literally tamed by team CSS. Poping "touch-action: none" and "user-select: none"
properties as if there is no tomorrow, they have slowed down and essentially beaten Mr. Web Chronotope.
He now runs maybe a third of his original speed around the arena, his movements being limited at every 
turn by the constant kicking of team CSS.

## The end

Running slower, it is now finally easier to see Mr. Web Chronotope's moves. He was not at all that 
erratic after all. First phase, he runs along the JS half of the arena. Both the DOM is here complete, but 
he only completes the JS tasks that require individual DOM nodes to be ready, and no slotchange tasks 
that require a branch of the DOM be ready. The second phase, he picks up all the tasks that required 
a branch of the DOM be ready, and the executes them, one by one.
Then, the third phase, he runs past the rAF corner, before he in the forth phase runs past CSS style calculations, 
and the fifth phase past layout calculations. Finally, the sixth phase, he runs past the ResizeObserver 
tasks to complete his circle.

What happens when Bob, Ada, and Cloe starts kicking is that they catch Mr. Web Chronotope by surprise while 
he passes his touch and mouse events in his first normal JS phase. And they literally kick him into the 
ropes next to CSS style calculations where he fumbles a bit before he bounces right back. 
What used to be a nice circular motion is now more like an awkward "B" where Mr. Web Chronotope must
run past CSS style calculation an extra time every time he tries to process an touch, mouse or other 
CSS kickable DOM Event.

## Conclusion

Ahh.. That wasn't fun at all! Too slow.. Buuuu!! Make them stop kicking! Tie team CSS feet together with
a meter long rope so that they can still run, but not kick. Yes! Let's do that instead. That way, our
favorite enemy Mr. Web Chronotope can run just as fast as he used to and let it be that team CSS will 
have much less control of the DOM Events happening in the arena.

## References

 * 
                                                         -                  