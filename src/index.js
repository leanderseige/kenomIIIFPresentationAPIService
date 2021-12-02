const express = require('express')
const fetch = require('node-fetch')
const log4js = require('log4js')
const { XMLParser, XMLBuilder, XMLValidator } = require('fast-xml-parser')
const Database = require('better-sqlite3');
const { cache_table_definition, cache_get_query, cache_store_query } = require('./db')
const iiif = require('./iiif')
const config = require('./config.json')

// Logger
log4js.configure({
  appenders: {
    svfile: { type: 'file', filename: 'logfile.log' },
    svout: { type: 'stdout' }
  },
  categories: { default: { appenders: ['svfile','svout'], level: 'info' } }
})
const logger = log4js.getLogger()
logger.level = 'INFO'

// Database
const db = new Database('cache.db')
db.exec(cache_table_definition)
const stmt_get = db.prepare(cache_get_query)
const stmt_store = db.prepare(cache_store_query)

// Run Server
const app = express()
app.all('*', function (req, res, next) {

  logger.info("New request.")

  if(req.query.identifier===undefined) {
    res.status(404).send("Error. No identifier specified.")
    return
  }

  const regex = new RegExp('^[0-9A-Za-z\_\-]{10,40}$')
  if(!regex.test(req.query.identifier)) {
    res.status(404).send("Error. Illegal identifier specified.")
    return
  }

  let identifier = req.query.identifier
  logger.info("Identifier "+identifier)

  let now = Math.round(Date.now()/1000)
  let cacheresult = stmt_get.get(identifier)
  if(cacheresult) {
    let age = now-cacheresult.last
    logger.info("Cache age: "+age+" sec.")
    if(age<60) {
      logger.info("Sending cached data.")
      res.send(cacheresult.body)
      return
    } else {
      logger.info("Cache is too old.")
    }
  } else {
    logger.info("No cache available.")
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

  logger.info("Fetching fresh data.")
  fetch(query,options)
    .then(response => response.text())
    .then(response => {
      const parser = new XMLParser()
      let data = parser.parse(response)
      data = iiif.buildManifest2(data['OAI-PMH']['GetRecord']['record']['metadata']['lido:lido'])
      if(!data) {
        res.status(500).send("Error. Can't generate IIIF Manifest.")
        logger.info("Error. Can't generate IIIF Manifest.")
        return
      }
      logger.info("Updating cache.")
      stmt_store.run(identifier, Math.round(Date.now()/1000), JSON.stringify(data))
      logger.info("Sending data.")
      res.header('Content-type', 'application/json')
      res.send(JSON.stringify(data))
    }).catch(err => {
        logger.error("Error. Could not complete request.")
        res.status(500).send("Error. Could not complete request.")
      }
    )
})

app.listen(config.port,config.interface)
logger.info('Listening on '+config.interface+":"+config.port)
