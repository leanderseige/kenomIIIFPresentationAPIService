const fetch = require('node-fetch')
const config = require('../src/config.json')

async function getAll() {
	for(let x=1; x<138; x++) {
		console.log(`fetching collection ${x}`)
		await fetch(`${config.baseurl}/kenom/collections/institution:DE-15/${x}.json`)
	}
}

getAll()
