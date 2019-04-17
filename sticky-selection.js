import { useEffect } from 'react';

function useStickySelection(inputRefs) {
    if (!(inputRefs instanceof Array)) {
        inputRefs = [ inputRefs ];
    }
    var inputs = inputRefs.map(function(inputRef) {
        var node = inputRef.current;
        if (node) {
            return {
                node: node,
                value: node.value,
                start: node.selectionStart,
                end: node.selectionEnd,
            };
        }
    });

    useEffect(function() {
        inputs.forEach(function(input) {
            if (input) {
                var node = input.node;
                var previous = input.value;
                var current = node.value;
                if (previous !== current) {
                    var start = findNewPosition(input.start, previous, current);
                    var end = findNewPosition(input.end, previous, current);
                    if (typeof(start) === 'number' && typeof(end) === 'number') {
                        node.selectionStart = start;
                        node.selectionEnd = end;
                    }
                }
            }
        });
    });
}

function findNewPosition(index, previous, current) {
    if (typeof(index) === 'number') {
        if (typeof(previous) === 'string' && typeof(current) === 'string') {
            var before = previous.substr(0, index);
            var index1 = current.indexOf(before);
            if (index1 !== -1) {
                return index1 + before.length;
            }
            var after = previous.substr(index);
            var index2 = current.lastIndexOf(after);
            if (index2 !== -1) {
                return index2;
            }
        }
    }
}

export {
    useStickySelection
};
