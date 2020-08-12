const express = require('express')
const app = express()
const port = process.env.PORT

app.get('/', (req, res) => {
  res.send('Hello World!\t'+process.env.NODE_ENV)
})

app.use('/dl', express.static('downloads'))


app.listen(port, () => {
  console.log(process.env.NODE_ENV)
  console.log(`Example app listening at http://localhost:${port}`)
})
