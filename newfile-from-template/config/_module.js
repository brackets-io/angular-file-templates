/**
 * @param {type} angular
 * @returns {angular.module}
 * @author {{{author}}}
 * @since {{{date}}}
 */

(function () {
    'use strict';

    angular
        .module('app.{{{elementName}}}', [])
        .config(config)
        .run(runBlock);

        /* @ngInject */
        function config() {
            // Your code here
        }

        /* @ngInject */
        function runBlock() {
            // Your code here
        }
})();
