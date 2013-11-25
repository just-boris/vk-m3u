/* global angular */
angular.module('vk', [])
    .constant('VK', VK)
    .factory('vk', function($q, $rootScope) {
    'use strict';
    return function(method, params) {
        var deferred = $q.defer();
        angular.forEach(params, function(val, key) {
            if(!angular.isDefined(val)){
                delete params[key];
            }
        });
        VK.Api.call(method, angular.extend({v: '5.4', lang: 'en'}, params), function(r) {
            if(r.response) {
                deferred.resolve(r.response);
            }
            else {
                deferred.reject(r);
            }
            $rootScope.$apply();
        });
        return deferred.promise;
    }
});
