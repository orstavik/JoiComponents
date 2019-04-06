# Web component design patterns

## The native web components cookbook

"Web component design patterns" is a set of recipes for developing simple and reusable web components. 
This book is framework independent: all patterns are intended to run natively in any browser 
that supports web components and vanilla es6. 
However, the book is meant to be framework relevant: 
the patterns should all be useful to understand either how to make web components in other frameworks 
or how other frameworks could or should function internally.

Web component patterns consists of the following types of recipes:
* problem descriptions that detail and frame frequent use-cases,
* patterns that explain how to solve these problems,
* mixins that illustrate how these patterns can be implemented and reused, plus
* demos and tests of both problems, patterns and implementations.

> If you have your own use cases, problems, patterns and/or solutions, please let us know!

## Chapter 1: How to make a web component?
1. [Intro: Web components](book/chapter1/1_Intro_web_comp)
2. [HowTo: CreateElement](book/chapter1/2_HowTo_CreateElement)
3. [HowTo: CreateShadowDom](book/chapter1/3_HowTo_CreateShadowDom)
4. [HowTo: CloseShadowDOM](book/chapter1/4_HowTo_closed_shadowRoot)
5. [WhatIs: Upgrade](book/chapter1/5_WhatIs_upgrade.md)
6. [Pattern: TemplateSwitcheroo](book/chapter1/6_Pattern_TemplateSwitcheroo)
7. [HowTo: attributeChangedCallback](book/chapter1/7_HowTo_attributeChangedCallback)
8. [Pattern: TheEnd](book/chapter1/8_Pattern_TheEnd)
9. [Anti-pattern: TwoConstructors](book/chapter1/9_Anti_TwoConstructors)
10. [RulesOfThumb for web components](book/chapter1/10_rulesOfThumb)

## Chapter 2: ShadowDOM
1. [What is: shadowDOM](book/chapter2_slot_basics/1_WhatIs_shadowDOM)
2. [HowTo: `<slot>`](book/chapter2_slot_basics/2_HowTo_slot)
3. [HowTo: name `<slot>`](book/chapter2_slot_basics/3_HowTo_nameSlots)
4. [HowTo: `<slot>` fallback nodes](book/chapter2_slot_basics/4_HowTo_slot_fallback_nodes)
5. [HowTo: `.assignedNodes()`](book/chapter2_slot_basics/5_HowTo_assignedNodes)
6. [Pattern: style `<slot>`](book/chapter2_slot_basics/6_HowTo_style_slot)
7. [Pattern: `::slotted(*)`](book/chapter2_slot_basics/7_HowTo_slotted)

## Chapter 3: SlotMatroska
1. [HowTo: chain slots](book/chapter3_slot_matroska/1_HowTo_chainSlots)
2. [Problem: SlotMatroska](book/chapter3_slot_matroska/2_Problem_SlotMatroska)
3. [Problem: SlotStyleCreep](book/chapter3_slot_matroska/3_Problem_SlotMatroskaStyleCreep)
4. [Problem: FallbackNodesFallout](book/chapter3_slot_matroska/4_Problem_FallbackNodesFallout)
5. [Problem: FlattenTrueIsFalse](book/chapter3_slot_matroska/5_Problem_FlattenTrueIsFalse)
6. [Problem: NoFallbackSlotchange](book/chapter3_slot_matroska/6_Problem_NoFallbackSlotchange)
7. [Problem: SlotchangeSurprise](book/chapter3_slot_matroska/7_Problem_SlotchangeSurprise)
8. [Theory: DomNodesAndBranch](book/chapter3_slot_matroska/8_Theory_DomNodesAndBranch)
9. [Problem: PrematureSlotchange](book/chapter3_slot_matroska/9_Problem_PrematureSlotchange)
10. [Problem: SlotchangeNipSlip](book/chapter3_slot_matroska/10_Problem_SlotchangeNipSlip)
11. [Theory: VariableExpectations](book/chapter3_slot_matroska/11_Theory_VariableExpectations)

## Chapter 4: `slotCallback(..)`
1. [Pattern: NaiveSlotCallback](book/chapter4_slotCallback/1_Pattern_NaiveSlotCallback)
2. [Pattern: MySlotCallback](book/chapter4_slotCallback/2_Pattern_MySlotCallback)
3. [Pattern: SlotCallbackAfterDCL](book/chapter4_slotCallback/3_Pattern_SlotCallbackAfterDCL)
4. [Pattern: PostSlotchangeCallback](book/chapter4_slotCallback/4_Pattern_PostSlotchangeCallback)
5. [Pattern: SlotchangeCallback](book/chapter4_slotCallback/5_Pattern_SlotchangeCallback)
6. [Pattern: SlotChildCallback](book/chapter4_slotCallback/6_Pattern_SlotChildCallback)
7. [Pattern: SlottablesEvent](book/chapter4_slotCallback/7_Pattern_SlottablesEvent)
8. [Pattern: SlottablesCallback](book/chapter4_slotCallback/8_Pattern_SlottablesCallback)
<!-- X. [Make this chapter into a mixin chapter for How to `MutationObserver` mixin?](book/chapter1/HowTo_MutationObserver.md)-->
9. [Pattern: FalloutFix](book/chapter4_slotCallback/9_Pattern_FalloutFix)

## Chapter 5: Style
1. [Intro: Style_in_web_comps](book/chapter5_style/0_Intro_Style_in_web_comps)
2. [HowTo: shadowStyle](book/chapter5_style/1_HowTo1_shadowStyle)
3. [Problem: ThisStyleIsNotMyStyle](book/chapter5_style/2_Problem_ThisStyleIsNotMyStyle)
4. [HowTo: HostWithStyle](book/chapter5_style/3_HowTo2_HostWithStyle)
5. [HowTo: CssVariables](book/chapter5_style/4_HowTo3_CssVariables)
6. [Pattern: CssCoordinatorClass](book/chapter5_style/5_Pattern_CssCoordinatorClass)
7. [Pattern: CssCoordinatorAttribute](book/chapter5_style/6_Pattern_CssCoordinatorAttribute)
8. [Pattern: StyleCoordinatorAttribute](book/chapter5_style/7_Pattern_StyleCoordinatorAttribute)
9. [Pattern: NaiveStyleCallback](book/chapter5_style/8_Pattern_NaiveStyleCallback)
10. [Mixin: NaiveStyleCallback](book/chapter5_style/9_Mixin_NaiveStyleCallback)
11. [HowTo: TraverseTheCssom](book/chapter5_style/10_HowTo_TraverseTheCssom)
12. [Pattern: TreeOrderedCssomTraversal](book/chapter5_style/11_Pattern_TreeOrderedCssomTraversal)
13. [Mixin: StyleCallback](book/chapter5_style/12_Mixin_StyleCallback)
14. [Test: StyleCallback](book/chapter5_style/13_Test_StyleCallback)

## Chapter 6: Layout
1. [HowTo: ReactToLayout](book/chapter6_layout/1_HowTo_ReactToLayout)
2. [Problem: DOM_folding](book/chapter6_layout/2_Problem_DOM_folding)
3. [Pattern: NaiveLayoutAttributes](book/chapter6_layout/3_Pattern_NaiveLayoutAttributes)
4. [Pattern: LayoutAttributes](book/chapter6_layout/4_Pattern_LayoutAttributes)

## Chapter 7: HTML Composition
1. [Introduction: HTML is list](book/chapter7_html_comp/Intro_HTML-Lists)
2. [FosterParentChild (`<ul-li>`)](book/chapter7_html_comp/Pattern1_FosterParentChild)
3. [HelicopterParentChild (`<ol>+<li>`)](book/chapter7_html_comp/Pattern2_HelicopterParentChild)
4. [CulDeSacElements (`<img>`)](book/chapter7_html_comp/Pattern3_CulDeSacElements)
5. [MiniMeDOM (make the index in `<the-book>+<a-chapter>`)](book/chapter7_html_comp/Pattern4_MiniMe)
6. [Pattern: JSONAttributes](book/chapter7_html_comp/Pattern_jsonAttributes)
7. [Discussion: HTML composition](book/chapter7_html_comp/Discussion_HTML_composition)

## Chapter 8: Mixins
1. [Reactive method](book/chapter2_HowToMakeMixins/Pattern1_ReactiveMethod.md)
2. [Isolated functional mixin](book/chapter2_HowToMakeMixins/Pattern2_FunctionalMixin.md)
3. [StaticSetting](book/chapter2_HowToMakeMixins/Pattern3_StaticSettings.md)
4. [EventRecording](book/chapter2_HowToMakeMixins/Pattern4_EventRecording.md)
5. [DebounceCallbacks](book/chapter2_HowToMakeMixins/Pattern5_DebounceCallbacks.md)
6. [OptionalCallbacksEvents](book/chapter2_HowToMakeMixins/Pattern6_OptionalCallbacksEvents.md)
7. [PrivateSymobl](book/chapter2_HowToMakeMixins/Pattern7_PrivateSymbols.md)
8. [MixinSingletons](book/chapter2_HowToMakeMixins/Pattern8_MixinSingleton.md)
8. [Discussion: isolate FunctionalMixins](book/chapter2_HowToMakeMixins/Discussion_IsolatedFunctionalMixin.md)

## Chapter 9: Polyfill web components
1. [Introduction: What's a polyfill?](book/chapter9_polyfill/Intro_Polyfills.md)
2. [FeatureDetection](book/chapter9_polyfill/Pattern1_FeatureDetection.md)
3. [Dynamically loading scripts](book/chapter9_polyfill/Pattern2_LoadScript.md)
4. [FeatureDetectAndPolyfill](book/chapter9_polyfill/Pattern3_FeatureDetectAndPolyfill.md)
5. [Batch calls to customElements polyfill](book/chapter9_polyfill/Pattern4_BatchCustomElementUpgrades.md)
6. [QueAndRecallFunctions](book/chapter9_polyfill/Pattern5_QueAndRecallFunctions.md)
7. [SuperFun](book/chapter9_polyfill/Pattern6_SuperFun.md)
8. [Polyfill loader](book/chapter9_polyfill/Pattern7_PolyfillLoader.md)
9. [Polyfill loader generator](book/chapter9_polyfill/Pattern8_PolyfillLoaderGenerator.md)
10. [Sync vs async polyfills](book/chapter9_polyfill/Discussion_sync_vs_async_polyfilling.md)
11. [Webcomponentsjs](book/chapter9_polyfill/Pattern9_webcomponentsjsCousin.md)