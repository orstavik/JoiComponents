# Intro: web component

Web components are custom building blocks for web apps. They are pieces of lego you mold yourself.
The web component are built using *two* closely related native API in the browser: CustomElements
and ShadowDOM.

This chapter gives a simple, to the point introduction to how you can build your web components
using these two native APIs. The chapter is divided into the following sub chapters:

First, the creation of web components are discussed. These patterns all concern how you create a
web component as a custom element with a shadowDOM, and then describes some questions you are likely
to face quite early in the development process concerning the `open` and `closed` mode of shadowDOM,
what the custom element upgrade process entails, and how web component construction can be delayed.

1. [HowTo: CreateElement](2_HowTo_CreateElement.md)
2. [HowTo: CreateShadowDom](3_HowTo_CreateShadowDom.md)
3. [HowTo: CloseShadowDOM](4_HowTo_closed_shadowRoot.md)
4. [WhatIs: Upgrade](5_WhatIs_upgrade.md)
5. [Pattern: TemplateSwitcheroo](6_Pattern_TemplateSwitcheroo.md)
6. [Anti-pattern: TwoConstructors](9_Anti_TwoConstructors.md)

The second part of the chapter describes the other mayor steps in the web component lifecycle
such as `(dis)connectedCallback()`, `attributeChangedCallback()` and TheEnd of the web component
lifecycle.

7. [HowTo: attributeChangedCallback](7_HowTo_attributeChangedCallback.md)
8. [Pattern: TheEnd](8_Pattern_TheEnd.md)

The chapter also includes a list of [RulesOfThumb](10_rulesOfThumb.md) to aid developers avoid the most
common pitfalls.

## More to come!

Subsequent chapters discuss more advanced topics such as:
1. assembling advanced web component functionality as mixins,
2. slotting elements,
3. styling web components,
4. managing layout reactions,
5. providing polyfills,
6. patterns for HTML composition, and
7. discussions about web component architecture and design methodology

Later chapters will extend and deepen your understanding of the web component lifecycle. This insight
will highlight three missing pieces in the current web component standard:

1. slotCallback()
2. styleCallback()
3. LayoutAttributes that control styles and can triggering attributeChangedCallback()

## References

 *
