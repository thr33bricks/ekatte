if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config()
}

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
var XLSX = require('xlsx')

app.set('view-engine', 'ejs')
app.use(express.static(__dirname + '/public'))
app.use(express.urlencoded({ extended: false }))
app.use(flash())

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
    res.render('index.ejs', { stats: results })
})

app.post('/', (req, res) => {
    
})

insertDataDB()

//===================================== Functions ===================================================

function parseXlxsFile(path){
    var workbook = XLSX.readFile(path)
    var sheet_name_list = workbook.SheetNames
    var xlData = XLSX.utils.sheet_to_json(workbook.Sheets[sheet_name_list[0]])
    return xlData
}

function parseRegions(){
    let regions = parseXlxsFile('./public/Ek_obl.xlsx')
    let res = []

    regions.forEach((region,i) => {     
        let newReg = {}
        newReg.id = region.oblast
        newReg.name = region.name

        res.push(newReg)
    });
    return res
}

function parseMunicips(){
    let municips = parseXlxsFile('./public/Ek_obst.xlsx')
    let res = []

    municips.forEach((municip,i) => {     
        let newMunicip = {}
        newMunicip.id = municip.obstina
        newMunicip.region_id = municip.obstina.substring(0,3)
        newMunicip.name = municip.name

        res.push(newMunicip)
    });
    return res
}

function parseTowns(){
    let towns = parseXlxsFile('./public/Ek_atte.xlsx')
    let res = []

    for (let i = 1; i < towns.length; i++) {
        let newTown = {}
        newTown.municip_id = towns[i].obstina
        newTown.ekatte = towns[i].ekatte
        newTown.type = towns[i].t_v_m
        newTown.name = towns[i].name

        res.push(newTown)
    }

    return res
}

function insertDataDB(){
    let regions = parseRegions()
    let municips = parseMunicips()
    let towns = parseTowns()

    let sqlRegions = 'INSERT INTO \"regions\"'
                   + '(\"id\", \"name\")'
                   + 'VALUES'
    let arrItems = []
    regions.forEach((region,i) => {     
        let item = '(' 
        + '\'' + region.id +   '\',' 
        + '\'' + region.name + '\'' 
        +')'
        arrItems.push(item)
    });
    sqlRegions += arrItems.join(',')
    sqlRegions += ' ON CONFLICT NO ACTION'

    console.log(sqlRegions)

    /*('Tom', 'tom@email.com', 'Poland'),
    ('Chris', 'chris@email.com', 'Spain'),
    ('Jack', 'jack@email.com', 'Spain'),
    ('Kim', 'kim@email.com', 'Vietnam'),
    ('Marco', 'marco@email.com', 'Italy'),
    ('Kate', 'kate@email.com', 'Spain'),
    ('Nam', 'nam@email.com', 'Vietnam');*/

    //Basic search 
    /*var search = 'рилски м'
    var town = towns.find(function(twn, index) {
        if(twn.name.toLowerCase().includes(search))
            return true;
    });
    console.log(town)*/
}

//===================================================================================================

var httpServer = http.createServer(app)
httpServer.listen(process.env.HTTP_PORT)