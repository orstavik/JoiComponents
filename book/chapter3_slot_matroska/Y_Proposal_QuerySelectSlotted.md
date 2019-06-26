How nice it would be if instead of `name="slotmeSomeplace"`, the `slot` elements could use queryselection expressions to identify which nodes and elements that should belong to it.

This would first of all enable web comps to slot elements of certain types in certain slots.

It could also function with the `[slot='name']` to be backward compatible.

But most importantly, it would enable the user of the elements to not disturb the order of the elements in different css scenarios. or would it.. no maybe not. Css would need to be able to turn on/off different slots. If a slot is `display: none`, then it will not grab elements? I don't know.

