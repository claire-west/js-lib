(function(dynCore) {
    dynCore.declare('lib.download', function(modules) {
        return function(content, filename) {
            var link = document.createElement("a");
            link.download = filename || new Date().toISOString().split('.')[0].replace('T', ' ');
            link.href = content;
            link.click();
        }
    });
})(window.dynCore);