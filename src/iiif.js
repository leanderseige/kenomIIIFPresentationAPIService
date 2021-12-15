const tools = require('./tools')

const template211 = require('./template-2.1.1.json')
const template300 = require('./template-3.0.0.json')

const config = require('./config.json')

exports.buildManifest2 = (lido) => {
  try {
    data = tools.clone(template211.manifest)
    data['@id'] = config.baseurl+`/kenom/manifests/${lido['lido:lidoRecID']}/manifest.json`
    data.label = lido['lido:descriptiveMetadata']['lido:objectIdentificationWrap']['lido:titleWrap']['lido:titleSet'][0]['lido:appellationValue']
    data.sequences[0] = tools.clone(template211.sequence)
    data.sequences[0]['@id'] = 'https://'+lido['lido:lidoRecID']+'/s0'
    if(lido['lido:administrativeMetadata']['lido:resourceWrap']!==undefined) {
      for(let k in lido['lido:administrativeMetadata']['lido:resourceWrap']['lido:resourceSet']) {
        data.sequences[0].canvases[k] = tools.clone(template211.canvas)
        data.sequences[0].canvases[k].label = lido['lido:lidoRecID']
        data.sequences[0].canvases[k]['@id'] = 'https://'+lido['lido:lidoRecID']+'/c'+k
        data.sequences[0].canvases[k].width = lido['lido:administrativeMetadata']['lido:resourceWrap']['lido:resourceSet'][k]['lido:resourceRepresentation'][0]['lido:resourceMeasurementsSet'][0]['lido:measurementValue']
        data.sequences[0].canvases[k].height = lido['lido:administrativeMetadata']['lido:resourceWrap']['lido:resourceSet'][k]['lido:resourceRepresentation'][0]['lido:resourceMeasurementsSet'][0]['lido:measurementValue']
        data.sequences[0].canvases[k].images[0] = tools.clone(template211.image)
        data.sequences[0].canvases[k].images[0]['@id'] = 'https://'+lido['lido:lidoRecID']+'/i'+k
        data.sequences[0].canvases[k].images[0].on = 'https://'+lido['lido:lidoRecID']+'/c'+k
        data.sequences[0].canvases[k].images[0].resource['@id'] = 'https://'+lido['lido:lidoRecID']+'/r'+k
        data.sequences[0].canvases[k].images[0].resource.service['@id'] = lido['lido:administrativeMetadata']['lido:resourceWrap']['lido:resourceSet'][k]['lido:resourceRepresentation'][0]['lido:linkResource'].replace('/full/full/0/default.jpg','')
        data.sequences[0].canvases[k].images[0].resource.width = lido['lido:administrativeMetadata']['lido:resourceWrap']['lido:resourceSet'][k]['lido:resourceRepresentation'][0]['lido:resourceMeasurementsSet'][0]['lido:measurementValue']
        data.sequences[0].canvases[k].images[0].resource.height = lido['lido:administrativeMetadata']['lido:resourceWrap']['lido:resourceSet'][k]['lido:resourceRepresentation'][0]['lido:resourceMeasurementsSet'][0]['lido:measurementValue']
      }
    }
  } catch(err) {
    return false
  }
  return data
}

exports.buildCollectionOfManifests2 = (part,dc,logger) => {
  try {
    data = tools.clone(template211.collection)
    data['@id'] = config.baseurl+`/kenom/collections/institution:DE-15/${part}.json`
    data['label'] = data['@id']
		delete data.collections
    for(let k in dc) {
      let newman = {}
      newman["@id"] = config.baseurl+"/kenom/manifests/"+dc[k]['header']['identifier']+"/manifest.json"
      newman["@type"] = "sc:Manifest"
      newman["label"] = dc[k]['metadata']['oai_dc:dc']['dc:title']
      data.manifests.push(newman)
    }
  } catch(error) {
    logger.error(error)
    return false
  }
  return data
}

exports.buildCollectionOfCollectionPages2 = (part,total,pagesize,logger) => {
  try {
    data = tools.clone(template211.collection)
    data['@id'] = config.baseurl+`/kenom/collections/institution:DE-15/${part}.json`
    data['label'] = data['@id']
		delete data.manifests
    for(let page=1; page<=Math.ceil(total/pagesize); page++) {
      let newcol = {}
      newcol["@id"] = config.baseurl+`/kenom/collections/institution:DE-15/${page}.json`
      newcol["@type"] = "sc:Collection"
      newcol["label"] = `Collection page ${page}`
      data.collections.push(newcol)
    }
  } catch(error) {
    logger.error(error)
    return false
  }
  return data
}
