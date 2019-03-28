# Pattern: .render()?

Is it benefitial to add the .render() callback?
The answer to this question is when:
1. the internal state of the element begins to grow, 
2. multiple sources access and change this state, then
3. you want the logic to be that once all the different sources are finished updating the state,
then after that you update the view / .render().

But, should other mixins be allowed to call .render() directly? Should .render() be part of the isolated Base?
I think not. The developer likely need to intercept the state change directly, and 
can then themselves in the component code make the call to render.
Having a call to render be invoked at a fixed point might be more problematic.
If too many calls to render, then debounce it in a rAF in the component.
That might be a mixin though. A RenderAFMixin. 
A Mixin that has a method triggerRender() that will handle the debounce task for the developer and trigger a render().
But such a mixin is likely better a punchline.

### Second level functional mixins
If you want to create functional mixins that use a different or bigger `Base` assumption,
you are free to do so. If this set of assumption includes all the assumptions constraining 
IsolatedFunctionalMixin, then IsolatedFunctionalMixins should be able to be included as a `Base` 
for such other mixins.

`.render()` is a prime candidate for a bigger 
Using second-level FunctionalMixins, it is possible to create functional hooks for how a custom element
should react to certain events (other than as trigger a reactive method or dispatch a composed event).
One prime candidate use-case for such a second-level method is .render().
However, this creates a highly complex architecture around the FunctionalMixins themselves.

### another second level mixin is DragAndFlingToScroll
TODO add scroll as an example of a secondlevel mixin that relies on the Base + DragFlingGesture.
