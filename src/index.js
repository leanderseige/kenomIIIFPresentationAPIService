const express = require('express')
const compression = require('compression')
const log4js = require('log4js')
const Database = require('better-sqlite3');
const { v5 } = require('uuid')

const { cache_table_definition, cache_get_query, cache_store_query, cache_truncate_query } = require('./db')
const config = require('./config.json')
const kenom = require('./kenom')

const fs = require('fs');

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
if(config.cacheClearOnStartup) {
  db.exec(cache_truncate_query)
}
const stmt_get = db.prepare(cache_get_query)
const stmt_store = db.prepare(cache_store_query)

// Run Server
const app = express()
app.use(compression())

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

  // p[1] => collection or manifest
	if( ! (['manifests','collections'].includes(p[1])) ) {
    res.status(404).send("Error. Illegal query. 3")
		return
	}

  // p[2] => collection set
  //      => manifest id
  const regexIdCheck = new RegExp('^[:0-9A-Za-z\_\-]{5,40}$')
  if( ! regexIdCheck.test(p[2]) ) {
	  res.status(404).send("Error. Illegal query. 5")
		return
	}

  // p[3] => collection:collection for top level or number for sub-level
  //      => manifest: just 'manifest'
  const regexFilenameCheck = new RegExp('^(collection|manifest|all|[0-9]{1,4}).json$')
	if( ! regexFilenameCheck.test(p[3]) ) {
    res.status(404).send("Error. Illegal query. 4")
		return
	}


  // preparing response headers

  res.header('Access-Control-Allow-Origin', '*')
  res.header('Access-Control-Allow-Headers', '*')
  res.header('Access-Control-Allow-Methods', 'GET, OPTIONS')
  res.header('Content-Type', 'application/json')

  let key = v5(config.baseurl+req.url,'3c0fce3d-6601-45fb-813d-b0c6e823ddfa')

  // caching
  if(config.caching) {
    logger.info("Looking for cached data.")
    let now = Math.round(Date.now()/1000)
    console.log("looking for key "+key)
    let cacheresult = stmt_get.get(key)
    console.log("found "+cacheresult)
    if(cacheresult) {
      let age = now-cacheresult.last
      logger.info("Cache age: "+age+" sec.")
      if(config.cacheMaxAge===-1 || age<config.cacheMaxAge) {
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

  const [getData, errMessageForClient] = p[1] === 'collections'
    ? [kenom.getCollection, 'Error getting collection']
    : [kenom.getManifest, 'Error getting manifest']

  getData(p, logger).then(data => {
    if(config.caching) {
      logger.info("Updating cache.")
      console.log("key: "+key)
      fs.writeFile("last_cache.blob", JSON.stringify(data), ()=>{} )
      stmt_store.run(key, Math.round(Date.now()/1000), JSON.stringify(data))
    }
    logger.info("Sending data.")
    res.json(data)
  })
  .catch(error => {
    logger.error(error)
    res.status(500).send(errMessageForClient)
  })
})

app.listen(config.port,config.interface)
logger.info('Listening on '+config.interface+":"+config.port)
