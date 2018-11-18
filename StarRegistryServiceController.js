/*
 * StarRegistryServiceController
 *
 * 	Backend controller for the Star Notary Registration Service, with implementations for API endpoints
 */

/* ===== DECODE with hex2ascii =============================== */

const hex2ascii = require('hex2ascii')

/* ===== SHA256 with Crypto-js ===============================
|  Learn more: Crypto-js: https://github.com/brix/crypto-js  |
|  =========================================================*/

const SHA256 = require('crypto-js/sha256')

/* ===== Configure to use LevelDB as the data access layer  ================= */

const level = require('level')
const starRegistryStore = './star-registry'				// Name of STAR Registry datastore
const starRegistry = level(starRegistryStore)			// LevelDB reference to STAR Registry blockchain

/* ===== Configure to use Star block and memory pool manager ===== */

const Star = require('./Star.js')																// the STAR
const StarRegistryBlock = require('./StarRegistryBlock.js')			// the STAR Registry block
const StarMemPoolManager = require('./StarMemPoolManager.js')		// Manager for the STAR validation requests using mem pool

/* ===== Configure HTTP error responses and service logging ===== */
const boom = require('Boom')
const StarLog = require('./StarLog.js')

/* ===== Gensesis STAR block ===== */

const GENESIS_STORY = 'star-registry-notary-service Udacity Project - ' +
			'Genesis block STAR: Found with www.google.com/sky (Fireball Galaxy)'

/**
 * Controller Definition to encapsulate routes to work with STAR Notary Registration Service
 */
class StarRegistryServiceController
{
	/**
	 * Constructor - initialize endpoints and create Genesis STAR Registry block
	 * @param {*} server
	 */
	 constructor(server)
	 {
		 this.server = server

		 this.ensureGenesisBlock()

		 // API endpoints
		 this.requestValidation()						// Post request for validation window using Blockchain Identity
		 this.validateMessageSignature()		// Post message and signature for verification
		 this.postStarBlock()								// Post a new Star block to the registry
		 this.getStarBlock()								// Get Star block by block height
		 this.getStarBlockByHash()					// Get Star block by hash value
		 this.getStarBlockByAddress()				// Get Star block by wallet address value
	 }

	 // Adds the genesis block if it doesn't already exist
	 async ensureGenesisBlock()
	 {
		 try {
			 let blockHeight = await this.getBlockHeight()
			 if (blockHeight === -1) {
				 // Create the genesis block
				 let star = new Star('69 deg 29m 24.9s', '9h 56m 1.0s', GENESIS_STORY)
				 var genesis = new StarRegistryBlock('0', star)
				 genesis.hash = SHA256(JSON.stringify(genesis)).toString()

				 await this.putBlock(0, genesis)
				 blockHeight++

				 StarLog(`[GENESIS] STAR Registry Block created - ${genesis.toString()}`)
			 } else {
				 StarLog(`BlockHeight = ${blockHeight}`)
			 }

			 return blockHeight

		 } catch (err) {
			 StarLog(`[GENESIS] Fatal error. Can't add genesis block to STAR Registry blockchain: ${err.message}`)
			 return boom.badImplementation()
		 }
	 }

 /**
  * requestValidation - Implements a POST Endpoint to add a validation request of user's Blockchain Identity
  *
  * url: "/requestValidation"
  *
  * POST format: { "address": "wallet address" }
  *
  * @return {json} message
  * 	message format: [walletAddress]:[timestamp]:starRegistry
  */
	requestValidation()
	{
		this.server.route({
			method: 'POST',
			path: '/requestValidation',
			handler: async (request, reply) => {
				try {
					if (request.payload === undefined || request.payload.address === undefined) {
						return boom.badRequest(`Invalid request: ${request.payload}`)
					}

					let walletAddress = request.payload.address.trim()
					if (walletAddress.length === 0) {
						return boom.badRequest('Invalid wallet address')
					}

					return await StarMemPoolManager.addValidationRequest(walletAddress)

				} catch(err) {
					return boom.badImplementation(`${err.message}`)
				}
			}
		})
	}

	/**
   * validateMessageSignature - Implements a POST Endpoint to verify the message signature for the
   * 	memPool validation request previously submitted.
   *
   * url: "/message-signature/validate"
   *
   * POST format: { "address": "signature" }
   *
   * @return {json} message
   * 	message format: [walletAddress]:[timestamp]:starRegistry
   */
	validateMessageSignature()
	{
		this.server.route({
			method: 'POST',
			path: '/message-signature/validate',
			handler: async (request, reply) => {
				try {
					if (request.payload === undefined || request.payload.address === undefined || request.payload.signature === undefined) {
						return boom.badRequest(`Invalid request: ${request.payload}`)
					}

					// check if wallet address is empty
					let walletAddress = request.payload.address.trim()
					if (walletAddress.length === 0) {
						return boom.badRequest('Invalid wallet address')
					}

					// check if message signature is empty
					let messageSignature = request.payload.signature.trim()
					if (messageSignature.length === 0) {
						return boom.badRequest('Invalid message signature')
					}

					// Process request to verify message signature
					// user has 'validationWindow' seconds to sign the message and submit star registration request
					// The validation window is set and managed by the StarMemPoolManager

					let signatureVerificationResponse = await StarMemPoolManager.verifyMessageSignature(walletAddress, messageSignature)
					return signatureVerificationResponse

				} catch (err) {
					return boom.badRequest(`${err.message}`)
				}
			}
		})
	}

	/**
	 * Implement a GET Endpoint to retrieve a star block by index, url: "/block/:index"
	 */
	 getStarBlock()
   {
			this.server.route({
				method: 'GET',
				path: '/block/{index}',
				handler: async (request, reply) => {
					try {
						let block = await this.getBlock(request.params.index)

						let blockResponse = block
						blockResponse.body.star.decodedStory = hex2ascii(block.body.star.story)

						return blockResponse
					} catch (err) {
						return boom.badRequest(`Invalid STAR block index: ${request.params.index}`)
					}
				}
			})
   }

	 /**
		* Implement a GET Endpoint to retrieve a star block by hash value, url: "/block/stars/hash:"
		*/
		getStarBlockByHash()
		 {
			 this.server.route({
				 method: 'GET',
				 path: '/stars/hash:{hash}',
				 handler: async (request, reply) => {
					 try {
						 let block = await this.getBlockByHash(request.params.hash)
						 if (block === null) {
							 throw new Error(`STAR block not found using hash value: ${request.params.hash}`)
						 }

						 let blockResponse = block
						 blockResponse.body.star.decodedStory = hex2ascii(block.body.star.story)

						 return blockResponse

					 } catch (err) {
						 return boom.badImplementation(err.message)
					 }
				 }
			 })
		 }

	/**
	 * Implement a GET Endpoint to retrieve a star block by wallet address, url: "/block/stars/address:"
	 */
	 getStarBlockByAddress()
	 {
	 	this.server.route({
	 		method: 'GET',
	 		path: '/stars/address:{address}',
	 		handler: async (request, reply) => {
	 			try {
					let blocks = await this.getBlockByAddress(request.params.address)
					let blockResponses = []

					for (let i = 0; i < blocks.length; i++) {
						let blockResponse = blocks[i]
		 				blockResponse.body.star.decodedStory = hex2ascii(blocks[i].body.star.story)
						blockResponses.push(blockResponse)
					}

	 				return blockResponses

	 			} catch (err) {
	 				return boom.badImplementation(err.message)
	 			}
	 		}
	 	})
	 }

	/**
	 * postStarBlock - Implements a POST Endpoint to add a STAR block to the blockchain.
	 *
	 * url: "/block"
	 *
	 * POST format: { "address": "{walletAddress}",
	 * 								"star": {
	 * 									"dec": "{dec}",
	 * 									"ra": "{ra}",
	 * 									"story": "{story}"
	 * 								}
	 * 							}
	 *
	 * @return {json} star block
	 */
    postStarBlock()
    {
			this.server.route({
				method: 'POST',
				path: '/block',
				handler: async (request, reply) => {

					if (request.payload === undefined || request.payload.address === undefined || request.payload.star === undefined) {
						return boom.badRequest(`Invalid request payload: ${request.payload}`)
					}

					let walletAddress = request.payload.address
					let star = request.payload.star
					if (walletAddress.length === 0 || star.dec.length === 0 || star.ra.length === 0 || star.story.length === 0) {
						return boom.badRequest('Invalid block request: missing data')		// 400
					}

					try {
						let starValidationRequest = await StarMemPoolManager.getValidatedStarRequest(walletAddress)
						if (starValidationRequest === 'invalid') {
							throw new Error('Star validation request is not valid')
						}

						let block = new StarRegistryBlock(walletAddress, star)
						let blockResponse = await this.addBlock(block)

						StarLog(`[NEW] STAR Block created:\n${blockResponse.toString()}`)

						// remove validated star request from memPool
						await StarMemPoolManager.removeValidatedStarRequest(walletAddress)

						return blockResponse

					} catch (err) {
							return boom.badRequest(err.message)
					}
				}
			})
    }

    // Appends a block to the blockchain
    async addBlock(block)
    {
      try {
        // Make sure GENESIS block gets added
        let blockHeight = await this.ensureGenesisBlock()
        let latestBlock = await this.getBlock(blockHeight)

        block.height = blockHeight + 1
        block.previousBlockHash = latestBlock.hash
        block.hash = SHA256(JSON.stringify(block)).toString()

        // Persisting block object to levelDB
        await this.putBlock(block.height, block)

				let blockResponse = block
				blockResponse.body.star.decodedStory = hex2ascii(block.body.star.story)

				return blockResponse

      } catch (err) {
        throw new Error(`unable to add new block: ${err.message}`)
      }
    }

    //
    // LevelDB Data Access layer
    //

    // Get current block height of blockchain
    getBlockHeight()
    {
      return new Promise((resolve, reject) => {
    		let blockHeight = -1
    		starRegistry.createKeyStream()
    				.on('data', (data) => {
    					blockHeight++
    				}).on('error', (err) => {
    					reject(`getBlockHeight: ${err.message}`)
    				}).on('close', () => {
              resolve(blockHeight)
    				})
    	})
    }

    // Get block at blockHeight value
    getBlock(height)
    {
      return new Promise((resolve, reject) => {
    		starRegistry.get(height)
    			.then((blockValue) => {
    				resolve(JSON.parse(blockValue))
    			}).catch((errmsg) => {
    				reject(`getBlock: ${errmsg}`)
    			})
    		})
    }

		// Get block by hash from blockchain
    getBlockByHash(hash)
    {
			let block = null
      return new Promise((resolve, reject) => {
    		starRegistry.createReadStream()
    				.on('data', (data) => {
							let blockValue = JSON.parse(data.value)
    					if (blockValue.hash === hash) {
								block = blockValue
							}
    				}).on('error', (err) => {
    					reject(`getBlockByHash: ${err.message}`)
    				}).on('close', () => {
              resolve(block)
    				})
    	})
    }

		// Get block by wallet address from blockchain
    getBlockByAddress(address)
    {
			let blocks = []
      return new Promise((resolve, reject) => {
    		starRegistry.createReadStream()
    				.on('data', (data) => {
							let blockValue = JSON.parse(data.value)
    					if (blockValue.body.address === address) {
								blocks.push(blockValue)
							}
    				}).on('error', (err) => {
    					reject(`getBlockByAddress: ${err.message}`)
    				}).on('close', () => {
              resolve(blocks)
    				})
    	})
    }

    // Put block data
    putBlock(blockHeight, block)
    {
      let blockValue = JSON.stringify(block)

      return new Promise((resolve, reject) => {
        starRegistry.put(blockHeight, blockValue)
          .then(() => {
            resolve()
          })
          .catch((errmsg) => {
            reject(`putBlock: ${errmsg}`)
          })
      })
    }
}

/**
 * Exporting the StarRegistryServiceController class
 * @param {*} server
 */
module.exports = (server) => { return new StarRegistryServiceController(server) }
