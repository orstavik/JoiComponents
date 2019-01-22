# HowTo: be a good Listener?

To be a good listener is a craft. Not an art. When people say it is an art, it is mostly either
to excuse themselves or someone else for not being very good at it and/or not trying to practice it. 
But don't be fooled. To be a good listener is a craft. It is just a set of some basic skills. 
Once learned, practiced and employed, all of us *can* be good listeners. And you should not make 
excuses for yourself when you are not listening well, even though it happens to all of us, all the time.

The skills needed to be a good listener, are:

1. Enter with an open mind. It is hard to listen when your head is filled with other ideas
   and your heart is bubbling over with your own emotions. Try to clear your own mind and soul
   to give room for the other, his thoughts and his emotions.
   
   Your event listeners should not be overloaded with state details or bindings to other parts of your app.
   Try to keep your trigger event functions as pure as possible (apap), and establish transparent, 
   concise and predictable exit points for when you leave your listener function and start some other 
   app function.
   
2. Process what is being said, when it is being said. Don't veer off topic and digress when it is not 
   appropriate. Take one thing at a time, and allow others also to conclude topics before you jump 
   into the next one.
   
   In JS, different events often come in quick concession. Try to anticipate such event order, and
   tackle different tasks one by one in different event listeners. When you see that you packing many 
   different steps of a task in one event listener, then pause, take a step back, and think. 
   Event listeners that respond to the current event only and that do neither try to catch up to or 
   preempt other events, will help you avoid *both* conflicts with other event listeners for the same event
   and keep your current event listener pure and simple.

3. Don't interrupt. Wait your turn. 
   Wait until the other has presented his full opinion before formulating your own, 
   *both* in your own head *and* out loud. And don't hog the conversation once your turn has come. 
   
   Events propagate in a certain order. And many event listeners can be attached and triggered by the 
   same event. Therefore, don't call `stopPropagation()` nor `preventDefault()` on a whim.
   Others might have important things to say and are just dutifully waiting their turn.
   Sometimes, you might need to close a topic, but when you do, do so with clear intent and a only after
   consideration of the other's whose turn you void.
 
4. Read between the lines. The unspoken can be just as important as the spoken. 
   Anticipate that important things might be left out, either inadvertantly or intentionally. 
   Some such things are better left unsaid. 
   But at other times, the conversation is best advanced by both parties helping to fill such gaps.
   
   Event management is full of "accidents waiting to happen". Events do occur at unexpectedly 
   (a second `mousedown` might accidentally be triggered in the midst of a dragging sequence).
   Events might go missing (such as a `mouseup` outside of the `window` of the browser).
   Such "accidents" must be anticipated and handled
   
5. Take note. Turn on your short term memory. Try actively to remember what both the other person and 
   you yourself has said during the course of the conversation. Build on what the other says.
   Extend there positions. Nuance their position. Disagree. Agree.
   
   Events are not only pure and atomic. Events can also be sequential compositions: to `click` the user 
   must first `mousedown` and then `mouseup`; and a `dblclick` is two `click` events in quick concession.
   To make such SequentialEvents, the preliminary trigger events must be stored and kept available
   in order for the final trigger event to dispatch.
   
6. Pay attention. To listen is an active endeavour. It requires mental capacity and it can be strenuous.  
   Take into account both your own and others' mental cost payed to stay attentive. Be on the lookout for
   signs that you yourself or the other might deplete or overload your listening resources.
   
   To register an event listener is not in itself very costly. But, event listeners force the browser to
   a) preprocess events and b) execute the event listener every time a corresponding event occurs. 
   *That* is costly and should only be called for when necessary. To avoid such costs, you should not
   add all event listeners at the beginning of
   the program. Instead, you should ListenUp and only add secondary event listeners *when* a required, 
   primary event listener is triggered.
   
7. Be responsible. Respond. When it is your turn. To what the other has said. Based on the spoken and 
   unspoken content from the current conversation. But, do so based on your own values and principles. 
   Recognizing your own duties, rights and obligations, as well those of the other.
 
   When making an event listener, you have a task to accomplish. You have a responsibility. Try to keep
   that responsibility separate from the event itself. Let the events trigger your functions, but
   be careful not to become too reactive. When needed, stay in control, and don't let the events push the 
   rest of your app around. That can cause problems.
 
8. Avoid judgement. First intend to understand the other, then intend to reply and react.
   Try to avoid making judgements and corrections of the other along the way.
   
   Events should mostly be considered immutable. You should avoid correcting or changing the data of the
   event as it passes. Something has happened. Respect that. Take it at face value. And then react.

## References

 * 

## old drafts

 To listen well is to listen without preconceived ideas. But how is that possible? How 
 can you listen without your own language, your own understanding of context? To listen well would 
 be to be open for the perspective of the other. Listen emphatically, accept their emotions. 
 To allow them to present their perspective, not to interrupt. 
 
 To be responsible is to present the other with your own perspective *after* they have presented theirs. 
 To give your emotional response after you have sensed theirs.
 
 To just wait your turn accomplishes a lot.
 Do not judge.
 Help the speaker evolve his/her narrative.

