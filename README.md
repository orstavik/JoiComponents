# Web component design patterns

## The native web components cookbook

"Web component design patterns" are recipes for simple and reusable web components.
All patterns run natively in any browser that supports web components and vanilla es6.

> If you have your own use cases, problems, patterns and/or solutions, please let us know!

## Chapter 1: How to make a web component?

1. [Intro: Web components](book/chapter1/1_Intro_web_comp.md)
2. [HowTo: CreateElement](book/chapter1/2_HowTo_CreateElement.md)
3. [HowTo: CreateShadowDom](book/chapter1/3_HowTo_CreateShadowDom.md)
4. [HowTo: CloseShadowDOM](book/chapter1/4_HowTo_closed_shadowRoot.md)
5. [WhatIs: Upgrade](book/chapter1/5_WhatIs_upgrade.md)
6. [Pattern: TemplateSwitcheroo](book/chapter1/6_Pattern_TemplateSwitcheroo.md)
7. [HowTo: attributeChangedCallback](book/chapter1/7_HowTo_attributeChangedCallback.md)
8. [Pattern: TheEnd](book/chapter1/8_Pattern_TheEnd.md)
9. [Anti-pattern: TwoConstructors](book/chapter1/9_Anti_TwoConstructors.md)
10. [RulesOfThumb for web components](book/chapter1/10_rulesOfThumb.md)

## Chapter 2: ShadowDOM

1. [What is: shadowDOM](book/chapter2_slot_basics/1_WhatIs_shadowDOM.md)
2. [HowTo: `<slot>`](book/chapter2_slot_basics/2_HowTo_slot.md)
3. [HowTo: name `<slot>`](book/chapter2_slot_basics/3_HowTo_nameSlots.md)
4. [HowTo: `<slot>` fallback nodes](book/chapter2_slot_basics/4_HowTo_slot_fallback_nodes.md)
5. [HowTo: `.assignedNodes()`](book/chapter2_slot_basics/5_HowTo_assignedNodes.md)
6. [Pattern: style `<slot>`](book/chapter2_slot_basics/6_HowTo_style_slot.md)
7. [Pattern: `::slotted(*)`](book/chapter2_slot_basics/7_HowTo_slotted.md)

## Chapter 3: SlotMatroska

1. [HowTo: chain slots](book/chapter3_slot_matroska/1_HowTo_chainSlots.md)
2. [Problem: SlotMatroska](book/chapter3_slot_matroska/2_Problem_SlotMatroska.md)
3. [Problem: SlotStyleCreep](book/chapter3_slot_matroska/3_Problem_SlotStyleCreep.md)
4. [Problem: FallbackNodesFallout](book/chapter3_slot_matroska/4_Problem_FallbackNodesFallout.md)
5. [Problem: FlattenTrueIsFalse](book/chapter3_slot_matroska/5_Problem_FlattenTrueIsFalse.md)
6. [Problem: NoFallbackSlotchange](book/chapter3_slot_matroska/6_Problem_NoFallbackSlotchange.md)
7. [Problem: SlotchangeSurprise](book/chapter3_slot_matroska/7_Problem_SlotchangeSurprise.md)
8. [Theory: DomNodesAndBranch](book/chapter3_slot_matroska/8_Theory_DomNodesAndBranch.md)
9. [Problem: PrematureSlotchange](book/chapter3_slot_matroska/9_Problem_PrematureSlotchange.md)
10. [Problem: SlotchangeNipSlip](book/chapter3_slot_matroska/10_Problem_SlotchangeNipSlip.md)
11. [Theory: VariableExpectations](book/chapter3_slot_matroska/11_Theory_VariableExpectations.md)

## Chapter 4: `slotCallback(..)`

1. [Pattern: NaiveSlotCallback](book/chapter4_slotCallback/1_Pattern_NaiveSlotCallback.md)
2. [Pattern: MySlotCallback](book/chapter4_slotCallback/2_Pattern_MySlotCallback.md)
3. [Pattern: SlotCallbackAfterDCL](book/chapter4_slotCallback/3_Pattern_SlotCallbackAfterDCL.md)
4. [Pattern: PostSlotchangeCallback](book/chapter4_slotCallback/4_Pattern_PostSlotchangeCallback.md)
5. [Pattern: SlotchangeCallback](book/chapter4_slotCallback/5_Pattern_SlotchangeCallback.md)
6. [Pattern: SlotChildCallback](book/chapter4_slotCallback/6_Pattern_SlotChildCallback.md)
7. [Pattern: SlottablesEvent](book/chapter4_slotCallback/7_Pattern_SlottablesEvent.md)
8. [Pattern: SlottablesCallback](book/chapter4_slotCallback/8_Pattern_SlottablesCallback.md)
<!-- X. [Make this chapter into a mixin chapter for How to `MutationObserver` mixin?](book/chapter1/HowTo_MutationObserver.md)-->
9. [Pattern: FalloutFix](book/chapter4_slotCallback/9_Pattern_FalloutFix.md)

## Chapter 5: Style

1. [Intro: Style_in_web_comps](book/chapter5_style/0_Intro_Style_in_web_comps.md)
2. [HowTo: shadowStyle](book/chapter5_style/1_HowTo1_shadowStyle.md)
3. [Problem: ThisStyleIsNotMyStyle](book/chapter5_style/2_Problem_ThisStyleIsNotMyStyle.md)
4. [HowTo: HostWithStyle](book/chapter5_style/3_HowTo2_HostWithStyle.md)
5. [HowTo: CssVariables](book/chapter5_style/4_HowTo3_CssVariables.md)
6. [Pattern: CssCoordinatorClass](book/chapter5_style/5_Pattern_CssCoordinatorClass.md)
7. [Pattern: CssCoordinatorAttribute](book/chapter5_style/6_Pattern_CssCoordinatorAttribute.md)
8. [Pattern: StyleCoordinatorAttribute](book/chapter5_style/7_Pattern_StyleCoordinatorAttribute.md)
9. [Pattern: NaiveStyleCallback](book/chapter5_style/8_Pattern_NaiveStyleCallback.md)
10. [Mixin: NaiveStyleCallback](book/chapter5_style/9_Mixin_NaiveStyleCallback.md)
11. [HowTo: TraverseTheCssom](book/chapter5_style/10_HowTo_TraverseTheCssom.md)
12. [Pattern: TreeOrderedCssomTraversal](book/chapter5_style/11_Pattern_TreeOrderedCssomTraversal.md)
13. [Mixin: StyleCallback](book/chapter5_style/12_Mixin_StyleCallback.md)
14. [Test: StyleCallback](book/chapter5_style/13_Test_StyleCallback.md)

## Chapter 6: Layout

1. [HowTo: ReactToLayout](book/chapter6_layout/1_HowTo_ReactToLayout.md)
2. [Pattern: MediaQueryAttribute](book/chapter6_layout/2_Pattern_MediaQueryAttribute.md)
3. [Pattern: ResizeAttribute](book/chapter6_layout/3_Pattern_ResizeAttribute.md)
4. [Pattern: ResponsiveElement](book/chapter6_layout/4_Pattern_ResponsiveElement.md)
5. [Problem: DOM_folding](book/chapter6_layout/5_Problem_DOM_folding.md)
6. [Pattern: NaiveLayoutAttributes](book/chapter6_layout/6_Pattern_NaiveLayoutAttributes.md)
7. [Pattern: LayoutAttributes](book/chapter6_layout/7_Pattern_LayoutAttributes.md)

## Chapter 7: HTML Composition

1. [Pattern: JsonAttributes](book/chapter7_html_comp/1_Pattern_JsonAttributes.md)
2. [Pattern: StubbornAttribute](book/chapter7_html_comp/2_Pattern_StubbornAttribute.md)
3. [FosterParentChild (`<ul-li>`)](book/chapter7_html_comp/Pattern1_FosterParentChild.md)
4. [HelicopterParentChild (`<ol>+<li>`)](book/chapter7_html_comp/Pattern2_HelicopterParentChild.md)
5. [CulDeSacElements (`<img>`)](book/chapter7_html_comp/Pattern3_CulDeSacElements.md)
6. [MiniMeDOM (make the index in `<the-book>+<a-chapter>`)](book/chapter7_html_comp/Pattern4_MiniMe.md)
7. [Pattern: JSONAttributes](book/chapter7_html_comp/Pattern_jsonAttributes.md)
8. [Discussion: HTML composition](book/chapter7_html_comp/Discussion_HTML_composition.md)

## Chapter 8: Mixins

1. [Reactive method](book/chapter8_HowToMakeMixins/1_Pattern_ReactiveMethod.md)
2. [Isolated functional mixin](book/chapter8_HowToMakeMixins/2_Pattern_FunctionalMixin.md)
3. [StaticSetting](book/chapter8_HowToMakeMixins/3_Pattern_StaticSettings.md)
4. [AutoAttribute](book/chapter8_HowToMakeMixins/4_Pattern_AutoAttribute.md)
5. [SteppedAutoAttribute](book/chapter8_HowToMakeMixins/5_Pattern_SteppedAutoAttribute.md)
6. [EventRecording](book/chapter8_HowToMakeMixins/6_Pattern_EventRecording.md)
7. [DebounceCallbacks](book/chapter8_HowToMakeMixins/7_Pattern_DebounceCallbacks.md)
8. [OptionalCallbacksEvents](book/chapter8_HowToMakeMixins/8_Pattern_OptionalCallbacksEvents.md)
9. [PrivateSymbols](book/chapter8_HowToMakeMixins/9_Pattern_PrivateSymbols.md)
10. [MixinSingleton](book/chapter8_HowToMakeMixins/10_Pattern_MixinSingleton.md)
11. [FirstCallback](book/chapter8_HowToMakeMixins/11_Pattern_FirstCallback.md)
12. [BatchedConstructorCallbacks](book/chapter8_HowToMakeMixins/12_Pattern_BatchedConstructorCallbacks.md)
13. [BatchedCallbacks](book/chapter8_HowToMakeMixins/13_Pattern_BatchedCallbacks.md)
14. [TimedLifecycleCallbacks](book/chapter8_HowToMakeMixins/14_Pattern_TimedLifecycleCallbacks.md)
15. [TreeOrderedBatchedCallbacks](book/chapter8_HowToMakeMixins/15_Pattern_TreeOrderedBatchedCallbacks.md)
16. [HowTo: isolate FunctionalMixins](book/chapter8_HowToMakeMixins/16_HowTo_IsolatedFunctionalMixin.md)

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
