# kenomIIIFPresentationAPIService

This is an experimental service to generate IIIF manifests for KENOM (http://kenom.de) on-the-fly from OAI/LIDO data.

## Installation:
* clone this repository
* `cd kenomIIIFPresentationAPIService`
* `cp src/config.example.json src/config.json`
* `vi src/config.json`
* `npm install`
* `screen npm start`

## Demo

`https://iiif.cloud/kenom?identifier=<identifier>`

https://iiif.cloud/kenom?identifier=record_DE-15_kenom_161020

https://presentation-validator.iiif.io/validate?version=2.1&url=https://iiif.cloud/kenom?identifier=record_DE-15_kenom_161020
