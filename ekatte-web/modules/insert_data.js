var XLSX = require('xlsx')

function parseXlxsFile(path){
    var workbook = XLSX.readFile(path)
    var sheet_name_list = workbook.SheetNames
    var xlData = XLSX.utils.sheet_to_json(workbook.Sheets[sheet_name_list[0]])
    return xlData
}

function parseRegions(){
    let regions = parseXlxsFile('./public/xlsx/Ek_obl.xlsx')
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
    let municips = parseXlxsFile('./public/xlsx/Ek_obst.xlsx')
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
    let towns = parseXlxsFile('./public/xlsx/Ek_atte.xlsx')
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

function insertRegions(regions, client){
    let sqlRegions = 'INSERT INTO regions(id, name) VALUES '
    let arrItems = []
    let arrPlchldrs = []
    let index = 1

    regions.forEach((region) => {     
        let item = `($${index}, $${index+1})`
        
        arrPlchldrs.push(item)
        arrItems.push(region.id)
        arrItems.push(region.name)
        index+=2
    });

    sqlRegions += arrPlchldrs.join(',')
    sqlRegions += ' ON CONFLICT DO NOTHING'

    client.query(sqlRegions, arrItems, (err, res) => {
        if (err) {
            console.log('Error entering regions data')
        } else {
            console.error('Regions data added sucessfully!')
        }
    })
}

function insertMunicipis(municips, client){
    let sqlMunicpis = 'INSERT INTO municips(id, region_id, name) VALUES '
    let arrItems = []
    let arrPlchldrs = []
    let index = 1

    municips.forEach((municip) => {     
        let item = `($${index}, $${index+1}, $${index+2})`
        
        arrPlchldrs.push(item)
        arrItems.push(municip.id)
        arrItems.push(municip.region_id)
        arrItems.push(municip.name)
        index+=3
    });
    
    sqlMunicpis += arrPlchldrs.join(',')
    sqlMunicpis += ' ON CONFLICT DO NOTHING'

    client.query(sqlMunicpis, arrItems, (err, res) => {
        if (err) {
            console.log('Error entering municipalities data')
        } else {
            console.error('Municipalities data added sucessfully!')
        }
    })
}

function insertTowns(towns, client){
    let sqlTowns = 'INSERT INTO towns(municip_id, ekatte, type, name) VALUES '
    let arrItems = []
    let arrPlchldrs = []
    let index = 1

    towns.forEach((town) => {     
        let item = `($${index}, $${index+1}, $${index+2}, $${index+3})`
        
        arrPlchldrs.push(item)
        arrItems.push(town.municip_id)
        arrItems.push(town.ekatte)
        arrItems.push(town.type)
        arrItems.push(town.name)
        index+=4
    });
    
    sqlTowns += arrPlchldrs.join(',')
    sqlTowns += ' ON CONFLICT DO NOTHING'

    client.query(sqlTowns, arrItems, (err, res) => {
        if (err) {
            console.log('Error entering towns data')
        } else {
            console.error('Towns data added sucessfully!')
        }
    })
}

function insertDataDB(client){
    let regions = parseRegions()
    let municips = parseMunicips()
    let towns = parseTowns()

    insertRegions(regions, client)
    insertMunicipis(municips, client)
    insertTowns(towns, client)
}

module.exports = {insertDataDB}