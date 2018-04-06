(function(dynCore) {
    dynCore.declare('lib.propGet', function() {
        var propGet = {
            get: function(object, path) {
                var propArray = propGet.pathToArray(path);
                return propGet.propByPropArray(object, propArray);
            },

            set: function(object, path, value) {
                var propArray = propGet.pathToArray(path);

                var target = object;
                var prop = propArray.shift();
                while (propArray.length) {
                    if (typeof(target[prop]) !== 'object' && typeof(target[prop]) !== 'undefined' && target[prop] !== null) {
                        return;
                    }
                    target = target[prop] = target[prop] || {};
                    prop = propArray.shift();
                }
                target[prop] = value;
            },

            pathToArray: function(properties) {
                var propArray = properties.split("[").join(".").split("]").join(".").split(".");
                return propArray.filter(function(item) { return item; });
            },

            propByPropArray: function(object, propArray, index) {
                if (!propArray.length) {
                    return object;
                }
                if (!index) {
                    index = 0;
                }
                if (index === propArray.length - 1 || typeof(object[propArray[index]]) === 'undefined' || object[propArray[index]] === null) {
                    return object[propArray[index]];
                }
                return propGet.propByPropArray(object[propArray[index]], propArray, ++index);
            },

            compare: function(a, b, properties) {
                var propArray = propGet.pathToArray(properties);
                var aVal = propGet.propByPropArray(a, propArray);
                var bVal = propGet.propByPropArray(b, propArray);
                if (typeof aVal === "string" && typeof bVal === "string") {
                    return aVal.toLocaleLowerCase().localeCompare(bVal.toLocaleLowerCase());
                }
                return bVal - aVal;
            }
        };

        return propGet;
    });
})(window.dynCore);