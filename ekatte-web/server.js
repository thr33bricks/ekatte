if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config()
}

//modules
const insertData = require("./modules/insert_data");
const sql = require("./modules/sql");

const express = require('express')
var http = require('http')
var fs = require('fs');
const { Client } = require('pg')

const app = express()

//========================================= Security ================================================
app.use(express.json({ limit: '30kb' }));//Limiting payload; basic DOS protection

const rateLimit = require('express-rate-limit')
const limit = rateLimit({
  max: 150,// max requests
  windowMs: 60 * 1000 * 2, // 15 mins
  message: 'Too many requests' // message to send
}); //Basic DOS and brute force protection
app.use('/', limit);

// Data Sanitization against XSS
const xss = require('xss-clean')
app.use(xss());

app.disable('x-powered-by')
//===================================================================================================

const flash = require('express-flash');
const session = require('express-session')
const { strictEqual } = require('assert');

app.set('view-engine', 'ejs')
app.use(express.static(__dirname + '/public'))
app.use(express.urlencoded({ extended: false }))
app.use(flash())
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false
}))

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
    renderIndexStats(res)
})

app.post('/', (req, res) => {
    renderIndexSearch(req, res)
})

app.use((res) => {
    res.status(404)
    res.redirect('/')
})

insertData.insertDataDB(client)



//===================================== Functions ===================================================

function renderIndexStats(res){
    sql.getStats(client).then(stats => {
        res.render('index.ejs', {stats})
    }).catch(err => {
        console.log(err)
        console.log('There was a problem retrieving stats');
    });
}

function renderIndexSearch(req, res){
    let srchStr = req.body.search.trim()

    if(srchStr){
        sql.getSearchRes(client, srchStr).then(results => {
            req.flash('res', results)
            res.redirect('/')
        }).catch(err => {
            console.log(err)
            console.log(`There was a problem while searching for ${srchStr}`);
            res.redirect('/')
        });
    }
    else{
        res.redirect('/')
    }
}

//===================================================================================================

var httpServer = http.createServer(app)
httpServer.listen(process.env.HTTP_PORT)