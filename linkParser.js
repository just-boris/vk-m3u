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

    function tryParseMyMusic(uri) {
        var matches = /audio(?:\?album_id=(\d+))?$/g.exec(uri);
        if (matches) {
            return {
                type: 'audios',
                albumId: matches[1]
            };
        }
        return false;
    }

    function tryParseMyRecommendations(uri) {
        var matches = /audios(-)?(\d+)(?:\?act=recommendations)/.exec(uri);
        if (matches) {
            return {
                type: 'recommendations',
                user_id: matches[1]
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
        var linkMath = /http(?:s)?:\/\/vk\.com\/(.*)/.exec(link);
        if (!linkMath || !linkMath[1]) {
            return;
        }
        return tryParseMyRecommendations(linkMath[1]) ||
            tryParseMyMusic(linkMath[1]) ||
            tryParseAudios(linkMath[1]) ||
            tryParseWall(linkMath[1]) ||
        { type: 'wall', domain: linkMath[1]};
    };
});
