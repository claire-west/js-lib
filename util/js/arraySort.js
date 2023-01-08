(function(dynCore) {
    dynCore.declare('lib.arraySort');

    Array.prototype.sortBy = function(properties, descending) {
        var tempArray = properties.split("[").join(".").split("]").join(".").split(".");
        var propArray = [];
        for (var i = 0; i < tempArray.length; i++) {
            if (tempArray[i] !== "") {
                propArray.push(tempArray[i]);
            }
        }
        var getPropByPropArray = function(object, propArray, index) {
            if (!index) {
            index = 0;
            }
            if (index === propArray.length - 1) {
                return object[propArray[index]];
            }
            return getPropByPropArray(object[propArray[index]], propArray, ++index);
        }
        this.sort(function(a, b) {
            var aVal = getPropByPropArray(a, propArray);
            var bVal = getPropByPropArray(b, propArray);
            if (typeof aVal === "string" && typeof bVal === "string") {
                if (descending) {
                    bVal.toLocaleLowerCase().localeCompare(aVal.toLocaleLowerCase());
                }
                return aVal.toLocaleLowerCase().localeCompare(bVal.toLocaleLowerCase());
            }
            return descending ? aVal - bVal : bVal - aVal;
        });
    };
})(window.dynCore);