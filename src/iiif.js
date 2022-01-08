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
  let rlinks = record.getRelatedLinks()
  try {
    data = tools.clone(template211.manifest)
    const mid = config.baseurl+`/kenom/manifests/${lidoRecID}`
    data['@id'] = `${mid}/manifest.json`
    data.label = label
    data.license = license
    data.requiredStatement = stmt
    data.metadata = [
			{ label:"Year", value: year },
      { label:"Place", value: place },
      { label:"Person", value: person }
    ]
    if(rlinks.length>0) {
      for(let rl in rlinks) {
        data.metadata.push({ label:'Link', value:rl })
      }
    }
    data.seeAlso = lidoUrl
    data.sequences[0] = tools.clone(template211.sequence)
    data.sequences[0]['@id'] = `https://${lidoRecID}/s0`
    for(let key in images) {
			let ilabel = images[key].perspective.charAt(0).toUpperCase() + images[key].perspective.slice(1)
      data.sequences[0].canvases[key] = tools.clone(template211.canvas)
      data.sequences[0].canvases[key].label = ilabel
      data.sequences[0].canvases[key]['@id'] = `${mid}/canvas${key}`
      data.sequences[0].canvases[key].width = parseInt(images[key].width)
      data.sequences[0].canvases[key].height = parseInt(images[key].height)
      data.sequences[0].canvases[key].images[0] = tools.clone(template211.image)
      data.sequences[0].canvases[key].images[0]['@id'] = `${mid}/image${key}`
      data.sequences[0].canvases[key].images[0].license = license
      data.sequences[0].canvases[key].images[0].on = `${mid}/canvas${key}`
      data.sequences[0].canvases[key].images[0].resource['@id'] = `${mid}/resource${key}`
      data.sequences[0].canvases[key].images[0].resource.service['@id'] = images[key].url.replace('/full/full/0/default.jpg','')
      data.sequences[0].canvases[key].images[0].resource.width = parseInt(images[key].width)
      data.sequences[0].canvases[key].images[0].resource.height = parseInt(images[key].height)
      data.sequences[0].canvases[key].images[0].resource.label = ilabel
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
