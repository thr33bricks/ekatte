if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config()
}

//modules
const insertData = require("./modules/insert_data");

const express = require('express')
var http = require('http')
var fs = require('fs');
const { Client } = require('pg')

const app = express()

//========================================= Security ================================================
app.use(express.json({ limit: '30kb' }));//Limiting payload; basic DOS protection

const rateLimit = require('express-rate-limit')
const limit = rateLimit({
  max: 50,// max requests
  windowMs: 60 * 1000 * 15, // 15 mins
  message: 'Too many requests' // message to send
}); //Basic DOS and brute force protection
app.use('/', limit);

// Data Sanitization against XSS
const xss = require('xss-clean')
app.use(xss());

app.disable('x-powered-by')
//===================================================================================================

const flash = require('express-flash')

app.set('view-engine', 'ejs')
app.use(express.static(__dirname + '/public'))
app.use(express.urlencoded({ extended: false }))
//app.use(flash())

//Postgres connection
const client = new Client({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT,
})
client.connect(function(err) {
    if (err) throw err;
    console.log("Database connected!");
});


app.get('/', (req, res) => {
    res.render('index.ejs')
})

app.post('/', (req, res) => {
    
})

app.use(function(req, res, next) {
    res.status(404)
    res.redirect('/')
})

insertData.insertDataDB(client)

//===================================== Functions ===================================================



//===================================================================================================

var httpServer = http.createServer(app)
httpServer.listen(process.env.HTTP_PORT)