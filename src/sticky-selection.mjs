import React from 'react';

const { useEffect } = React;

function useStickySelection(inputRefs) {
  if (!(inputRefs instanceof Array)) {
    inputRefs = [ inputRefs ];
  }
  const inputs = [];
  for (let inputRef of inputRefs) {
    const node = inputRef.current;
    if (node) {
      inputs.push({
        node,
        value: node.value,
        start: node.selectionStart,
        end: node.selectionEnd,
      });
    }
  }
  useEffect(() => {
    for (let input of inputs) {
      const node = input.node;
      const previous = input.value;
      const current = node.value;
      if (previous !== current) {
        const start = findNewPosition(input.start, previous, current);
        const end = findNewPosition(input.end, previous, current);
        if (typeof(start) === 'number' && typeof(end) === 'number') {
          node.selectionStart = start;
          node.selectionEnd = end;
        }
      }
    }
  }, [ inputs ]);
}

function findNewPosition(index, previous, current) {
  if (typeof(index) === 'number') {
    if (typeof(previous) === 'string' && typeof(current) === 'string') {
      const before = previous.substr(0, index);
      const index1 = current.indexOf(before);
      if (index1 !== -1) {
        return index1 + before.length;
      }
      const after = previous.substr(index);
      const index2 = current.lastIndexOf(after);
      if (index2 !== -1) {
        return index2;
      }
    }
  }
}

export {
  useStickySelection
};
