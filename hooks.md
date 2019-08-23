## useProgress

## useProgressTransition

## useRenderEvent

## useEventTime

Works like [useState](https://reactjs.org/docs/hooks-reference.html#usestate), except the the state variable is set to the current time when the returned function is called. Useful for forcing useMemo hooks to recalculate (by using the time as a dependency).

Definition:
```javascript
function useEventTime(void): [ Date, Function ]
```

Usage:
```javascript
const [ modifiedTime, setModifiedTime ] = useEventTime();
const value = useMemo(() => {
    /* ... */
}, [ modifiedTime ]);

useEffect(() => {
    dataSource.addEventListener('change', setModifiedTime);
    return () => {
        dataSource.removeEventListener('change', setModifiedTime);
    };
}, [ dataSource ]);
```

## useListener

Works like [useCallback](https://reactjs.org/docs/hooks-reference.html#usecallback), except it always invokes the callback function last given to it. This means the callback is called with the variable scope of the last rendering cycle.

This hook is especially useful in asynchronous components, where your callback might need to use variables set by asynchronously.

Definition:
```javascript
function useListener(f: (evt) => any): Function
```

Usage:
```javascript
const handleSaveButtonClick = useListener((evt) => {
    /* ... */
});
```

## useAsyncEffect

Works like [useEffect](https://reactjs.org/docs/hooks-reference.html#useeffect), except it accepts an asynchronous function.

Definition:
```javascript
function useAsyncEffect(f: async (evt) => Function, deps: any[]): void
```

Usage:
```javascript
useAsyncEffect(async () => {
    const socket = await openSocket();
    return () => {
        closeSocket(socket);
    };
});
```

## useErrorCatcher

Definition:
```javascript
function useErrorCatcher(rethrow?: boolean): [ Error, Function ]
```

Usage:
```javascript
const [ error, run ] = useErrorCatcher();

run(async () => {
    /* ... */
});
```

## useComputed

Works like [useMemo](https://reactjs.org/docs/hooks-reference.html#usememo), except you can force recalculation by calling the returned function. This is useful in situation where the computed value is dependent on states not tracked by your own code (they're in the DOM, for instance).

Definition:
```javascript
function useComputed(f: () => any, deps: any[]): any
```

Usage:
```javascript
const [ value, recalc ] = useComputed(() => {
    /* ... */
});

useEffect(() => {
    document.body.addEventListener('scroll', recalc);
    return () => {
        document.body.removeEventListener('scroll', recalc);
    };
}, [])
```

## useLastAcceptable

Return the last value indicated as acceptable. This hook is useful in situations where you need the previous value of a prop. For instance, a pop-up alert box will close when it has no contents to display. During the time when it transitions out we would want to render the previous contents.

Definition:
```javascript
function useLastAcceptable(value: any, acceptable: boolean | (value) => boolean): any
```

If `acceptable` is a function, it'll be called with `value` as the argument to determine if it's acceptable.

Usage:
```javascript
const contents = useLastAcceptable(children, !!children);
```

## useSaveBuffer

## useAutoSave

## useEventProxy
