const { XMLParser, XMLBuilder, XMLValidator } = require('fast-xml-parser')
// const { LidoReader } = require('liblido')
const LidoReader = require('liblido')
const fetch = require('node-fetch')
const Database = require('better-sqlite3')
const { v5 } = require('uuid')
const config = require('./config.json')
const tools = require('./tools.js')
const { cache_table_definition, cache_get_query, cache_store_query, cache_truncat_query } = require('./db')
const iiif = require('./iiif')

async function getCachedFetch(query, useCache, logger) {
  let key = v5(query,'3c0fce3d-6601-45fb-813d-b0c6e823ddfa')

  const db = new Database('cache.db')
  const stmt_get = db.prepare(cache_get_query)
  const stmt_store = db.prepare(cache_store_query)

  if(useCache) {
    let cacheresult = stmt_get.get(key)
    if(cacheresult) {
      let now = Math.round(Date.now()/1000)
      let age = now-cacheresult.last
      if(config.cacheMaxAge===-1 || age<config.cacheMaxAge) {
        logger.info("Returning backend cache data.")
        let retval = tools.clone(cacheresult.body)
        db.close()
        return retval
      }
    }
  }

  try {
    const response = await fetch(query)

    if (!response.ok) {
      throw new Error('getCachedFetch: response code was not `ok`')
    }

    const body = await response.text()
    stmt_store.run(key, Math.round(Date.now()/1000), body)
    db.close()
    return body

  } catch (e) {
    db.close()
    throw e
  }
}

exports.getManifest = async (p,logger,req) => {
  let lidoUrl = `https://www.kenom.de/oai/?verb=GetRecord&identifier=${p[2]}&metadataPrefix=lido`
  logger.info("Fetching fresh data: "+lidoUrl)
  const response = await getCachedFetch(lidoUrl,true,logger)

  const reader = new LidoReader(response)
  let records = reader.getAllRecords()
  const data = iiif.buildManifest2(p,records[0],lidoUrl)
  // data = iiif.buildManifest2(data['OAI-PMH']['GetRecord']['record']['metadata']['lido:lido'])

  if(!data) {
    throw new Error("Can't generate IIIF Manifest")
  }

  return data
}

async function getRecursiveCollection(query,part,logger) {
  console.log("QUERY "+query)
  const response = await getCachedFetch(query,true,logger)
  const parser = new XMLParser({ignoreAttributes:false})
  const data = parser.parse(response)

  if(part === 'collection') {
    return data
  }

  const page = parseInt(part)

  if(page === 1) {
    return data['OAI-PMH']['ListRecords']['record']
  }

  // let nofrecords = parseInt(data['OAI-PMH']['ListRecords']['resumptionToken']['@_completeListSize'])

  logger.info(`Step ${page} to ${part}`)

  return getRecursiveCollection(
    `https://www.kenom.de/oai/?verb=ListRecords&resumptionToken=${data['OAI-PMH']['ListRecords']['resumptionToken']['#text']}`
    ,(page - 1).toString()
    ,logger
  )
}
async function getFatRecursiveCollection(query,logger) {
  console.log("QUERY "+query)
  const response = await getCachedFetch(query,true,logger)
  const parser = new XMLParser({ignoreAttributes:false})
  const data = parser.parse(response)

  let retval = JSON.parse(JSON.stringify(data['OAI-PMH']['ListRecords']['record']))

  if(data['OAI-PMH']['ListRecords']['resumptionToken']) {
    return retval.concat( await getFatRecursiveCollection(
      `https://www.kenom.de/oai/?verb=ListRecords&resumptionToken=${data['OAI-PMH']['ListRecords']['resumptionToken']['#text']}`
      ,logger
    ))
  } else {
    return retval
  }
}

async function getSetsInfo(useCache,logger) {
  const response = await getCachedFetch('https://www.kenom.de/oai/?verb=ListSets',useCache,logger)
  const parser = new XMLParser()
  const data = parser.parse(response)
  return data['OAI-PMH']['ListSets']['set']
}

exports.getCollection = async (p,logger) => {
  logger.info("Fetching fresh data.")
  const part = p[3].replace('.json','')
  const set = p[2]
  const query = `https://www.kenom.de/oai/?verb=ListRecords&metadataPrefix=oai_dc&set=${p[2]}`
  console.log(query)

  let response

  if(part === 'all') {
    response = await getFatRecursiveCollection(query,logger)
  } else {
    response = await getRecursiveCollection(query,part,logger)
  }
  const setsInfo = await getSetsInfo(true, logger)

  let collName = ''
  for(const setInfo of setsInfo) {
    if(setInfo.setSpec === p[2]) {
      collName = setInfo.setName
      break
    }
  }

  let data
  if(part === 'collection') {
    data = response['OAI-PMH']['ListRecords']['resumptionToken']
    data = iiif.buildCollectionOfCollectionPages2(part,set,data['@_completeListSize'],data['@_cursor'],logger,collName)
  } else {
    data = iiif.buildCollectionOfManifests2(part,set,response,part==='all',logger)
  }

  data.description = collName
  data.label = collName
  return data
}
