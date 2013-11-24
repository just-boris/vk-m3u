/* global angular */
angular.module('vkgrab.linkParser', []).factory('linkParser', function () {
    'use strict';
    function tryParseAudios(uri) {
        var matches = /audios(-)?(\d+)(?:\?album_id=(\d+))?/.exec(uri);
        if (matches) {
            return {
                type: 'audios',
                albumId: matches[3],
                owner_id: (matches[1] ? -1 : 1) * matches[2]
            };
        }
        return false;
    }

    function tryParseWall(uri) {
        var matches = /wall(-)?(\d*)(\?own=1)?/.exec(uri);
        if (matches) {
            return {
                type: 'wall',
                own: !!matches[3],
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
