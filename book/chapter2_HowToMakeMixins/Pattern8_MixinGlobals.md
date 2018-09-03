# Pattern: MixinGlobals

this pattern also describes how to make global arrays and have single event listeners for system 
events such as `unload`
in order to que and control the callbacks on the elements more efficiently and to do cleanup and 
other activities at a single point.

Discuss the use of weakSet and the problem of not being able to iterate weakSet.
The dilemma of preserving references to elements disabling GC.