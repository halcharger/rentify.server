﻿(function () {
    'use strict';

    angular
        .module('app.sites')
        .run(appRun);

    appRun.$inject = ['routerHelper'];
    /* @ngInject */
    function appRun(routerHelper) {
        routerHelper.configureStates(getStates());
    }

    function getStates() {
        return [
            {
                state: 'sites',
                config: {
                    url: '/sites',
                    templateUrl: 'app/features/sites/sites.html',
                    controller: 'SitesController',
                    controllerAs: 'vm',
                    settings: {
                        nav: 1,
                        content: '<i class="fa fa-globe"></i> Sites'
                    }
                }
            }
        ];
    }
})();
