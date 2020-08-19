const express = require('express')
const app = express()
const port = process.env.PORT || 8001
data_dir = process.env.DOWNLOAD_DIR || "./media/dev"


app.set('view engine', 'ejs');
app.use("/media/icon-chan.png", express.static('./media/icon-chan.png'))


app.get('/', function(req, res) {
    res.render('index');
});

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`)
})
