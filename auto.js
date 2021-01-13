const { fork, execSync } = require('child_process');
const path = require('path')


// Run a task every 5 minutes
// Spawns a child process so memory can efficiently be dumped
const timeout = 5*60*1000
function poll(){
  const start = Math.floor(Date.now()/1000)
  fork('./poll')
  .on('close', (exit_code)=>{
    if(exit_code==9){
      // Stop the pm2 process if there's an input error
        console.log("Stopped PM2 because there was an input error")
        const pm2_config_path = path.resolve(__dirname, 'ecosystem.config.js')
        execSync('pm2 stop '+pm2_config_path)
    }
    //Measure elapsed time in ms
    const diff = Math.floor(Date.now()/1000) - start
    if(diff>=timeout){
      poll()
    }
    else{
      setTimeout(poll, timeout-diff)
    }
  })
}
poll()
