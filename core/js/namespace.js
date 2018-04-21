(function(dynCore) {
    dynCore.declare('core.namespace', function(modules) {
        var namespaces = {};
        return {
            register: function(args) {
                for (var key in args) {
                    namespaces[key] = args[key];
                    console.log(args[key] + ' registered as ' + (key ? 'namespace ' + key : 'default namespace'));
                }
            },
            get: function(namespace, suffix) {
                var head = namespace.split('.');
                var tail = [];

                // Starting at the end, move parts from head to tail until we match, then add the tail back on
                var root;
                while (head.length) {
                    root = head.join('.');
                    if (namespaces[root]) {
                        tail.unshift(namespaces[root]);
                        break;
                    }

                    tail.unshift(head.pop());
                }

                // Combine url parts and add suffix if provided
                root = tail.join('/') + (suffix ? '/' + suffix : '');

                // Ensure leading slash, no trailing slash, remove double slashes
                if (root.startsWith('//')) {
                    root = root.substring(1);
                }
                return root;// '/' + root.split('/').filter(function(part) { return part; }).join('/');
            },
            file: function(path, folder, ext) {
                folder = folder || '';
                if (folder) {
                    ext = ext || ('.' + folder);
                    if (path.includes(ext)) {
                        // Already an actual path
                        return path;
                    }
                } else {
                    ext = '';
                }

                var i = path.lastIndexOf('.');
                var namespace = i > -1 ? path.substr(0, i) : '';
                var object = i > -1 ? path.substr(i + 1) : path;
                if (folder) {
                    folder = folder + '/';
                }
                return this.get(namespace, folder + object + ext);
            },
            js: function(path) {
                return this.file(path, 'js');
            },
            json: function(path) {
                return this.file(path, 'json');
            },
            html: function(path) {
                return this.file(path, 'html');
            },
            css: function(path) {
                return this.file(path, 'css');
            },
            raw: function(path, ext) {
                if (path.endsWith('.' + ext)) {
                    // Already an actual path, ends in '.ext'
                    return path;
                }
                path = this.file(path)
                if (ext) {
                    path += '.' + ext;
                }
                return path;
            },
            fragment: function(path) {
                return this.raw(path, 'html');
            },
            controller: function(path) {
                return this.raw(path, 'js');
            }
        };
    });
})(window.dynCore);