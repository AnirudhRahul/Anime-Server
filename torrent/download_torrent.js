//From: https://github.com/sayem314/torrenter/blob/master/download.js
const WebTorrent = require("webtorrent");

const _formatBytes = bytes => {
  if (bytes < 1024) return bytes + " Bytes";
  else if (bytes < 1048576) return (bytes / 1024).toFixed(2) + " KB";
  else return (bytes / 1048576).toFixed(2) + " MB";
};

const _formatTime = millis => {
  let sec = Math.floor(millis / 1000);
  let hrs = Math.floor(sec / 3600);
  sec -= hrs * 3600;
  let min = Math.floor(sec / 60);
  sec -= min * 60;

  sec = "" + sec;
  sec = ("00" + sec).substring(sec.length);

  if (hrs > 0) {
    min = "" + min;
    min = ("00" + min).substring(min.length);
    return `${hrs}h ${min}m ${sec}s`;
  } else {
    return `${min}m ${sec}s`;
  }
};

const torrentLog = torrent => {
  let progress = Number(torrent.progress * 100).toFixed(2);
  let progressBar = "";
  let bars = ~~(progress / 4);

  for (let i = 0; i < bars; i++) {
    progressBar += "=";
  }
  progressBar = progressBar + Array(26 - progressBar.length).join("-");

  // prettier-ignore
  console.log(
    '\n Name  : ' + torrent.name +
    '\n Connected  : ' + torrent.numPeers + ' peers\n' +
    ' Downloaded : ' + _formatBytes(torrent.downloaded) + ' (' + _formatBytes(torrent.downloadSpeed) + '/s)\n' +
    ' Size       : ' + _formatBytes(torrent.length) + '\n' +
    ' ETA        : ' +  _formatTime(torrent.timeRemaining) + '\n' +
    ' [' + progressBar + '] ' + progress + '%\n'
  );
};

module.exports = (torrentId, downloadPath) => {
  return new Promise((resolve, reject) => {
    // client
    let client = new WebTorrent({ maxConns: 300 });

    client.on("error", err => {
      client.destroy(() => reject(err));
    });

    // torrent
    const torrent = client.add(torrentId, { path: downloadPath });

    let st = setTimeout(() => {
      if (torrent.numPeers < 1) {
        client.destroy(() => reject("Cannot find any peers!"));
      }
    }, 1000 * 10);

    torrent.on("error", err => {
      if (st) clearTimeout(st);
      client.destroy(() => {
        return reject(err);
      });
    });

    torrent.on("metadata", () => {
      console.log("\n " + torrent.name);
      torrent.files.forEach(file => {
        console.log(` ├── ${file.name} (${_formatBytes(file.length)})`);
      });
    });

    let time = Date.now() + 1000;

    torrent.on("download", bytes => {
      const t = Date.now();
      if (t - time >= 30*1000) {
        time = t;
        torrentLog(torrent);
      }
    });

    torrent.on("done", () => {
      if (st) clearTimeout(st);
      torrentLog(torrent);
      //Extract subset of file data before it is destroyed
      const torrent_files = []
      for(file of torrent.files){
        torrent_files.push({
          path: file.path,
          length: file.length
        })
      }
      client.destroy();
      client = undefined;
      st = undefined;

      return resolve({path: torrent.path, files: torrent_files})
    });
  });
};
