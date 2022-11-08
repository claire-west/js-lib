(function(dynCore) {
    dynCore.declare('lib.names',
        dynCore.json('lib.json.names'),
    function(modules, names) {
        var setList = {};
        for (var category in names) {
            setList[category] = [];

            var sets = names[category];
            for (var set in sets) {
                setList[category].push(set);
            }
        }

        return {
            getSetList: function() {
                return setList;
            },

            get: function(sets) {
                sets = sets || setList;
                if (typeof(sets) === 'string') {
                    var category = sets;
                    sets = {};
                    sets[category] = setList[category];
                } else if (Array.isArray(sets)) {
                    sets = {
                        'Real Languages': sets
                    };
                }

                var nameList = [];
                for (var category in sets) {
                    if (!Array.isArray(sets[category])) {
                        sets[category] = [ sets[category] ];
                    }

                    for (var i = 0; i < sets[category].length; i++) {
                        if (typeof(names[category][sets[category][i]]) === 'undefined') {
                            console.error(sets[category][i] + ' is not a valid nameset');
                        } else {
                            nameList = nameList.concat(names[category][sets[category][i]]);
                        }
                    }
                }

                return nameList;
            }
        };
    });
})(window.dynCore);