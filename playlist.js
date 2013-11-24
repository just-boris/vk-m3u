/* global angular */
angular.module('playlist', []).factory('playlistLoader', function() {
    "use strict";
    return function(tracks) {
        return '#EXTM3U' + tracks.map(function(track) {
            return '#EXTINF:'+track.duration+','+track.artist+' - '+track.title+'\n'+track.url;
        }).join('\n');
    };
});
