const tools = require('./tools')

const template211 = require('./template-2.1.1.json')
const template300 = require('./template-3.0.0.json')

const config = require('./config.json')

exports.buildManifest2 = (p,record,lidoUrl) => {
  let lidoRecID = record.getLidoRecordID()
  let label = record.getLabel()
  let images = record.getKenomImages()
  let license = record.getLicenseUri()
  let stmt = record.getReqStatement()
  let year = record.getCreationYear()
  let place = record.getCreationPlace()
  let person = record.getEventActorRoles()
  try {
    data = tools.clone(template211.manifest)
    data['@id'] = config.baseurl+`/kenom/manifests/${lidoRecID}/manifest.json`
    data.label = label
    data.license = license
    data.requiredStatement = stmt
    data.metadata = [
			{ label:"Year", value: year },
      { label:"Place", value: place },
      { label:"Person", value: person }
    ]
    data.seeAlso = lidoUrl
    data.sequences[0] = tools.clone(template211.sequence)
    data.sequences[0]['@id'] = `https://${lidoRecID}/s0`
    for(let key in images) {
      data.sequences[0].canvases[key] = tools.clone(template211.canvas)
      data.sequences[0].canvases[key].label = lidoRecID
      data.sequences[0].canvases[key]['@id'] = `https://${lidoRecID}/c${key}`
      data.sequences[0].canvases[key].width = parseInt(images[key].width)
      data.sequences[0].canvases[key].height = parseInt(images[key].height)
      data.sequences[0].canvases[key].images[0] = tools.clone(template211.image)
      data.sequences[0].canvases[key].images[0]['@id'] = `https://${lidoRecID}/i${key}`
      data.sequences[0].canvases[key].images[0].on = `https://${lidoRecID}/c${key}`
      data.sequences[0].canvases[key].images[0].resource['@id'] = `https://${lidoRecID}/r${key}`
      data.sequences[0].canvases[key].images[0].resource.service['@id'] = images[key].url.replace('/full/full/0/default.jpg','')
      data.sequences[0].canvases[key].images[0].resource.width = parseInt(images[key].width)
      data.sequences[0].canvases[key].images[0].resource.height = parseInt(images[key].height)
    }
  } catch(err) {
    console.log(err)
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

exports.buildCollectionOfCollectionPages2 = (part,total,pagesize,logger,collName) => {
  try {
    data = tools.clone(template211.collection)
    data['@id'] = config.baseurl+`/kenom/collections/institution:DE-15/${part}.json`
    data['label'] = data['@id']
		delete data.manifests
    for(let page=1; page<=Math.ceil(total/pagesize); page++) {
      let newcol = {}
      newcol["@id"] = config.baseurl+`/kenom/collections/institution:DE-15/${page}.json`
      newcol["@type"] = "sc:Collection"
      newcol["label"] = `${collName}, Page ${page}`
      data.collections.push(newcol)
    }
  } catch(error) {
    logger.error(error)
    return false
  }
  return data
}
