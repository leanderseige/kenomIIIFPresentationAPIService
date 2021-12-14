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

var count = 0

function getRecursiveCollection(query,options) {
  count = count + 1
  console.log(`${count}. run (${count*200} records)`)
  return new Promise((resolve, reject) => {
    fetch(query,options)
      .then(response => response.text())
      .then(response => {
        const parser = new XMLParser()
        let data = parser.parse(response)
        console.log(data)
        // console.log(data['OAI-PMH']['ListRecords']['record'])
        if(data['OAI-PMH']['ListRecords']['resumptionToken']!==undefined) {
          getRecursiveCollection(
            `https://www.kenom.de/oai/?verb=ListRecords&resumptionToken=${data['OAI-PMH']['ListRecords']['resumptionToken']}`
            ,options)
            .then( (response) => resolve(response.concat(data['OAI-PMH']['ListRecords']['record'])))
            .catch(err => { reject("ERROR 2") })
        } else {
          console.log("RESOLVING")
          resolve(data['OAI-PMH']['ListRecords']['record'])
        }
      }).catch(err => {
          console.log("ERROR")
          reject({status:500,message:"Could not complete request.",data:null})
        }
      )
  })
}

exports.getCollection = (p,logger) => {
  return new Promise((resolve, reject) => {

    logger.info("Fetching fresh data.")
    let query = `https://www.kenom.de/oai/?verb=ListRecords&metadataPrefix=oai_dc&set=institution:DE-15`
    let options = {
      method: 'GET',
      headers: {}
    }
    getRecursiveCollection(query,options)
      .then( (response) => {
        data = iiif.buildCollection2(response)
        // data = response
        resolve({status:200,message:null,data:JSON.stringify(data)})
      })
      .catch(err => { reject("ERROR 2") })
  })

}
