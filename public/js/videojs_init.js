var player = videojs('my-video',{
    userActions: {
      doubleClick: false
    },
  }
);

function iOS() {
  return [
    'iPad Simulator',
    'iPhone Simulator',
    'iPod Simulator',
    'iPad',
    'iPhone',
    'iPod'
  ].includes(navigator.platform)
  // iPad on iOS 13 detection
  || (navigator.userAgent.includes("Mac") && "ontouchend" in document)
}

player.ready(function () {
      // This would look more nice as a plugin but is's just as showcase of using with custom players
      var video = this.tech_.el_;
      window.SubtitlesOctopusOnLoad = function () {
          var options = {
              video: video,
              lossyRender: !iOS(),
              subUrl: document.getElementById("init_script").getAttribute("subtitle_src"),
              fonts: ['/fonts/OpenSans-Semibold.ttf'],
              //onReady: onReadyFunction,
              // debug: true,
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

// Expand to full screen on the users first tap
const fullScreenOnTap = document.getElementById("my-video").addEventListener('touchend', function (event) {
    window.player.requestFullscreen();
    document.getElementById("my-video").removeEventListener('touchend', fullScreenOnTap);
});

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
  event = event || window.event
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
  const x_norm = event.touches[0].clientX / vid_element.offsetWidth
  const y_norm = event.touches[0].clientY / vid_element.offsetHeight
  // console.log('X: '+x_norm)
  // console.log('Y: '+y_norm)
  // Ignore tops on the top and bottom
  if(y_norm>1)
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

const LoadingAggroButton =
`
<button class="btn btn-primary" type="button" disabled>
  <span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
  Loading 0%
</button>
`

const AggroButton =
`
<button class="btn btn-primary" type="button" onclick=loadSource()>
  Aggresively Load Video
</button>
`

const DoneAggroButton =
`
<button class="btn btn-success" type="button" disabled>
  Done!
</button>
`

const FailedAggroButton =
`
<button class="btn btn-danger" type="button" disabled>
  Failed :(
</button>
`

const isChrome = /Chrome/.test(navigator.userAgent) && /Google Inc/.test(navigator.vendor);
const aggroDiv = document.getElementById('aggro')

if(isChrome){
  aggroDiv.innerHTML = AggroButton
}

function loadSource(){
  const url = document.getElementById("init_script").getAttribute("video_src")
  const xhr = new XMLHttpRequest()
  aggroDiv.innerHTML = LoadingAggroButton(0);
  xhr.onload = function() {
      aggroDiv.innerHTML = DoneAggroButton;
      const wasPaused = window.player.paused()
      const time =  window.player.currentTime()
      window.player.src({type:'video/mp4', src: URL.createObjectURL(xhr.response)});

      if(wasPaused){
        window.player.pause();
        window.player.currentTime(time);
      }
      else{
        window.player.currentTime(time-1);
        window.player.play();
      }
  };
  xhr.onprogress = function (event) {
    if(aggroDiv.firstChild.text.endsWith('%')){
      aggroDiv.firstChild.text = 'Loading ' + Math.floor(event.loaded / event.total * 100) + '%';
    }
  };
  xhr.onerror = function(){
    aggroDiv.innerHTML = FailedAggroButton
  }

  xhr.responseType = "blob";
  xhr.open("GET", url)
  xhr.send();

}
