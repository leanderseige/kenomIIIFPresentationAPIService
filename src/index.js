const express = require('express')
const log4js = require('log4js')
const Database = require('better-sqlite3');
const { v5 } = require('uuid')

const { cache_table_definition, cache_get_query, cache_store_query, cache_truncat_query } = require('./db')
const config = require('./config.json')
const kenom = require('./kenom')

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
if(config.cacheClearOneStartup) {
  db.exec(cache_truncat_query)
}
const stmt_get = db.prepare(cache_get_query)
const stmt_store = db.prepare(cache_store_query)

// Run Server
const app = express()
app.all('*', function (req, res, next) {

  // checking new query

	let p = req.url.split("/")
	p.shift()

	if(p.length!=4) {
    res.status(404).send("Error. Illegal query. 1")
		return
	}

	if(p[0]!=='kenom') {
    res.status(404).send("Error. Illegal query. 2")
		return
	}

	if( ! (['manifests','collections'].includes(p[1])) ) {
    res.status(404).send("Error. Illegal query. 3")
		return
	}

  const regexFilenameCheck = new RegExp('^(collection|manifest|[0-9]{1,4}).json$')
	if( ! regexFilenameCheck.test(p[3]) ) {
    res.status(404).send("Error. Illegal query. 4")
		return
	}

  const regexIdCheck = new RegExp('^[:0-9A-Za-z\_\-]{5,40}$')
  if( ! regexIdCheck.test(p[2]) ) {
	  res.status(404).send("Error. Illegal query. 5")
		return
	}

  // preparing response headers

  res.header('Access-Control-Allow-Origin', '*')
  res.header('Access-Control-Allow-Headers', '*')
  res.header('Access-Control-Allow-Methods', 'GET, OPTIONS')
  res.header('Content-Type', 'application/json')

  let key = v5(req.url,'3c0fce3d-6601-45fb-813d-b0c6e823ddfa')

  // caching
  if(config.caching) {
    logger.info("Looking for cached data.")
    let now = Math.round(Date.now()/1000)
    let cacheresult = stmt_get.get(key)
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
  }

  // sender function
  let sender = function(response) {
    if(response.status!==200) {
      logger.info(`Error. ${response.message}`)
      res.status(response.status).send(response.message)
      return
    }
    if(config.caching) {
      logger.info("Updating cache.")
      stmt_store.run(key, Math.round(Date.now()/1000), response.data)
    }
    logger.info("Sending data.")
    res.send(response.data)
  }

  switch(p[1]) {
    case 'collections':
      kenom.getCollection(p,logger).then( (response) =>{
        sender(response)
      }).catch(error => {
        logger.error("Error getting Collection.")
        logger.error(error)
        res.status(error.status).send(error.message)
      })
      break
    case 'manifests':
    default:
      kenom.getManifest(p,logger).then( (response) =>{
        sender(response)
      }).catch(error => {
        logger.error("Error getting Manifest.")
        logger.error(error)
        res.status(error.status).send(error.message)
      })
  }

})

app.listen(config.port,config.interface)
logger.info('Listening on '+config.interface+":"+config.port)
