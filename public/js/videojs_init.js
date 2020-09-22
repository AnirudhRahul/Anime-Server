var player = videojs('my-video',{
    userActions: {
      doubleClick: false
    },
  }
);

player.ready(function () {
      // This would look more nice as a plugin but is's just as showcase of using with custom players
      var video = this.tech_.el_;
      window.SubtitlesOctopusOnLoad = function () {
          var options = {
              video: video,
              lossyRender: true,
              subUrl: document.getElementById("init_script").getAttribute("subtitle_src"),
              fonts: ['/fonts/OpenSans-Semibold.ttf'],
              //onReady: onReadyFunction,
              debug: true,
              workerUrl: '/js/subtitles-octopus-worker.js'
          };
          window.octopusInstance = new SubtitlesOctopus(options); // You can experiment in console
      };
      if (SubtitlesOctopus) {
          SubtitlesOctopusOnLoad();
      }
  });


// player.poster('#{thumbnail_src}')
//Useful for console debugging
window.player = player

//add big middle button to video player
//var toggle = new PlayToggle(player);

document.getElementById("my-video").addEventListener('click', function (event) {
  if(event.detail == 2){
    window.player.requestFullscreen();
  }
});

document.querySelector('.vjs-big-play-button').addEventListener('touchend', player.requestFullscreen)
window.lastClick = 0
window.togglePlayer = function(){
  if(window.player.paused()){
    window.player.play()
  }
  else{
    window.player.pause()
  }
}
window.seekForward = function(){
  window.player.currentTime(window.player.currentTime()+10)
}
window.seekBackward = function(){
  window.player.currentTime(window.player.currentTime()-10)
}

// Keyboard shortcuts
document.addEventListener("keydown", function(event) {
  const code = event.keyCode
  // Space bar or K
  if (code == 32 || code == 75) {
      window.togglePlayer()
  }
  // Right arrow or L
  else if (code == 39 || code == 76) {
      window.seekForward()
  }
  // Left arrow or J
  else if (code == 37 || code == 74) {
      window.seekBackward()
  }
  else{
    return
  }
  //Prevent defualt action if keypress was caught
  event.preventDefault();

});
const vid_element = document.getElementById("my-video")
vid_element.addEventListener('touchstart', function (event) {
  const curtime = Date.now()
  const x_norm = event.touches[0].clientX / getComputedStyle(window.player.el()).width
  const y_norm = event.touches[0].clientY / getComputedStyle(window.player.el()).height
  console.log('X: '+x_norm)
  console.log('Y: '+y_norm)
  // Ignore tops on the top and bottom
  if(y_norm>0.9 || y_norm<0.1)
    return
  if(event.touches.length>1 || (x_norm < 0.5+0.125 && x_norm > 0.5-0.125)){
    window.togglePlayer()
    window.lastClick = 0
  }
  else if(curtime-window.lastClick<250){

    if(x_norm > 0.5+0.125){
      window.seekForward()
    }
    else if(x_norm < 0.5-0.125){
      window.seekBackward()
    }
    window.lastClick = 0
  }
  else
    window.lastClick = curtime
});

player.responsive(true);
player.landscapeFullscreen();
var videoElem = document.getElementById("my-video_html5_api");
var quality = videoElem.getVideoPlaybackQuality();
var dropPercent = (quality.droppedVideoFrames/quality.totalVideoFrames)*100;
window.droppedFrames = quality.droppedVideoFrames
window.dropPercent = dropPercent
window.quality = quality
document.getElementById("stats").innerText = 'Dropped Frames: ' + dropPercent
