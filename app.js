/* global angular */
angular.module('VkGrabApp', ['playlist','vk'])
    .value('location', location)
    .controller('AppCtrl', function($scope, VK) {
        "use strict";
        $scope.login = function() {
            VK.Auth.login(function(response) {
                $scope.loggedIn = !!response.session;
            }, 8);
        };
        $scope.loggedIn = false;
        VK.Auth.getLoginStatus(function(response) {
            $scope.loggedIn = !!response.session;
        });
    })
    .controller('GrabCtrl', function($scope, $location, location, linkParser, playlistLoader, vk) {
    'use strict';
    $scope.loadUrl = function() {
        var object = linkParser($scope.objectUrl);
        $location.search('page', $scope.objectUrl);
        if(!object) {
            delete $scope.object;
            return;
        }
        if(object.type === 'audios') {
            object.typeTitle = 'Audios of';
            if(object.owner_id > 0) {
                vk('users.get', {
                    user_ids: object.owner_id,
                    name_case: 'gen',
                    fields: ['photo_50', 'screen_name', 'counters'].join(',')
                }).then(function(response) {
                    var result = response[0];
                    object.name = [result.first_name, result.last_name].join(" ");
                    object.screen_name = result.screen_name;
                    object.audioTotal = result.counters.audios;
                    object.photo_50 = result.photo_50;
                    $scope.object = object;
                });
            }
            else {
                vk('groups.getById', {
                    group_ids: -object.owner_id,
                    fields: ['photo_50', 'screen_name', 'screen_name', 'counters'].join(',')
                }).then(function(response) {
                    var result = response[0];
                    object.name = result.name;
                        object.screen_name = result.screen_name;
                    object.photo_50 = result.photo_50;
                    object.audioTotal = result.counters.audios;
                    $scope.object = object;
                });
            }
        }

    };
    $scope.openPlaylist = function(tracks) {
        var url = playlistLoader(tracks);
        location.href = 'data:audio/x-mpegurl;charset=UTF-8;filename="'+$scope.object.type+$scope.object.owner_id+'.m3u";base64,'+btoa(unescape(encodeURIComponent(url)));
    };
    $scope.getPlaylist = function() {
        var object = $scope.object;
        if(object.type === 'audios') {
            vk('audio.get', {owner_id: object.owner_id}).then(function(response) {
                $scope.openPlaylist(response.items);
            });
        }
    };
    $scope.objectUrl = $location.search().page;
    if($scope.objectUrl) {
        $scope.loadUrl();
    }
}).factory('linkParser', function() {
    'use strict';
    function tryParseAudios(uri) {
        var matches = /audios(-)?(\d*)/.exec(uri);
        if(matches) {
            return {
                type: 'audios',
                owner_id: (matches[1] ? -1 : 1) * matches[2]
            };
        }
        return false;
    }
    function tryParseWall(uri) {
        var matches = /wall(-)?(\d*)/.exec(uri);
        if(matches) {
            return {
                type: 'wall',
                owner_id: (matches[1] ? -1 : 1) * matches[2]
            };
        }
        return false;
    }
    return function(link) {
        var linkMath = /http:\/\/vk\.com\/(.*)/.exec(link);
        if(!linkMath || !linkMath[1]) {
            return;
        }
        return tryParseAudios(linkMath[1]) ||
            tryParseWall(linkMath[1]) ||
            { type: 'wall', domain: linkMath[1]};
    };
});
