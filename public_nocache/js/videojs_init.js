var player = videojs('my-video',{
    userActions: {
      doubleClick: false,
      textTrackSettings: false
    },
  }
);

function createRoom(){
  fetch("/createRoom",{ 
    method: "POST",
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({baseUrl:location.href})
  })
  .then(res => res.json())
  .then((res)=>{
    location.href=res.url
  })
}



let next_episode = document.getElementById("init_script").getAttribute("next_episode")
console.log("NEXT EPISODE", next_episode)

if(next_episode!='-1'){
var Button = videojs.getComponent('Button');
var MyButton = videojs.extend(Button, {
  constructor: function () {
    Button.apply(this, arguments);
      /* init */
  },
  text: 'Press Me',
  handleClick: function () {
    /* do something on click */
    console.log("Custom button was clicked")
    // redirect to next page
    document.location.href = next_episode
  }
});
videojs.registerComponent('MyButton', MyButton);
const button = player.controlBar.addChild('MyButton');
button.el().innerHTML = "TEST"

}

let subtitle_list = JSON.parse(document.getElementById("init_script").getAttribute("subtitle_src"))

const sub_element = document.getElementById('submenu')

for(const track of subtitle_list){
  const element = document.createElement('LI')
  element.innerHTML = track.title
  sub_element.appendChild(element)
}
console.log("SUBTITLE LIST", subtitle_list)
// `
// <ul class="dropdown-menu" role="menu" aria-labelledby="dropdownMenu">
//   <li><a tabindex="-1" href="#">Regular link</a></li>
//   <li class="disabled"><a tabindex="-1" href="#">Disabled link</a></li>
//   <li><a tabindex="-1" href="#">Another link</a></li>
// </ul>
// `
player.ready(function () {
      // This would look more nice as a plugin but is's just as showcase of using with custom players
      var video = this.tech_.el_;

      window.SubtitlesOctopusOnLoad = function () {
          var options = {
              video: video,
              lossyRender: typeof createImageBitmap === "function",
              subUrl: subtitle_list[0].path,
              fonts: ['/fonts/OpenSans-Semibold.ttf'],
              //onReady: onReadyFunction,
              // debug: true,
              workerUrl: '/js/subtitles/subtitles-octopus-worker.js'
          };
          window.octopusInstance = new SubtitlesOctopus(options); // You can experiment in console
      };
      if (SubtitlesOctopus) {
          SubtitlesOctopusOnLoad();
      }
});



// window.octopusInstance.setTrackByUrl('/test/railgun_op.ass');


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

window.tappedVideo = false;
// Expand to full screen on the users first tap
const fullScreenOnTap = document.getElementById("my-video").addEventListener('touchend', function (event) {
    if(!window.tappedVideo){
      window.player.requestFullscreen();
      window.tappedVideo = true;
    }
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
window.seek = function(timeMs){
  window.player.currentTime(timeMs/1000)
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
<button class="btn btn-primary" type="button" id="loading" disabled>
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

// const isChrome = /Chrome/.test(navigator.userAgent) && /Google Inc/.test(navigator.vendor);
const aggroDiv = document.getElementById('aggro')

// if(isChrome){
  aggroDiv.innerHTML = AggroButton
// }

function loadSource(){
  const url = document.getElementById("init_script").getAttribute("video_src")
  const xhr = new XMLHttpRequest()
  aggroDiv.innerHTML = LoadingAggroButton
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
    const button = document.getElementById('loading')
    if(button){
      button.innerText = 'Loading ' + Math.floor(event.loaded / event.total * 100) + '%';
    }
  };
  xhr.onerror = function(){
    aggroDiv.innerHTML = FailedAggroButton
  }

  xhr.responseType = "blob";
  xhr.open("GET", url)
  xhr.send();

}

var manuallyTriggered = 0

function setState(state, pos){
  if(pos!==undefined){
    window.seek(pos)
  }

  if(player.paused() && state=="pause"){
    return
  }
  if(!player.paused() && state=="play"){
    return
  }

  manuallyTriggered+=1
  if(state=="play"){
    window.player.play()
  }
  else if(state=="pause"){
    window.player.pause()
  }

  console.log("Set state to", state, pos)
}

const url = new URL(location.href)
if(url.searchParams.has("room")){
  console.log("Room", url.searchParams.get("room"))
  const loc = window.location
  let new_uri;
  if (loc.protocol === "https:") {
      new_uri = "wss:";
  } else {
      new_uri = "ws:";
  }
  new_uri += "//" + loc.host;
  new_uri += `/joinRoom/${url.searchParams.get("room")}`;
  const ws = new WebSocket(new_uri);
  ws.onmessage = (msg)=>{
    if(msg.data.startsWith("Rejected")){
      console.error(msg.data)
      return
    }

    const data = JSON.parse(msg.data)
    console.log("Got message", msg.data)
    if(data.heardAt){
      if(data.state=="play"){
        setState(data.state, data.pos+Date.now()-data.heardAt)
      }
      else{
        setState(data.state, data.pos)
      }
    }
    else{
      setState("pause", data.pos)
      while(Date.now()<data.waitTill){
        continue;
      }
      setState(data.state)
      
    }


  }

  ws.onclose = ()=>{
    history.pushState(null, "", location.href.split("?")[0]);
  }



  player.on("play", function (e) {
    if(manuallyTriggered==0){
      console.log("Sent packet manual trigger")
      ws.send(JSON.stringify({
        state:"play",
        position: player.currentTime()*1000,
        sentAt: Date.now()
      }))
    }
    else{
      manuallyTriggered--
    }

  });

  player.on("pause", function (e) {
    if(manuallyTriggered==0){
      console.log("Sent packet manual trigger")
      ws.send(JSON.stringify({
        state:"pause",
        position: player.currentTime()*1000,
        sentAt: Date.now()
      }))
    }
    else{
      manuallyTriggered--
    }
  });

}
else{
  const CreateRoom =
    `
    <button class="btn btn-secondary" type="button" onclick=createRoom()>
      Create shared room
    </button>
    `
  document.getElementById('shareplay').innerHTML = CreateRoom 
}