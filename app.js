const express = require('express')
const app = express()
const port = process.env.PORT
app.set('view engine', 'ejs');


app.get('/', function(req, res) {
    res.render('views/index.ejs');
});

app.listen(port, () => {
  console.log(process.env.NODE_ENV)
  console.log(`Example app listening at http://localhost:${port}`)
})
