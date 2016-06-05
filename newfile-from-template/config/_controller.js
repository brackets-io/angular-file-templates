/**
 * @author {{{author}}}
 * @since {{{date}}}
 */
(function () {
    'use strict';

    angular
        .module('{{{moduleName}}}')
        .controller('{{{elementName}}}', {{{elementName}}});

    /* @ngInject */
    function {{{elementName}}} ($log) {
        var vm = this;
        vm.class = '{{{elementName}}}';

        activate();

        //////////////

        function activate() {
            $log.debug('Activating ' + vm.class);
        }
    }
})();
