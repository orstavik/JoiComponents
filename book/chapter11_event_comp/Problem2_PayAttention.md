# Problem: PayAttention

"Pay attention!" Literally, this expression means that someone should "pay", ie. use of a scarce resource, 
for the benefit of "attending", ie. being present, in the conversation with another.
To "attend" in turn comes from Latin and means something like "stretch to here and/or from there".
Thus, "pay attention" means that I want you to spend part of your precious mental resources to 
metaphorically stretch your mind from where you are standing over to where I am standing so that you can 
virtually hear, see, sense and thus grasp my words and point of view.

"Pay attention!" are most often used as commands, uttered by some authoritative speaker 
(cf. teacher or officer) to get his or her lower status listeners (cf. students or conscripts) to 
not doze off and follow directions.
To utter such utterances feels good. You are in social control. An alpha in a group. However, if you cannot
resort to other harsher means of imposing your will and status in the group, uttering such words are more 
likely to prelude social failure and collapse, than success and joint action.

## Cost of attention

To compose an event, you need trigger events. And to get trigger events, you need to listen for them.
And to listen for trigger events, you need to attach an event trigger function as a global event listener.
And to attach global event listeners has a price. This *will* cost ya!

"How much?", you ask. "Well, that depends", I answer. "How much have you got left in your frame purse? 
And which trigger events do you want to pay to listen to? The price is not the same for all events, you know".
Then I wink knowingly to you while I nudge you with my elbow, so as to say that we both know why and which 
events are more costly than others. Although we both really know that you don't know that, 
while I am the only one that knows that I don't really know the true cost of these events either, 
I only know enough about these events to fool you into thinking I do.

The cost of listening to an event needs to be calculated. And while not very complex, 
it is not super simple either:

1. Event granularity: Some events, such as `mousemove`, 
   `touchmove`, `mouseout`, `wheel` and `scroll` are fine-grained. They might be dispatched 
   ten times per second and even more than once per frame (more than 60 times per second). 
   Other events, such as `click`, `touchstart`, and `mouseup`, are coarse. These events are not dispatched
   in rapid succession, because they are limited by the action of the user 
   (try to `click` ten times per second, I dare you). 
   
2. Platform: If your app is designed for high-power desktops with modern browsers, you are in luck.
   You have more resources to play with and buy event listeners for. But, if your app should run on
   a poorer platform (imagine that old computer with IE at your nearest school), you might need to 
   reconsider which events you consider fine-grained and coarse.
   On some such platforms, `keypress` might still best be considered a fine-grained event, while 
   it elsewhere normally would be considered coarse.
   
3. Event rarity: My salesman knowledge is here reaching its limitations. But I anticipate that
   browsers can detect when the app has *not* registered any event listeners for such fine-grained, but 
   rare events such as `wheel`. When the app has *no* event listeners for such rare events, 
   then the browsers could also skip completely its preprocessing of such events.
   Thus, adding an event listener for a rare event would not only add the event listener itself, but 
   also add the platform's event preprocessor (which otherwise would have remained inactive).
   
4. Event collocation: Some events are crowding the same time-space.
   `dblclick` is dispatched at the same time as `click` and `mouseup`: these three events essentially 
   share the same timeframe. This is rarely a problem for coarse events, but with for fine-grained events
   such as `mousemove`, `mouseover`, and `mouseout` already pressed on granularity and rarity, 
   collocation is an added cost.
   
