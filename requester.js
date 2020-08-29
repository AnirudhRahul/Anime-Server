const needle = require('needle');
needle.defaults({user_agent: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/51.0.2704.103 Safari/537.36'})

module.exports.get = function(url){

  return new Promise((resolve, reject) =>{
    retry(url,150, 10000, (err, body)=>{
      if(err)
        reject(err)
      else
        resolve(body)
    })
  })
}

let retry = (function() {
  let count = 0;
  return function(url, max, timeout, next) {
    needle.get(url, function (error, res) {
      if(error){
        console.log(error)
        return
      }
      if (res.statusCode !== 200) {
        if(count!=0 && count%10==0)
        console.log('Retry '+count+' for '+url);

        if (count++ < max) {
          return setTimeout(function() {
            retry(url, max, timeout, next);
          }, timeout);
        } else {
          console.log("ERRORED!")
          return next(new Error('max retries reached'), null);
        }
      }

      // console.log(res.body);
      next(null, res.body);
    });
  }
})();
