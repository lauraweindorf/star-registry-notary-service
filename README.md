# Udacity Project: Private Blockchain Notary Service (STAR Registry)

Implements a private Star blockchain API with the endpoints below. The Star Notary Service allows users to register a star on a private blockchain after blockchain identity validation.

The blockchain is initially populated with the Genesis STAR block on startup.

## Overview

The project implements a Memory Pool to hold the requests for validation and verification of blockchain identity and message signature.
Requests for validation are given a window of 300 second to complete. Subsequent requests to validate with the same wallet address
returns the remaining time left in the validation window.

When the validation window expires, the request is removed from the memory pool, requiring a re-submit starting from the beginning of
the process.

Once the user's blockchain identity and message signature has been verified, the request to register and notarize a Star can be
submitted and recorded for all time!

## Getting Started

These instructions will get a copy of the project up and running on your local machine for development and testing purposes.

### Prerequisites

* Node.js (includes npm)

### Installing

Clone the repository.

```
git clone [repo]
```

Open a command or terminal window and install the packages.

```
npm install
```

### Running

Start the app or Hapi server (listening on localhost:8000).

```
npm start
```

Use curl or Postman to try out the endpoints.

## Steps to Register a Star on the Private Blockchain

### Request validation

1. Submit a request to validation your blockchain identity (btc wallet address)

The validation window is 300 seconds, which is the time allotted to complete the next step,
submitting a request to validate a message signature.

#### POST http://localhost:8000/requestValidation

```
	{
		"address": "{wallet address}"
	}
```

Response:
```
	{
		"walletAddress": "{wallet address}",
    "requestTimeStamp": "1542587404",
    "message": "{wallet address}:1542587404:starRegistry",
    "validationWindow": 300
	}
```

### CURL Example
```
	curl -X POST http://localhost:8000/requestValidation \
		-H 'Content-Type: application/json' \
		-H 'cache-control: no-cache' \
		-d '{
				"address": "{wallet address}"
			}'
```

### Validate Message signature

2. Using your wallet (Electrum was used for this project) sign the message returned from the
validation request and submit another request to validate the message signature.

The validation window is 1800 seconds (15 min) for the next step to be completed, registering
a Star on the blockchain.

#### POST http://localhost:8000/message-signature/validate
```
	{
		"address": "{wallet address}",
		"signature": "{message signature}"
	}
```
Response:
```
	{
		"registerStar": {true|false},
		"status": {
			"address": "{wallet address}",
			"requestTimeStamp": "1542587404",
			"message": "{wallet address}:1542587404:starRegistry",
			"validationWindow": 1800,
			"messageSignature": "{valid|invalid}"
		}
	}
```

### CURL Example
```
	curl -X POST http://localhost:8000/message-signature/validation \
		-H 'Content-Type: application/json' \
		-H 'cache-control: no-cache' \
		-d '{
				"address": "{wallet address}",
				"signature": "{message signature}"
			}'
```

### Register Star

3. Submit the request to register the Star using for format below:

#### POST http://localhost:8000/block
```
	{
		"address": "{wallet address}",
		"star": {
			"dec": "{dec}",
			"ra": "{ra}",
			"story": "{story of the Star discovery}"
		}
	}
```
Response:
```
	{
		"hash": "92bb55379b998e13aa6f3e0cf18770936a0e135183e470064fb16086fc235bab",
		"height": 2,
		"body": {
			"address": "{wallet address}",
			"star": {
				"dec": "{dec}",
				"ra": "{ra}",
				"story": "{story}"
			}
		},
		"time": "1540060672",
		"previousBlockHash": "bb7462ac16bcea65133e86999c131b86eaae45b04d35735f4bef73cfa8b2b7d7"
	}
```

### CURL Example
```
	curl -X "POST" "http://localhost:8000/block" \
		-H 'Content-Type: application/json; charset=utf-8' \
		-d $'{
			"address": "142BDCeSGbXjWKaAnYXbMpZ6sbrSAo3DpZ",
			"star": {
				"dec": "-26° 29'\'' 24.9",
				"ra": "16h 29m 1.0s",
				"story": "Found star using https://www.google.com/sky/"
			}
		}'
```

### API Endpoints

#### POST http://localhost:8000/requestValidation

Request to validate blockchain Identity

#### POST http://localhost:8000/message-signature/validate

Validate request using message signature

#### POST http://localhost:8000/block

Register a new Star on the Registry Blockchain

#### POST http://localhost:8000/block

Register a Star block after validating identity

#### GET http://localhost:8000/block/{index}

Get a Star block by index

#### GET http://localhost:8000/stars/address:{wallet address}

Get one or more Star blocks that match the wallet address

#### GET http://localhost:8000/stars/hash:{block hash value}

Get a Star whose hash value matches the request

## Built With

* [HapiJs](https://hapijs.com) - The Node.js framework used

## Packages used

* hapi
* crypto-js/sha256
* boom
* bitcoinjs-lib
* bitcoinjs-message
* body-parser
* hex2ascii
* level
* level-mem

## License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details

## Acknowledgments

* Adapted from Jose Perera Morales' Udacity project: https://github.com/udacity/nd1309-rest-api-hapi
