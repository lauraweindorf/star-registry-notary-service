# Udacity Project: Private Blockchain Notary Service
(STAR Registry)

Implements a private Star blockchain API with the endpoints below. The Star Notary Service allows users to register a star on a private blockchain after blockchain identity validation.

The blockchain is initially populated with the Genesis STAR block on startup.

## Overview

The project implements a Memory Pool to hold the requests for validation and verification of blockchain identity and message signature.
Requests for validation are given a window of 300 second to complete. Subsequent requests to validate with the same wallet address
returns the remaining time left in the validation window.

When the validation window expires, the request is removed from the memory pool, requiring a re-submit starting from the beginning of
the process.

After signing the message and submitting for verification, the user has 1800 seconds to submit the Star for registration
on the blockchain.

A successful Star registration is recorded for all time!

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

1. Submit a request to validation your blockchain identity (BTC wallet address)

The validation window is 300 seconds, which is the time allotted to complete the next step,
submitting a request to validate a message signature.

#### POST http://localhost:8000/requestValidation

### Validate Message signature

2. Using your wallet (Electrum was used for this project) sign the message returned from the
validation request and submit another request to validate the message signature.

The validation window is 1800 seconds (30 min) for the next step to be completed, registering
a Star on the blockchain.

#### POST http://localhost:8000/message-signature/validate

### Register Star

3. Submit the request to register the Star. The Star data includes it's positioning (dec, ra, mag, cen) and the story of how
the Star was discovered. The mag (Magnitude) and cen (Centaurs) data is optional.

#### POST http://localhost:8000/block


## API Endpoints

### POST http://localhost:8000/requestValidation

Request to validate blockchain Identity

Request JSON:
```
	{
		"address": "{wallet address}"
	}
```

Response JSON:
```
	{
		"walletAddress": "{wallet address}",
		"requestTimeStamp": "{timestamp}",
		"message": "{wallet address}:{timestamp}:starRegistry",
		"validationWindow": 300
	}
```

CURL Request example:
```
	curl -X POST http://localhost:8000/requestValidation \
		-H 'Content-Type: application/json' \
		-H 'cache-control: no-cache' \
		-d '{
			"address": "15QnUjixn9S9z708gXe7igCfVCYpL0NavX"
			}'
```

Response:
```
{
    "walletAddress": "15QnUjixn9S9z708gXe7igCfVCYpL0NavX",
    "requestTimeStamp": "1542591617",
    "message": "15QnUjixn9S9z708gXe7igCfVCYpL0NavX:1542591617:starRegistry",
    "validationWindow": 300
}
```

### POST http://localhost:8000/message-signature/validate

Request to validate the wallet address with a message signature

Request JSON:

```
	{
		"address": "{wallet address}",
		"signature": "{message signature}"
	}
```

Response JSON:
```
	{
		"registerStar": {true|false},
		"status": {
			"address": "{wallet address}",
			"requestTimeStamp": "{timestamp}",
			"message": "{wallet address}:{timestamp}:starRegistry",
			"validationWindow": 1800,
			"messageSignature": "{valid|invalid}"
		}
	}
```

CURL Request example:
```
	curl -X POST http://localhost:8000/message-signature/validation \
		-H 'Content-Type: application/json' \
		-H 'cache-control: no-cache' \
		-d '{
				"address": "15QnUjixn9S9z708gXe7igCfVCYpL0NavX",
				"signature": "HzRbv4u1IxTn/z63i2OqOQvvICZExPU7WYwxpYELoFK0YJT5C0ClZH3+Mm/5WyDNSj6kIxEJl6glS07SVkrmMJs="
			}'
```

Response JSON:
```
{
    "registerStar": true,
    "status": {
        "address": "15QnUjixn9S9z708gXe7igCfVCYpL0NavX",
        "requestTimeStamp": "1542591731",
        "message": "15QnUjixn9S9z708gXe7igCfVCYpL0NavX:1542591617:starRegistry",
        "validationWindow": 1800,
        "messageSignature": "valid"
    }
}
```

### POST http://localhost:8000/block

Register and notarize a Star on the blockchain, after validation with message signature

** The Star story format is ASCII only and is limited to 500 characters. If either of these
conditions are violated, the service returns an HTTP Bad Request response with a message
indicating the error.

Request:
```
	{
		"address": "{wallet address}",
		"star": {
			"dec": "{dec}",
			"ra": "{ra}",
			"mag": "{mag}",
			"cen": "{cen}",
			"story": "{story of the Star discovery}"
		}
	}
```

Response:
```
	{
		"hash": "{block hash value}",
		"height": {block height},
		"body": {
			"address": "{wallet address}",
			"star": {
				"dec": "{dec}",
				"ra": "{ra}",
				"mag": "{mag}",
				"cen": "{cen}",
				"story": "{story}"
			}
		},
		"time": "{timestamp}",
		"previousBlockHash": "{previous block hash value}"
	}
```

CURL Request example:
```
	curl -X "POST" "http://localhost:8000/block" \
		-H 'Content-Type: application/json; charset=utf-8' \
		-d $'{
			"address": "142BDCeSGbXjWKaAnYXbMpZ6sbrSAo3DpZ",
			"star": {
				"dec": "-26 29' 24.9",
				"ra": "16h 29m 1.0s",
				"story": "This one is in the Nebula galaxy, next to the Hapi black hole and Capricorn constellation"
			}
		}'
```

Response JSON:
```
{
    "body": {
        "address": "142BDCeSGbXjWKaAnYXbMpZ6sbrSAo3DpZ",
        "star": {
            "dec": "16h 29m 1.0s",
            "ra": "-26 29' 24.9",
            "story": "54686973206f6e6520697320696e20746865204e6562756c612067616c6178792c206e65787420746f20746865204861706920626c61636b20686f6c6520616e64204361707269636f726e20636f6e7374656c6c6174696f6e",
            "decodedStory": "This one is in the Nebula galaxy, next to the Hapi black hole and Capricorn constellation"
        }
    },
    "hash": "26a9bbe95744c09c6e91171f7a71c8fe0dbb11557ee7cc26f488d929f859a398",
    "height": 3,
    "time": "1542592689",
    "previousBlockHash": "c05af487c94fa9836de4d2753ae923ab6d02e5b72a9cd6f49253cbe780b88b0c"
}
```


### GET http://localhost:8000/block/{index}

Get a Star block by index

CURL Request example:
```
curl -X GET http://localhost:8000/block/0
```

Response:
```
{
    "body": {
        "address": "0",
        "star": {
            "dec": "9h 56m 1.0s",
            "ra": "69 deg 29m 24.9s",
            "story": "737461722d72656769737472792d6e6f746172792d7365727669636520556461636974792050726f6a656374202d2047656e6573697320626c6f636b20535441523a20466f756e642077697468207777772e676f6f676c652e636f6d2f736b7920284669726562616c6c2047616c61787929",
            "decodedStory": "star-registry-notary-service Udacity Project - Genesis block STAR: Found with www.google.com/sky (Fireball Galaxy)"
        }
    },
    "hash": "e12fa037d209b1eef5bf1109c903b22292521ec4fbec936f33e4762d0f9fd060",
    "height": 0,
    "time": "1542584254",
    "previousBlockHash": ""
}
```

### GET http://localhost:8000/stars/address:{wallet address}

Get one or more Star blocks that match the wallet address

CURL Request example:
```
curl -X GET http://localhost:8000/stars/address:15QnUjixn9S9z708gXe7igCfVCYpL0NavX
```

Response:
```
[
    {
        "body": {
            "address": "15QnUjixn9S9z708gXe7igCfVCYpL0NavX",
            "star": {
                "dec": "2",
                "ra": "1",
                "story": "48656c6c6f20576f726c6420233121",
                "decodedStory": "Hello World #1!"
            }
        },
        "hash": "0eb6bd2cf24a6b0c3b1920f958c199259c9ae203f3552c94453cb9cd2274794b",
        "height": 1,
        "time": "1542584433",
        "previousBlockHash": "e12fa037d209b1eef5bf1109c903b22292521ec4fbec936f33e4762d0f9fd060"
    },
    {
        "body": {
            "address": "15QnUjixn9S9z708gXe7igCfVCYpL0NavX",
            "star": {
                "dec": "2",
                "ra": "1",
                "story": "48656c6c6f20576f726c6420233221",
                "decodedStory": "Hello World #2!"
            }
        },
        "hash": "c05af487c94fa9836de4d2753ae923ab6d02e5b72a9cd6f49253cbe780b88b0c",
        "height": 2,
        "time": "1542584561",
        "previousBlockHash": "0eb6bd2cf24a6b0c3b1920f958c199259c9ae203f3552c94453cb9cd2274794b"
    }
]
```

### GET http://localhost:8000/stars/hash:{block hash value}

Get a Star whose hash value matches the request

CURL Request example:
```
curl -X GET http://localhost:8000/stars/hash:c05af487c94fa9836de4d2753ae923ab6d02e5b72a9cd6f49253cbe780b88b0c
```

Response:
```
{
    "body": {
        "address": "15QnUjixn9S9z708gXe7igCfVCYpL0NavX",
        "star": {
            "dec": "2",
            "ra": "1",
            "story": "48656c6c6f20576f726c6420233221",
            "decodedStory": "Hello World #2!"
        }
    },
    "hash": "c05af487c94fa9836de4d2753ae923ab6d02e5b72a9cd6f49253cbe780b88b0c",
    "height": 2,
    "time": "1542584561",
    "previousBlockHash": "0eb6bd2cf24a6b0c3b1920f958c199259c9ae203f3552c94453cb9cd2274794b"
}
```

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
