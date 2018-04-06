(function(dynCore) {
    dynCore.declare('lib.roller', function(modules) {
        var getInt = function(max, random) {
            if (random) {
                return Math.floor(random() * max);
            }
            return Math.floor(Math.random() * max);
        };

        var getFromWeighted = function(list, index) {
            var cumulative = 0;
            for (var i = 0; i < list.length; i++) {
                cumulative += list[i].weight || 1;
                if (index < cumulative) {
                    if (typeof(list[i].weight) !== 'undefined') {
                        return list[i].value || list[i].text;
                    }
                    return list[i];
                }
            }
        };

        /*  args: {
                count: 1,
                list: [],
                random: Math.random,
                unique: false
            }  */
        var getArrayItem = function(args) {
            if (Array.isArray(args)) {
                args = {
                    list: args
                };
            }

            if (typeof(args.count) === 'undefined') {
                var max = 0;
                for (var i = 0; i < args.list.length; i++) {
                    if (typeof(args.list[i].weight) === 'undefined') {
                        max += 1;
                    } else {
                        max += args.list[i].weight;
                    }
                }

                var index = getInt(max, args.random);
                return getFromWeighted(args.list, index);
            }

            var result = [];
            var max = 0;
            for (var i = 0; i < args.list.length; i++) {
                if (typeof(args.list[i].weight) === 'undefined') {
                    max += 1;
                } else {
                    max += args.list[i].weight;
                }
            }

            var index;
            var item;
            var seen = [];
            for (var i = 0; i < args.count; i++) {
                do {
                    index = getInt(max, args.random);
                    item = getFromWeighted(args.list, index);
                } while (seen.includes(item));
                if (args.unique) {
                    seen.push(item);
                }

                result.push(item);
            }

            return result;
        };

        /*  args: {
                count: 1,
                template: {},
                random: Math.random,
                unique: false
            }  */
        return function(args, random) {
            if (Array.isArray(args) || (typeof(args) === 'object' && !args.template)) {
                args = {
                    template: args
                };
            }

            if (random) {
                args.random = random;
            }

            if (Array.isArray(args.template)) {
                return getArrayItem({
                    list: args.template,
                    count: args.count,
                    unique: args.unique,
                    random: args.random
                });
            }

            var returnObject = false
            if (typeof(args.count) === 'undefined') {
                args.count = 1;
                returnObject = true;
            }

            var results = [];
            for (var i = 0; i < args.count; i++) {
                var result = {};
                for (var prop in args.template) {
                    var item = args.template[prop];
                    if (Array.isArray(item)) {
                        result[prop] = getArrayItem({
                            list: item,
                            random: args.random
                        });
                    } else if (typeof(item) === 'object') {
                        result[prop] = getArrayItem({
                            list: item.options,
                            count: item.count,
                            unique: item.unique,
                            random: args.random
                        });
                    } else {
                        result[prop] = item;
                    }
                }
                if (args.unique && results.includes(result)) {
                    i--;
                } else {
                    results.push(result);
                }
            }

            if (returnObject) {
                results = results[0];
            }

            return results;
        };
    });
})(window.dynCore);