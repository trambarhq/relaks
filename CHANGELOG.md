# CHANGELOG

## 2.1.9

* Added warning when non-function is passed to Relaks.use().
* Fixed display name of components.

## 2.1.4

* Added relaks-transform-memo plugin.

## 2.1.0

* Migrated to ES6 and Rollup.
* Added numerous helper hooks.

## 2.0.2

* Disabled check for show() call in class-based component.

## 2.0.1

* Fixed progressive rendering

## 2.0.0

* Implemented hook support
* Completely reworked rendering cycle
* Using ESM import to allow proper tree-shaking (Babel env preset needs to set to modules = false)

## 1.1.9

* Added plant()

## 1.1.8

* Fixed event handlers when seeded contents are employed

## 1.1.7

* Added support for seeding components initial appearance

## 1.1.6

* Preventing timeout function from causing JavaScript error

## 1.1.5

* Removed dependency on componentWillMount()
* Preventing calls to forceUpdate() after component has been unmounted

## 1.1.4

* Added support for error boundary
* Added set()

## 1.1.3

* Updated packages used for testing

## 1.1.1

* Fixed missing reference regression

## 1.1.0

* Added support for Preact

## 1.0.1

* Fixed meanwhile.delay()
