var ffmpeg = require('fluent-ffmpeg');
var glob = require("glob")

glob("**/*.js", options, function (er, files) {
  // files is an array of filenames.
  // If the `nonull` option is set, and nothing
  // was found, then files is ["**/*.js"]
  // er is an error object or null.
})

var command =
ffmpeg('../dev/videos/One Piece [1080p]/[HorribleSubs] One Piece - 936 [1080p].mkv')
.output('../dev/videos/One Piece [1080p]/[HorribleSubs] One Piece - 936 [1080p].mp4')
.on('end', function() {
  console.log('Finished processing');
})
.run()
