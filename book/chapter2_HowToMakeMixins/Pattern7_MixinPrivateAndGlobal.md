# Pattern: MixinPrivateAndGlobal

this pattern describes how to use symbols to make properties on an element private in a mixin.

this pattern also describes how to make global arrays and have single event listeners for system events such as `unload`
in order to que and control the callbacks on the elements more efficiently and to do cleanup and other activities at a single point.

Use weakSet instead of array to make the elements collectable by GC, when needed.
