# Udacity Project: Private Blockchain Notary Service (STAR Registry)

Implements a private Star blockchain API with the endpoints below. The Star Notary Service allows users to register a star on a private blockchain wallet address validation.

The blockchain is initially populated with the Genesis STAR block on startup.

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

#### CURL Examples

Get Block 0 (Genesis STAR block)

```
curl "http://localhost:8000/block/0"
```

Add Block

```
curl -X "POST" "http://localhost:8000/block" -H "Content-Type: application/json" -d "{\"body\":\"block-1\"}"
```

### API Endpoints

#### GET http://localhost:8000/block/{index}

```
	GET http://localhost:8000/block/0
```

Response:
```
{
    "hash": "bb7462ac16bcea65133e86999c131b86eaae45b04d35735f4bef73cfa8b2b7d7",
    "height": 0,
    "body": "First block in the chain - Genesis block",
    "time": "1540060639",
    "previousBlockHash": ""
}
```

#### POST http://localhost:8000/block

```
{
  "body": "Hello World!"
}
```

#### POST response

```
{
    "hash": "92bb55379b998e13aa6f3e0cf18770936a0e135183e470064fb16086fc235bab",
    "height": 1,
    "body": "Hello World!",
    "time": "1540060672",
    "previousBlockHash": "bb7462ac16bcea65133e86999c131b86eaae45b04d35735f4bef73cfa8b2b7d7"
}
```

## Built With

* [HapiJs](https://hapijs.com) - The Node.js framework used

## Packages used

* hapi
* crypto-js/sha256
* Boom

## License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details

## Acknowledgments

* Adapted from Jose Perera Morales' Udacity project: https://github.com/udacity/nd1309-rest-api-hapi
