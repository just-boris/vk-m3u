/* global angular */
angular.module('VkGrabApp', ['playlist', 'vk'])
    .value('location', location)
    .controller('AppCtrl', function ($scope, VK) {
        "use strict";
        $scope.login = function () {
            VK.Auth.login(function (response) {
                $scope.loggedIn = !!response.session;
            }, 8);
        };
        $scope.loggedIn = false;
        VK.Auth.getLoginStatus(function (response) {
            $scope.loggedIn = !!response.session;
        });
    })
    .controller('GrabCtrl',function ($scope, $location, location, linkParser, playlistLoader, vk) {
        'use strict';
        function setLoading(loading) {
            $scope.loading = loading;
        }
        function errback() {
            setLoading(false);
        }
        function applyObjectInfo(object, result) {
            object.name = result.name;
            object.screen_name = result.screen_name;
            if(object.type === 'audios') {
                object.audioTotal = result.counters.audios;
            }
            object.photo_50 = result.photo_50;
            $scope.object = object;
        }

        function loadProfile(object) {
            vk('users.get', {
                user_ids: object.owner_id,
                name_case: 'gen',
                fields: ['photo_50', 'screen_name', 'counters'].join(',')
            }).then(function (response) {
                var result = response[0];
                result.name = [result.first_name, result.last_name].join(" ");
                applyObjectInfo(object, result);
                setLoading(false);
            }, errback);
        }

        function loadGroup(object) {
            vk('groups.getById', {
                group_ids: -object.owner_id,
                fields: ['photo_50', 'screen_name', 'screen_name', 'counters'].join(',')
            }).then(function (response) {
                var result = response[0];
                applyObjectInfo(object, result);
                setLoading(false);
            }, errback);
        }

        function loadWall(owner_id, offset, tracks, callback) {
            vk('wall.get', {owner_id: owner_id, offset: offset, count: 100}).then(function (response) {
                tracks = tracks || [];
                response.items.forEach(function(post) {
                    if(post.attachments && post.attachments.length) {
                        post.attachments.forEach(function(attach) {
                            if(attach.type === "audio") {
                                tracks.push(attach.audio);
                            }
                        });
                    }
                });
                if(response.count > 100) {
                    loadWall(owner_id, offset+100, tracks, callback);
                }
                else {
                    callback(tracks);
                }
            }, function() {
                callback(tracks);
            });
        }

        function loadObjectInfo(object) {
            if (object.owner_id) {
                if (object.owner_id > 0) {
                    loadProfile(object);
                }
                else {
                    loadGroup(object);
                }
            }
            else if (object.domain) {
                vk('utils.resolveScreenName', {screen_name: object.domain}).then(function (response) {
                    switch (response.type) {
                        case 'user':
                            object.owner_id = response.object_id;
                            loadProfile(object);
                            break;
                        case 'group':
                            object.owner_id = -response.object_id;
                            loadGroup(object);
                            break;
                        default:
                            setLoading(false);
                    }
                }, errback);
            }
        }

        $scope.loadUrl = function () {
            var object = linkParser($scope.objectUrl);
            $location.search('page', $scope.objectUrl);
            $scope.object = null;
            if (object) {
                if (object.type === 'audios') {
                    object.typeTitle = 'Audios of';
                }
                else {
                    object.typeTitle = 'Audios from wall of';
                }
                setLoading(true);
                loadObjectInfo(object);
            }
        };
        $scope.openPlaylist = function (tracks) {
            var url = playlistLoader(tracks);
            location.href = 'data:audio/x-mpegurl;charset=UTF-8;filename="' + $scope.object.type + $scope.object.owner_id + '.m3u";base64,' + btoa(unescape(encodeURIComponent(url)));
        };
        $scope.getPlaylist = function () {
            var object = $scope.object;
            if (object.type === 'audios') {
                vk('audio.get', {owner_id: object.owner_id}).then(function (response) {
                    $scope.openPlaylist(response.items);
                });
            }
            else {
                loadWall(object.owner_id, 0, [], function(tracks) {
                    $scope.openPlaylist(tracks);
                });
            }
        };
        $scope.objectUrl = $location.search().page;
        if ($scope.objectUrl) {
            $scope.loadUrl();
        }
    }).factory('linkParser', function () {
        'use strict';
        function tryParseAudios(uri) {
            var matches = /audios(-)?(\d*)/.exec(uri);
            if (matches) {
                return {
                    type: 'audios',
                    owner_id: (matches[1] ? -1 : 1) * matches[2]
                };
            }
            return false;
        }

        function tryParseWall(uri) {
            var matches = /wall(-)?(\d*)/.exec(uri);
            if (matches) {
                return {
                    type: 'wall',
                    owner_id: (matches[1] ? -1 : 1) * matches[2]
                };
            }
            return false;
        }

        return function (link) {
            var linkMath = /http:\/\/vk\.com\/(.*)/.exec(link);
            if (!linkMath || !linkMath[1]) {
                return;
            }
            return tryParseAudios(linkMath[1]) ||
                   tryParseWall(linkMath[1]) ||
                   { type: 'wall', domain: linkMath[1]};
        };
    });