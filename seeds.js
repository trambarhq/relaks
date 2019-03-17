var seeds = [];

function plant(list) {
    if (!(list instanceof Array)) {
        throw new Error('Seeds must be an array of object. Are you calling harvest() with the options { seeds: true }?');
    }
    seeds = list;
}

function findSeed(type, props) {
    var index = -1;
    var best = -1;
    for (var i = 0; i < seeds.length; i++) {
        var seed = seeds[i];
        if (seed.type === type) {
            // the props aren't going to match up exactly due to object
            // recreations; just find the one that is closest
            var count = 0;
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
        var match = seeds[index];
        seeds.splice(index, 1);
        return match.result;
    }
}

module.exports = { 
	plant: plant,
	findSeed: findSeed,
};
