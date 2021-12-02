const tools = require('./tools')

const template211 = require('./template-2.1.1.json')
const template300 = require('./template-3.0.0.json')

const config = require('./config.json')

exports.buildManifest2 = (lido) => {
  try {
    data = tools.clone(template211.manifest)
    data['@id'] = config.baseurl+lido['lido:lidoRecID']
    data.label = lido['lido:descriptiveMetadata']['lido:objectIdentificationWrap']['lido:titleWrap']['lido:titleSet'][0]['lido:appellationValue']
    data.sequences[0] = tools.clone(template211.sequence)
    data.sequences[0]['@id'] = 'https://'+lido['lido:lidoRecID']+'/s0'
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
  } catch(err) {
    return false
  }
  return data
}
