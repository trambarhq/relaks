Relaks
------

Relaks is a minimalist library that give [React](https://reactjs.org/)
components a [promise-based](https://promisesaplus.com/), asynchronous interface.
Instead of `render()`, Relaks components implement `renderAsync()`, a method that
returns a promise of a `ReactElement`.

* [Basic example](#basic-example)
* [Example with multiple async operations](#example-with-multiple-async-operations)
* [ES7 syntax](#es7-syntax)
* [Interruption of rendering](#interruption-of-rendering)
* [Progressive rendering delay](#progressive-rendering-delay)
* [Error handling](#error-handling)
* [API reference](#api-reference)
* [Life-cycle functions](#life-cycle-functions)
* [ES5 convention](#es5-convention)
* [Preact support](#preact-support)
* [License](#license)
* [Acknowledgement](#acknowledgement)

## Basic example

```javascript
import { AsyncComponent } from 'relaks';

class StoryView extends AsyncComponent {
    renderAsync(meanwhile) {
        let db = this.props.database;
        let query = {
            table: 'story',
            criteria: {
                id: this.props.storyID
            }
        };
        meanwhile.show(<div>Loading</div>);        
        return db.findOne(query).then((story) => {
            return (
                <div>
                    <h1>{story.title}</h1>
                    <p>{story.text}</p>
                </div>
            );
        });
    }
}
```

`renderAsync()` may also return a `ReactElement` or null, in which case it
behaves like a normal React component.

The parameter `meanwhile` is an object with a number of methods, the chief of
which is `show()`. As the name implies, it lets you show something while an
asynchronous operation--typically data retrieval--is happening. `show()` may be
called multiple times during a single rendering cycle. This allows a component
to render progressively as data arrives.

`Relaks.Component` is also available as `Relaks.AsyncComponent`, so you can
import both it and the standard React `Component`.

## Example with multiple async operations

```javascript
import { AsyncComponent } from 'relaks';

class StoryView extends AsyncComponent {
    renderAsync(meanwhile) {
        let db = this.props.database;
        let query1 = {
            table: 'story',
            criteria: {
                id: this.props.storyID
            }
        };
        meanwhile.show(<div>Loading</div>);        
        return db.findOne(query1).then((story) => {
            meanwhile.show(
                <div>
                    <h1>{story.title}</h1>
                    <h2>Author: -</h2>
                    <h3>Category: -</h3>
                    <p>{story.text}</p>
                </div>
            );

            let query2 = {
                table: 'author',
                criteria: {
                    id: story.author_id
                }
            };
            return db.findOne(query2).then((author) => {
                meanwhile.show(
                    <div>
                        <h1>{story.title}</h1>
                        <h2>Author: {author.name}</h2>
                        <h3>Category: -</h3>
                        <p>{story.text}</p>
                    </div>
                );

                let query3 = {
                    table: 'category',
                    criteria: {
                        id: story.category_id
                    }
                };
                return db.findOne(query3).then((category) => {
                    return (
                        <div>
                            <h1>{story.title}</h1>
                            <h2>Author: {author.name}</h2>
                            <h3>Category: {category.name}</h3>
                            <p>{story.text}</p>
                        </div>
                    );
                });
            });
        });
    }
}
```

In the code above, `renderAsync()` first retrieves the story object. It calls
`meanwhile.show()` to render information that's immediately available, namely
the story's title and text. The author and category names are not yet
available, so we put dashes in their place. Then we proceed to retrieve the
related objects. Once these are retrieved, actual text replaces the dashes.

There's a great deal of redundant in the example code. Typically it's advisable
to put the UI code in a separate component:

```javascript
import { PureComponent } from 'react';
import { AsyncComponent } from 'relaks';

class StoryView extends AsyncComponent {
    renderAsync(meanwhile) {
        let db = this.props.database;
        let props = {
            story: undefined,
            author: undefined,
            category: undefined,
        };
        meanwhile.show(<StoryViewSync {...props} />);        
        return Promise.resolve().then(() => {
            let query1 = {
                table: 'story',
                criteria: {
                    id: this.props.storyID
                }
            };
            return db.findOne(query1).then((story) => {
                props.story = story;
            });
        }).then(() => {
            meanwhile.show(<StoryViewSync {...props} />);        
        }).then(() => {
            let query2 = {
                table: 'author',
                criteria: {
                    id: props.story.author_id
                }
            };
            return db.findOne(query2).then((author) => {
                props.author = author;
            });
        }).then(() => {
            meanwhile.show(<StoryViewSync {...props} />);        
        }).then(() => {
            let query3 = {
                table: 'category',
                criteria: {
                    id: props.story.category_id
                }
            };
            return db.findOne(query3).then((category) => {
                props.category = category;
            });
        }).then(() => {
            return <StoryViewSync {...props} />;
        });
    }
}

class StoryViewSync extends PureComponent {
    render() {
        let { story, author, category } = this.props;
        if (!story) {
            return <div>Loading</div>;
        }
        return (
            <div>
                <h1>{story.title}</h1>
                <h2>Author: {author ? author.name : '-'}</h2>
                <h3>Category: {category ? category.name : '-'}</h3>
                <p>{story.text}</p>
            </div>
        );
    }
}
```

## ES7 syntax

The example above becomes a lot cleaner when we use the ES7 await operator:

```javascript
class StoryView extends AsyncComponent {
    async renderAsync(meanwhile) {
        let db = this.props.database;
        let props = {};
        meanwhile.show(<StoryViewSync {...props} />);        
        props.story = await db.findOne({
            table: 'story',
            criteria: {
                id: this.props.storyID
            }
        });
        meanwhile.show(<StoryViewSync {...props} />);        
        props.author = await db.findOne({
            table: 'author',
            criteria: {
                id: props.story.author_id
            }
        });
        meanwhile.show(<StoryViewSync {...props} />);
        props.category = await db.findOne({
            table: 'category',
            criteria: {
                id: props.story.category_id
            }
        });
        return <StoryViewSync {...props} />;
    }
}
```

## Interruption of rendering

When a Relaks component receives new props (or experiences a state change), its
`renderAsync()` is called to start a new rendering cycle. If the component is
still in the middle of rendering--i.e. the promise returned earlier had not yet
been fulfilled--this rendering cycle would be cancelled. If `meanwhile.onCancel`
is set, the function would be invoked at this point.

A call to `meanwhile.show()` in the defunct rendering cycle would trigger an
`AsyncRenderingInterrupted` exception, breaking the promise chain. In the
example above, if the component receives a new story ID while it's fetching the
story, the call to `meanwhile.show()` after the story is retrieved will throw.
We won't end up wasting bandwidth fetching the author and category. Relaks will
silently swallow the exception.  

## Progressive rendering delay

By default, progressive rendering will not start immediately. The promise
returned by `renderAsync()` has a small window of time to fulfill itself. Only
if it fails to do so within that window would progressive rendering occur. If
it fulfills quickly (because everything in the promise chain is cached), then
the calls to `meanwhile.show()` would produce no effect.

The default delay is 50ms during the initial rendering cycle and infinity in
subsequent cycles. Basically, progressive rendering is turned off once a
component manages to fully render itself. You can alter the delay intervals
with a call to `meanwhile.delay()`. You can change the default values with
calls to `Relaks.set()`.

For a very brief moment a Relaks component will be blank. If this causes layout
or visual glitches, you can force Relaks to render the progress element
initially by passing `'initial'` as the second parameter to `meanwhile.show()`.
This needs to happen prior to any `await` operation (i.e. outside of callbacks
to `.then()`). Example:

```javascript
class StoryView extends AsyncComponent {
    async renderAsync(meanwhile) {
        let db = this.props.database;
        let props = {};
        meanwhile.show(<StoryViewSync {...props} />, 'initial');
        props.story = await db.findOne({
            table: 'story',
            criteria: {
                id: this.props.storyID
            }
        });
        meanwhile.show(<StoryViewSync {...props} />);        
        props.author = await db.findOne({
            table: 'author',
            criteria: {
                id: props.story.author_id
            }
        });
        meanwhile.show(<StoryViewSync {...props} />);
        props.category = await db.findOne({
            table: 'category',
            criteria: {
                id: props.story.category_id
            }
        });
        return <StoryViewSync {...props} />;
    }
}
```

## Error handling

When a promise rejection is not explicitly handled in `renderAsync()`, Relaks
will catch the rejection, force the component to refresh, then promptly throw
the error object again inside its `render()` method. Doing so permits React's
[error boundary](https://reactjs.org/docs/error-boundaries.html) mechanism to
capture the error as it would errors occurring in synchronous code.

When there is no support for error boundaries (Preact, React 15 and below),
Relaks will call an error handler instead. The default handler just dumps the
error object into the JavaSCript console. Use `Relaks.set()` to set a custom
handler.

## Life-cycle functions

`Relaks.AsyncComponent` implements `componentWillMount()` and
`componentWillUnmount()` in order to monitor whether a component is still
mounted. If you override them be sure to call the parent implementations.

`Relaks.AsyncComponent` also implements `shouldComponentUpdate()`. Shallow
comparisons are done on a component's props and state to determine whether it
needs to be rerendered. Override the method if you need more sophisticated
behavior.

## API reference

* [Methods](#methods)
  * [meanwhile.check](#meanwhilecheck)
  * [meanwhile.delay](#meanwhiledelay)
  * [meanwhile.revising](#meanwhilerevising)
  * [meanwhile.show](#meanwhileshow)
  * [Relaks.set](#relaksset)

* [Event handlers](#event-handlers)
  * [meanwhile.onCancel](#meanwhileoncancel)
  * [meanwhile.onComplete](#meanwhileoncomplete)
  * [meanwhile.onProgress](#meanwhileonprogress)

* [Properties](#properties)
  * [meanwhile.current](#meanwhilecurrent)
  * [meanwhile.previous](#meanwhileprevious)
  * [meanwhile.prior](#meanwhileprior)

### Methods

#### meanwhile.check

```typescript
function check(): void
```

Check if the rendering cycle has been superceded by a new one. If so throw an
exception to end it. Ensure component is mounted as well. Generally you would
use `meanwhile.show()` instead.

#### meanwhile.delay

```typescript
function delay(empty: number, rendered: number): void
```

Set progressive rendering delay, for when the component is empty and when
it has fully rendered previously. When a parameter is `undefined`, it's ignored.

#### meanwhile.revising

```typescript
function revising(): boolean
```

Return true if the component has previously been fully rendered.

#### meanwhile.show

```typescript
function show(element: ReactElement, disposition: string): boolean
```

Render an element while awaiting the completion of asynchronous operations,
possibly after a delay. Use `disposition` to force immediate rendering. When
it's `'always'`, the element is always rendered. When it's `'initial'`, the
element is rendered if the component would otherwise be empty.

A return value of `false` means rendering is being deferred.

This method calls `meanwhile.check()` to ascertain that the rendering cycle is
still valid.

#### Relaks.set

```typescript
function set(name: string, value: any)
```

Set one of Relaks's global parameters. `name` can be one of the following:

* **delayWhenEmpty** - The amount of time given to promises returned by
  `renderAsync()` before contents passed to `meanwhile.show()` appears when
  nothing has been rendered yet. In milliseconds. The default is 50.
* **delayWhenRendered** - The time allowance when the component has fully
  rendered previously. The default is infinity.
* **errorHandler** - Error handler used when there is no support for error
  boundaries. The default is `console.error()`.

### Event handlers

Relaks will call event handlers attached to the meanwhile object at certain
points during the rendering cycle. They're useful for debugging and
optimization.

#### meanwhile.onCancel

Triggered when a rendering cycle is canceled.

#### meanwhile.onComplete

Triggered when a render cycle is coming to an end, after the promise returned by
`renderAsync` is fulfilled, but prior to the contents is rendered.

#### meanwhile.onProgress

Triggered when a contents passed to `meanwhile.show()` is about to be rendered.
The event object will have an `elapsed` property, giving the number of
milliseconds elapsed since the start of the rendering cycle.

### Properties

The following properties are provided mainly for debugging purpose.

#### meanwhile.current

An object containing component's current props and state.

#### meanwhile.previous

An object containing component's previous props and state.

#### meanwhile.prior

An object containing component's props and state prior to rerendering. It will
be the same as `meanwhile.previous` unless the previous rendering cycle was
interrupted, in which case `previous` would have the props and state of the
interrupted cycle, while `prior` would have those of the last completed cycle.

## ES5 convention

Relaks supports the older method of creating a component:

```javascript
var Relaks = require('relaks/legacy');

module.exports = Relaks.createClass({
    displayName: 'StoryView',

    renderAsync: function(meanwhile) {
        /* ... */
    },
});
```

## Preact support

Relaks has built-in support for [Preact](https://preactjs.com/). Simply import
from 'relaks/preact' instead of 'relaks'. `renderAsync()` will receive `props`,
`state`, and `context` in addition to the meanwhile object.

Import from `'relaks/preact'` instead of `'relaks'`:

```javascript
import { h, Component } from 'preact';
import { AsyncComponent } from 'relaks/preact';

/** @jsx h */
```

## License

This project is licensed under the MIT License - see the [LICENSE](#LICENSE)
file for details

## Acknowledgement

Relaks is named after a [bar in Krakow, Poland](https://www.google.pl/maps/place/Relaks+craftbeer+%26+food/@50.0626813,19.941311,18.08z/data=!4m5!3m4!1s0x47165b11a033a251:0x16ac7571f9bb26c!8m2!3d50.0622392!4d19.9422542?hl=en).

![Relaks](docs/img/relaks.jpg)
