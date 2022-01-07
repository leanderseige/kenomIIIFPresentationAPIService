const { XMLParser, XMLBuilder, XMLValidator } = require('fast-xml-parser')
const fetch = require('node-fetch')
const config = require('../src/config.json')

async function getSetsInfo(useCache,logger) {
  fetch('https://www.kenom.de/oai/?verb=ListSets')
	.then(response => response.text())
	.then( async (response) => {
    const parser = new XMLParser()
    let data = parser.parse(response)
		let list = ['institution:DE-15']
    for(let key in data['OAI-PMH']['ListSets']['set']) {
			console.log
			if(!list.includes(data['OAI-PMH']['ListSets']['set'][key]['setSpec'])) {
				list.push(data['OAI-PMH']['ListSets']['set'][key]['setSpec'])
			}
		}
		console.log(`Found ${list.length} collections.`)
		for(let id of list) {
			await getAll(id)
		}
  }).catch(error => {
    console.error(error)
  })
}

async function getAll(set) {
	let x = 1
	let response = { ok:true }
	console.log("Loading "+set)
	do {
		response = await fetch(`${config.baseurl}/kenom/collections/${set}/${x++}.json`)
		process.stdout.write('.')
	} while(response.ok)
	process.stdout.write(' done.\n')
}

getSetsInfo()
