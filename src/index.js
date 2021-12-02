const express = require('express')
const fetch = require('node-fetch')
const log4js = require('log4js')
const { XMLParser, XMLBuilder, XMLValidator } = require('fast-xml-parser')
const Database = require('better-sqlite3');

const { cache_table_definition, cache_get_query, cache_store_query } = require('./db')
const iiif = require('./iiif')

const config = require('./config.json')

// Logger
const logger = log4js.getLogger()

// Database
const db = new Database('cache.db')
db.exec(cache_table_definition)
const stmt_get = db.prepare(cache_get_query)
const stmt_store = db.prepare(cache_store_query)

// init server
const app = express()

// run server
app.all('*', function (req, res, next) {

  let identifier =  "record_DE-15_kenom_186769"
  if(req.query.identifier!==undefined) {
    const regex = new RegExp('^[0-9A-Za-z\_\-]{10,40}$')
    if(regex.test(req.query.identifier)) {
      identifier = req.query.identifier
    }
  }

  let cacheresult = stmt_get.get(identifier)
  let now = Math.round(Date.now()/1000)
  console.log({cacheresult:cacheresult})
  if(cacheresult) {
    let age = now-cacheresult.last
    console.log("CACHE AGE: "+age)
    if(age<60) {
      console.log("SENDING CACHE BODY")
      res.send(cacheresult.body)
      return
    } else {
      console.log("CACHE TOO OLD")
    }
  } else {
    console.log("NO CACHE")
  }

  let query = `https://www.kenom.de/oai/?verb=GetRecord&identifier=${identifier}&metadataPrefix=lido`

  res.header('Access-Control-Allow-Origin', '*')
  res.header('Access-Control-Allow-Headers', '*')
  res.header('Access-Control-Allow-Methods', 'GET, OPTIONS')
  res.header('Content-Type', 'application/json')

  let options = {
      method: 'GET',
      headers: {}
    }

  console.log(query)

  fetch(query,options)
    .then(response => response.text())
    .then(response => {
      const parser = new XMLParser()
      let data = parser.parse(response)
      data = iiif.buildManifest2(data['OAI-PMH']['GetRecord']['record']['metadata']['lido:lido'])
      stmt_store.run(identifier, Math.round(Date.now()/1000), JSON.stringify(data))
      res.header('Content-type', 'application/json')
      res.send(JSON.stringify(data))
    }).catch(err => {
        console.log(err)
        logger.error(err)
        res.send("Error. (Could not load OAI data.)")
      }
    )
})

app.listen(config.port,config.interface)
logger.info('Listening on '+config.interface+":"+config.port)
