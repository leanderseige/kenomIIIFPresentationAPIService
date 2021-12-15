const { XMLParser, XMLBuilder, XMLValidator } = require('fast-xml-parser')
const fetch = require('node-fetch')

const iiif = require('./iiif')


exports.getManifest = (p,logger) => {
  return new Promise((resolve, reject) => {
    let query = `https://www.kenom.de/oai/?verb=GetRecord&identifier=${p[2]}&metadataPrefix=lido`
    let options = {
        method: 'GET',
        headers: {}
      }
    logger.info("Fetching fresh data: "+query)
    fetch(query,options)
      .then(response => response.text())
      .then(response => {
        const parser = new XMLParser()
        let data = parser.parse(response)
        data = iiif.buildManifest2(data['OAI-PMH']['GetRecord']['record']['metadata']['lido:lido'])
        if(!data) {
          reject({status:500,message:"Can't generate IIIF Manifest",data:null})
          return
        }
        resolve({status:200,message:null,data:JSON.stringify(data)})
      }).catch(err => {
          reject({status:500,message:"Could not complete request.",data:null})
        }
      )
  })
}

function getRecursiveCollection(query,options,part,logger) {
  return new Promise((resolve, reject) => {
    fetch(query,options)
      .then(response => response.text())
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
        getRecursiveCollection(
            `https://www.kenom.de/oai/?verb=ListRecords&resumptionToken=${data['OAI-PMH']['ListRecords']['resumptionToken']['#text']}`
            ,options
            ,`${(page-1)}`
            ,logger
          )
          .then( (response) => resolve(response) )
          .catch(err => { reject("ERROR 2") })
      }).catch(error => {
          logger.error("Error getting OAI data.")
          logger.error(error)
          reject({status:500,message:"Could not complete request.",data:null})
        }
      )
  })
}

exports.getCollection = (p,logger) => {
  return new Promise((resolve, reject) => {

    logger.info("Fetching fresh data.")
    let part = p[3].replace('.json','')
    let query = `https://www.kenom.de/oai/?verb=ListRecords&metadataPrefix=oai_dc&set=${p[2]}`
    console.log(query)
    let options = {
      method: 'GET',
      headers: {}
    }
    getRecursiveCollection(query,options,part,logger)
      .then( (response) => {
        if(part==='collection') {
          data = response['OAI-PMH']['ListRecords']['resumptionToken']
          data = iiif.buildCollectionOfCollectionPages2(part,data['@_completeListSize'],data['@_cursor'],logger)
          console.log(data)
        } else {
          data = iiif.buildCollectionOfManifests2(part,response,logger)
        }
        // data = response
        resolve({status:200,message:null,data:JSON.stringify(data)})
      })
      .catch(err => { reject("ERROR 2 "+err) })
  })

}
