#### 0.3.1 &mdash; June 15, 2021

* Add `call`.

#### 0.3.0 &mdash; May 28, 2021

* Add helpers: `tp.group`, `tp.groupCount`, `tp.bin`, `tp.binCount`, `tp.layer`, `tp.facet`, `tp.hStack`, `tp.vStack`, `tp.range`, `tp.linSpace`.
* Remove `tp.stack`.
* Add `xReverse` and `yReverse` options.
* Change `ease` channel default to `'linear'`.

#### 0.2.0 &mdash; May 7, 2021

* Add updates: updatable channels, `tp.update`, `tp.mergeUpdate`.
* Add marks:  `circle`, `path`.
* Add channels: `front`, `listen`, `delay`, `duration`, `ease`.
* Change `click`, `mouseenter`, `mouseleave`, `subplot` from options to channels.
* Can use `borderRadius` channel with bars.
* Remove channels: `callback`, `attach`, `noteAttach`, `noteClass`, `noteName`.
* Dataset can be a flat array or a positive integer.
* Non-xy channels for single-mark types can use accessor functions &mdash; only called once so are passed the entire dataset rather than a datum.
* Add `tp.lookup` helper function.
* Remove `drop` method.
* Add `setPaneSize` option; remove `paneWidth` and `paneHeight` options.
* Allow `'preserve'` for `width` or `height`.
* `areaScale` option must be an array or a function.

#### 0.1.0 &mdash; March 23, 2021

* Initial Release