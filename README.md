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

## Demo

`https://iiif.cloud/kenom?identifier=<identifier>`

https://iiif.cloud/kenom?identifier=record_DE-15_kenom_161020
