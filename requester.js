const needle = require('needle');

module.exports.get = function(url, callback){
  retry(url,150, 10000, callback)
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
