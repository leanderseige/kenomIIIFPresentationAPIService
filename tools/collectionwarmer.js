const fetch = require('node-fetch')

async function getAll() {
	for(let x=1; x<138; x++) {
		console.log(`fetching collection ${x}`)
		// await fetch(`https://iiif.ub.uni-leipzig.de/kenom/collections/institution:DE-15/${x}.json`)
		await fetch(`http://localhost:2000/kenom/collections/institution:DE-15/${x}.json`)
	}
}

getAll()
