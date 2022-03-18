async function getStats(client){
    let getVillages = 'SELECT COUNT(id) FROM towns WHERE type=\'с.\''
    let getTowns = 'SELECT COUNT(id) FROM towns WHERE type=\'гр.\''
    let getMunicips = 'SELECT COUNT(id) FROM municips'
    let getRegions = 'SELECT COUNT(id) FROM regions'

    let villages = await client.query(getVillages)
    let towns = await client.query(getTowns)
    let municpis = await client.query(getMunicips)
    let regions = await client.query(getRegions)

    return [villages.rows[0].count, towns.rows[0].count, municpis.rows[0].count, regions.rows[0].count]
}
/*SELECT mc.country_code, m.mountain_range, p.peak_name, p.elevation FROM mountains_countries mc
JOIN mountains m ON mc.mountain_id = m.id
JOIN peaks p ON m.id = p.mountain_id
WHERE mc.country_code = 'BG' AND p.elevation > 2835 ORDER BY p.elevation DESC*/
async function getSearchRes(client, srchStr){
    let getSearchRes = 'SELECT t.type, t.name, m.name AS name2, r.name AS name3 FROM towns t '
                      +'JOIN municips m ON t.municip_id = m.id '
                      +'JOIN regions r ON m.region_id = r.id '
                      +'WHERE lower(t.name) LIKE \'%\' || $1 || \'%\''
    let paramArr = []
    paramArr.push(srchStr.toLowerCase())

    let res = await client.query(getSearchRes, paramArr)
    return res.rows
}

module.exports = {getStats, getSearchRes}