let delayWhenEmpty = 50;
let delayWhenRendered = Infinity;
let seeds = [];
let errorHandler = function(err) {
  console.error(err);
};

function get(name) {
  switch (name) {
    case 'errorHandler':
      return errorHandler;
    case 'delayWhenEmpty':
      return delayWhenEmpty;
    case 'delayWhenRendered':
      return delayWhenRendered;
    case 'seeds':
      plant(value);
      break;
  }
}

function set(name, value) {
  switch (name) {
    case 'errorHandler':
      errorHandler = value;
      break;
    case 'delayWhenEmpty':
      delayWhenEmpty = value;
      break;
    case 'delayWhenRendered':
      delayWhenRendered = value;
      break;
    case 'seeds':
      plant(value);
      break;
  }
}

function plant(list) {
  if (!(list instanceof Array)) {
    throw new Error('Seeds must be an array of object. Are you calling harvest() with the options { seeds: true }?');
  }
  seeds = list;
}

function findSeed(target) {
  const type = target.func || target.constructor;
  const props = target.props;
  let index = -1;
  let best = -1;
  for (let i = 0; i < seeds.length; i++) {
    const seed = seeds[i];
    if (seed.type === type) {
      // the props aren't going to match up exactly due to object
      // recreations; just find the one that is closest
      let count = 0;
      if (props && seed.props) {
        for (var key in props) {
          if (seed.props[key] === props[key]) {
            count++;
          }
        }
      }
      if (count > best) {
        // choose this one
        index = i;
        best = count;
      }
    }
  }
  if (index != -1) {
    const match = seeds[index];
    seeds.splice(index, 1);
    return match.result;
  }
}

export {
  get,
  set,
  plant,
  findSeed,
};
