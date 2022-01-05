# kenomIIIFPresentationAPIService

This is an experimental service to generate IIIF manifests for KENOM (http://kenom.de) on-the-fly from OAI/LIDO data.

## Installation:

* make sure you have nodemon installed https://www.npmjs.com/package/nodemon
* clone this repository
* `cd kenomIIIFPresentationAPIService`
* `cp src/config.example.json src/config.json`
* `vi src/config.json`
* `npm install`
* `screen npm start`

## URI Schemas

`https://iiif.ub.uni-leipzig.de/kenom/<Argument1>/<Argument2>/<Argument3>.json`

| |Argument 1|Argument 2|Argument 3|
| |----------|----------|----------|
|Top Level Collection|`collections`|Set (according to OAI/PMH)|`collection`|
|Subordinate Collection|`collections`|Set (according to OAI/PMH)|page number (from OAI/PMH)|
|Manifest|`manifests`|Object ID|`manifest`|

Examples:

`https://iiif.ub.uni-leipzig.de/kenom/collections/institution:DE-15/collection.json`

`https://iiif.ub.uni-leipzig.de/kenom/collections/institution:DE-15/1.json`

`https://iiif.ub.uni-leipzig.de/kenom/manifests/record_DE-15_kenom_161017/manifest.json`
