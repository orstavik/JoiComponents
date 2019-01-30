# Pattern: StaticPortal

I am now going to break your heart. I am going to tell you a truth that will shatter your environment like glass.
In reality, there is *no* SingleState. It is a lie. And if you dig deep enough, you will discover it.

But, I am going to console you with a solution. 
A way to fence out state information of *other* states that you somehow need to manage, but 
whose management you do not want to mix up with your regular state.
I am going to show you how to erect a StaticPortal, a wall that you can place between your external, other state,
and your normal, single state, behind which you can safe-ish-ly manage a second state in your app.

## What is a StaticPortal?
Use-case: You want to provide a richer, specialized, high-level interface to a low level resource that will
change its behaviour depending on the state.

A StaticPortal is a js module or class with a set of static functions.
The StaticPortal can also dispatch global events and/or provide hooks for state observing callbacks.

The StaticPortal has an internal, universal state for its internal resources.
This state applies to the **whole browser**, ie. it will be shared between different windows 
for the same app.
(These different windows will each have individual, seperate 'single' states, the StaticPortal is as
such a SuperSingleState).

When you set up a StaticPortal around a low-level, browser-global resource,
all use of that low-level resource should be done via the StaticPortal.
In the app, the high-level StaticPortal replace the low-level resource, it does not complement it.

## StaticPortal as a pattern to extend the platform

The StaticPortal is a development practice to extend or customize the platform.
The StaticPortal provide an alternative interface that by the rest of the app is considered basic/primary.
The StaticPortal has no dependencies to the app, but parts of the app will completely depend on the StaticPortal.-

## StaticPortal as a PWA pattern

The StaticPortal is a pattern not only for several windows of the same app running at once, but 
also for several windows of the same app running at different times. It is a PWA pattern.

## Discussion: Why safe-ish, not safe?

Even though state changes will not creep in nor out of the StaticPortal if set up and used correctly 
(ie. the underlying resource is not accessed from your app outside of the portal), 
you should still consider the StaticPortal safe-ish, and not safe.
The reason is that you develop/employ two different, complex resources on top of the platform, as opposed to one.
This makes debugging harder, and you might have errors that as consequence of interaction between
the parts (cf. race conditions) that you cannot for example simply unit test out of the picture.

## Example 1: LocalStorage

The localStorage is a good example of browser wide state.
Lets see how it works:
An app is opened in one window and the app in the window A.
Window A app adds a data entry to the localStorage: `a`: `2`.
Then the same app is opened in another window B. 
This produces a second app instance with a separate "single state".
But, both app instances share access to and will both write to and receive the same cache resources.
So, if the app in window B queries localStorage for `a`, it will receive `2`.
Thus, while the single state object is singular *per window*, the localStorage is singular *per browser*.

## Antipattern: BrowserSingleState

One "solution" to this problem would be to make the state singular at the browser level.
This would mean that when each window stored their state information, they would do so in, yes, the localStorage.
But. This is a very bad "solution" for three reasons:
1. writing and reading data to the localStorage (on the browser level) is **too slow**,
2. only persistable, JSONified data can be stored in the localStorage, and
3. only works on the same computer, ie. if the users switches screen, the state is no longer accessible.

Thus, for many apps, employing a JSONified SuperSingleState at the browser level is a non-starter.

## Pattern StaticPortal

A solution to this problem is 

## Example: CacheFile


Instead, the app must consider the browser cache as an async, external resource.
The app can add files to the cache, update files in the cache and listen for/observe changes of cached files.

