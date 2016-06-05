/**
 * @param {type} {{{moduleName}}} module
 * @author {{{author}}}
 * @since {{{date}}}
 */

(function () {
    define(['./{{{moduleName}}}.module'], function (moduleName) {
        'use strict';

        angular.module(moduleName)
            .controller('{{{elementName}}}', {{{elementName}}});

        {{{elementName}}}.$inject = ['$log'];

        function {{{elementName}}} ($log) {
            var vm = this;
            vm.class = '{{{elementName}}}';

            activate();

            function activate() {
                $log.debug('Activating ' + vm.class);
            }
        }
    });
})();
