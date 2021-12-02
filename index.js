const express = require('express')
const fetch = require('node-fetch')
const log4js = require('log4js')
const { XMLParser, XMLBuilder, XMLValidator} = require('fast-xml-parser')

const config = require('./config.json')
const template211 = require('./template-2.1.1.json')
const template300 = require('./template-3.0.0.json')

const logger = log4js.getLogger()

// init server
const app = express()

function buildManifest2(lido) {
  data = clone(template211.manifest)
  data['@id'] = 'https://'+lido['lido:lidoRecID']
  data.label = lido['lido:descriptiveMetadata']['lido:objectIdentificationWrap']['lido:titleWrap']['lido:titleSet'][0]['lido:appellationValue']
  data.sequences[0] = clone(template211.sequence)
  data.sequences[0]['@id'] = 'https://'+lido['lido:lidoRecID']+'/s0'
  for(let k in lido['lido:administrativeMetadata']['lido:resourceWrap']['lido:resourceSet']) {
    data.sequences[0].canvases[k] = clone(template211.canvas)
    data.sequences[0].canvases[k]['@id'] = 'https://'+lido['lido:lidoRecID']+'/c'+k
    data.sequences[0].canvases[k].width = lido['lido:administrativeMetadata']['lido:resourceWrap']['lido:resourceSet'][k]['lido:resourceRepresentation'][0]['lido:resourceMeasurementsSet'][0]['lido:measurementValue']
    data.sequences[0].canvases[k].height = lido['lido:administrativeMetadata']['lido:resourceWrap']['lido:resourceSet'][k]['lido:resourceRepresentation'][0]['lido:resourceMeasurementsSet'][0]['lido:measurementValue']
    data.sequences[0].canvases[k].images[0] = clone(template211.image)
    data.sequences[0].canvases[k].images[0]['@id'] = 'https://'+lido['lido:lidoRecID']+'/i'+k
    data.sequences[0].canvases[k].images[0].on = 'https://'+lido['lido:lidoRecID']+'/c'+k
    data.sequences[0].canvases[k].images[0].resource['@id'] = 'https://'+lido['lido:lidoRecID']+'/r'+k
    data.sequences[0].canvases[k].images[0].resource.service['@id'] = lido['lido:administrativeMetadata']['lido:resourceWrap']['lido:resourceSet'][k]['lido:resourceRepresentation'][0]['lido:linkResource'].replace('/full/full/0/default.jpg','')
    data.sequences[0].canvases[k].images[0].resource.width = lido['lido:administrativeMetadata']['lido:resourceWrap']['lido:resourceSet'][k]['lido:resourceRepresentation'][0]['lido:resourceMeasurementsSet'][0]['lido:measurementValue']
    data.sequences[0].canvases[k].images[0].resource.height = lido['lido:administrativeMetadata']['lido:resourceWrap']['lido:resourceSet'][k]['lido:resourceRepresentation'][0]['lido:resourceMeasurementsSet'][0]['lido:measurementValue']
  }
  return data
}

function clone(i) {
  return JSON.parse(JSON.stringify(i))
}

app.all('*', function (req, res, next) {

  let identifier =  "record_DE-15_kenom_186769"
  if(req.query.identifier!==undefined) {
    identifier = req.query.identifier
  }
  let query = `https://www.kenom.de/oai/?verb=GetRecord&identifier=${identifier}&metadataPrefix=lido`

  res.header('Access-Control-Allow-Origin', '*')
  res.header('Access-Control-Allow-Headers', '*')
  res.header('Access-Control-Allow-Methods', 'GET, OPTIONS')
  // res.header('Content-Type', 'application/json')

  let options = {
      method: 'GET',
      headers: {}
    }

  console.log(query)

  fetch(query,options)
    .then(response => response.text())
    .then(response => {
      // console.log(response)
      // res.header('Content-type', 'application/xml')
      const parser = new XMLParser()
      let data = parser.parse(response)
      data = buildManifest2(data['OAI-PMH']['GetRecord']['record']['metadata']['lido:lido'])
      res.header('Content-type', 'application/json')
      res.send(data)
    }).catch(err => logger.error(err))
})

app.listen(config.port,config.interface)
logger.info('Listening on '+config.interface+":"+config.port)
