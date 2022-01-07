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

function getCachedFetch(query,useCache,logger) {
  return new Promise((resolve,reject) => {

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
        	resolve(retval)
        	return
				}
      }
    }

    let options = {
      method: 'GET',
      headers: {}
    }
    fetch(query,options)
      .then(response => {
        if(!response.ok) {
          db.close()
          reject({status:500,message:"Could not complete request. 1",data:null})
          return
        }
        response.text().then(response => {
          stmt_store.run(key, Math.round(Date.now()/1000), response)
          db.close()
          resolve(response)
          return
        })
      }).catch( error => {
        db.close()
        reject({status:500,message:"Could not complete request. 2",data:null})
        return
      })

  })
}


exports.getManifest = (p,logger,req) => {
  return new Promise((resolve, reject) => {
    let lidoUrl = `https://www.kenom.de/oai/?verb=GetRecord&identifier=${p[2]}&metadataPrefix=lido`
    logger.info("Fetching fresh data: "+lidoUrl)
    getCachedFetch(lidoUrl,true,logger)
      .then(response => {
        const reader = new LidoReader(response)
        let records = reader.getAllRecords()
        data = iiif.buildManifest2(p,records[0],lidoUrl)
        // data = iiif.buildManifest2(data['OAI-PMH']['GetRecord']['record']['metadata']['lido:lido'])
        if(!data) {
          reject({status:500,message:"Can't generate IIIF Manifest",data:null})
          return
        }
        resolve({status:200,message:null,data:JSON.stringify(data)})
      }).catch(err => {
          reject({status:500,message:"Could not complete request. Error parsing.",data:null})
        }
      )
  })
}

function getRecursiveCollection(query,part,logger) {
  return new Promise((resolve, reject) => {
    console.log("QUERY "+query)
    getCachedFetch(query,true,logger)
      .then(response => {
        const parser = new XMLParser({ignoreAttributes:false})
        let data = parser.parse(response)
        if(part==='collection') {
          resolve(data)
          return
        }
        page=parseInt(part)
        if(page===1) {
          resolve(data['OAI-PMH']['ListRecords']['record'])
          return
        }
        // let nofrecords = parseInt(data['OAI-PMH']['ListRecords']['resumptionToken']['@_completeListSize'])

        logger.info(`Step ${page} to ${part}`)
        getRecursiveCollection(
            `https://www.kenom.de/oai/?verb=ListRecords&resumptionToken=${data['OAI-PMH']['ListRecords']['resumptionToken']['#text']}`
            ,`${(page-1)}`
            ,logger
          )
          .then( (response) => resolve(response) )
          .catch(error => { reject(error) })
      }).catch(error => {
          logger.error("Error getting OAI data (manifest).")
          logger.error(error)
          reject({status:500,message:"Could not complete request.",data:null})
        }
      )
  })
}

function getSetsInfo(useCache,logger) {
  return new Promise((resolve,reject) => {
    getCachedFetch('https://www.kenom.de/oai/?verb=ListSets',useCache,logger)
      .then(response => {
        const parser = new XMLParser()
        let data = parser.parse(response)
        resolve(data['OAI-PMH']['ListSets']['set'])
      })
      .catch(error => {
        reject(error)
      })
  })
}

exports.getCollection = (p,logger) => {
  return new Promise((resolve, reject) => {

    logger.info("Fetching fresh data.")
    let part = p[3].replace('.json','')
    let query = `https://www.kenom.de/oai/?verb=ListRecords&metadataPrefix=oai_dc&set=${p[2]}`
    console.log(query)
    getRecursiveCollection(query,part,logger)
      .then( (response) => {
        getSetsInfo(true,logger).then(setsInfo => {
          let collName = ''
          for(let setInfo of setsInfo) {
            if(setInfo.setSpec === p[2]) {
              collName = setInfo.setName
              break
            }
          }
          if(part==='collection') {
            data = response['OAI-PMH']['ListRecords']['resumptionToken']
            data = iiif.buildCollectionOfCollectionPages2(part,data['@_completeListSize'],data['@_cursor'],logger,collName)
          } else {
            data = iiif.buildCollectionOfManifests2(part,response,logger)
          }
          data.description = collName
          data.label = collName
          resolve({status:200,message:null,data:JSON.stringify(data)})
        }).catch(
          e => console.error(e)
        )
      }).catch(error => {
          logger.error("Error getting OAI data (collection).")
          logger.error(error)
          reject({status:500,message:"Could not complete request.",data:null})
        }
      )
  })
}
