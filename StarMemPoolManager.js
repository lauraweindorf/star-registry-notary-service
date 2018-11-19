/*
 * StarMemPoolManager
 * 	Implementation of the MemPool (as Singleton) and the MemPool manager that handles
 * 	adding, getting, removing and verifying requests to register a Star using the
 * 	user's Blockchain Identify.
 */

/*
 * Implementation of a mem pool to store STAR registration requests prior to adding to the Star Blockchain
 */

/* ===== Configure to use Level/mem as the memPool  ================= */

const levelMem = require('level-mem')
const mem = levelMem()

/* ===== Configure for bitcoin message verification  ================= */

const bitcoinMessage = require('bitcoinjs-message')

/* ===== Configure simple logging for memPool  ================= */

const StarLog = require('./StarLog.js')			// having a little Star Trek fun ;-)

/* ===== Configure the validation window timeouts for the memPool  ================= */
/*
 * Adapted from Jose Perera Morales' project guide tip on how to handle
 * the calculation of the validation window for both:
 * 		1) validation requests
 * 		2) valid requests waiting to be verified using Blockchain Identity (wallet address)
 */
// validation windows represented in seconds
const TimeoutValidationRequestsWindowTime = 5 * 60				// 5 minutes for validation requests
const TimeoutMessageVerificationWindowTime = 30 * 60	 		// 30 minutes for valid requests to be verified

/*
 * MemPool Singleton
 * Adapted from: https://www.dofactory.com/javascript/singleton-design-pattern
 *
 * Ensures there's only one MemPool object instance used by the StarMemPoolManager
 */
var MemPoolSingleton = (() => {

	// private - create the MemPool instance
	function createInstance() {
		var object = new MemPool()
		return object
	}

	// public - object providing access to singleton
	return {
		getInstance: function() {
			if (!this.instance) {
				this.instance = createInstance()
			}
			return this.instance
		}
	}
})()

/*
 * MemPool Class
 *
 * Uses in-memory store to support operations on the MemPool: push, pop, and get
 */
class MemPool {

 /**
  * push - Push a key/value onto the memPool
  *
  * @param {string} key		wallet address
  * @param {string} value stringified validation request object
  *
  * @return {Promise} resolved, stringified request validation object
  */
	push(key, value)
	{
		return new Promise((resolve, reject) => {
			mem.put(key, value).then(() => { resolve(value) }).catch((errmsg) => { reject(errmsg) })
		})
	}

	/**
   * get - Get value from the memPool
   *
   * @param {string} key		wallet address
   *
   * @return {Promise} resolved, stringified request validation object
   */
	get(key)
	{
		return new Promise((resolve, reject) => {
			mem.get(key).then((value) => { resolve(value) }).catch((errmsg) => { reject(errmsg) })
		})
	}

 /**
  * pop - Removes a validation request from memPool
  *
  * @param {string} key wallet address
  *
  * @return {Promise} resolved key value - wallet address
  */
	pop(key)
	{
		return new Promise((resolve, reject) => {
			mem.del(key).then(() => { resolve(key) }).catch((errmsg) => { reject(errmsg) })
		})
	}
}

/**
 * MemPoolRequest - class with constructor to initialize and encapsulate a memPool request item
 */
class MemPoolRequest
{
 /**
  * constructor class for memory pool request item
  *
  * @param {string} walletAddress Blockchain Identity
  * @param {number} requestWindow Number of milliseconds before request expires
  */
	constructor(walletAddress, requestWindow)
	{
		let timeStamp = new Date().getTime().toString().slice(0, -3)
		this.walletAddress = walletAddress
		this.requestTimeStamp = timeStamp
		this.message = `${walletAddress}:${timeStamp}:starRegistry`
		this.validationWindow = requestWindow
		this.registerStar = false
		this.messageSignature = 'pending'
	}

	// Used to convert memPoolRequest item retrieved from the memPool into it's class instance
	toClass(obj)
	{
		this.walletAddress = obj.walletAddress
		this.requestTimeStamp = obj.requestTimeStamp
		this.message = obj.message
		this.validationWindow = obj.validationWindow
		this.registerStar = obj.registerStar
		this.messageSignature = obj.messageSignature
	}

	// Turn instance data into a descriptive string for logging
	toString()
	{
		return 'walletAddress=' + this.walletAddress +
		', requestTimeStamp=' + this.requestTimeStamp +
		', message=' + this.message +
		', validationWindow=' + this.validationWindow +
		', registerStar=' + this.registerStar +
		', messageSignature=' + this.messageSignature
	}
}

/*
 * ValidationResponse - class that encapsulates the data returned from a
 * 	requestValidation submitted to the memory pool
 */

class ValidationResponse
{
	// Constructor that makes a response from the input memPool request
	constructor(memPoolRequest)
	{
		this.walletAddress = memPoolRequest.walletAddress
		this.requestTimeStamp = memPoolRequest.requestTimeStamp
		this.message = memPoolRequest.message
		// calculate the time left in the validation window
		this.validationWindow = memPoolRequest.validationWindow - ((new Date().getTime().toString().slice(0, -3)) - this.requestTimeStamp)
	}
}

/*
 * StarValidationResponse - class that encapsulates the data returned for a validated request in the memory pool
 */

class StarValidationResponse
{
	// Constructor that makes a response from the input memPool request
	constructor(memPoolRequest)
	{
		let requestTimeStamp = memPoolRequest.requestTimeStamp
		let validationWindow = memPoolRequest.validationWindow

		this.registerStar = memPoolRequest.registerStar

		this.status = {
			address: memPoolRequest.walletAddress,
			requestTimeStamp: memPoolRequest.requestTimeStamp,
			message: memPoolRequest.message,
			// calculate the time left in the validation window
			validationWindow: validationWindow - ((new Date().getTime().toString().slice(0, -3)) - requestTimeStamp),
			messageSignature: memPoolRequest.messageSignature
		}
	}
}

/**
 * StarMemPoolManager - MemPool manager
 *
 * Manages access to MemPool singleton and provides methods to add, get and remove validation requests
 */
class StarMemPoolManager
{

 /**
  * constructor - creates the validation and message verification timeout buckets
  */
	constructor()
	{
		this.timeoutValidationRequests = []
		this.timeoutMessageVerificationRequests = []
	}

 /**
  * addValidationRequest - Add a user's request to validate their Blockchain Identity
  * 	to the memPool, with configured window of time to sign and verify message
  *
  * @param {string} walletAddress     	User's Blockchain Identity
  *
  * @return {Object} memPool request
  *
  * 	Response format (MemPoolRequest):
	* 		{
	* 				"address": "{wallet address}"",
	* 				"requestTimeStamp": "{request timestamp},
	* 				"message": "{wallet address}:{timestamp}:starRegistry",
	* 				"validationWindow": {# of seconds to validate}
	* 		}
  */
	async addValidationRequest(walletAddress)
	{
		let memPool = MemPoolSingleton.getInstance()

		// Check to see if request is already in memPool
		try {
			let memPoolRequest = await this.getMemPoolRequest(walletAddress)
			return new ValidationResponse(memPoolRequest)
		} catch (err) {
			// Add the validation request
			try {
				let memPoolRequest = new MemPoolRequest(walletAddress, TimeoutValidationRequestsWindowTime)
				StarLog(`NEW memPoolRequest: ${memPoolRequest.toString()}`)

				await memPool.push(walletAddress, JSON.stringify(memPoolRequest))

				// Set a timeout for the validation window, when the request expires
				// If the request expires, delete it from the mempool
				this.timeoutValidationRequests[walletAddress] = setTimeout(() => {
					this.removeMemPoolRequest(walletAddress)
					// remove the timeout
					delete this.timeoutValidationRequests[walletAddress]
					StarLog(`[EXPIRED] ${walletAddress}, ${memPoolRequest.message}`)
				}, (memPoolRequest.validationWindow * 1000))		// convert to milliseconds

				return new ValidationResponse(memPoolRequest)

			} catch (err) {
				throw new Error(`addValidationRequest: ${err.message}`)
			}
		}
	}

	/**
	 * verifyMessageSignature - Get 'pending' validation request from memPool and verify message signature
	 *
	 * @param {string} walletAddress
	 * @param {string} messageSignature
	 *
	 * @return {Object} starValidationResponse
	 *
	 * 		Response format:
	 * 		{
	 * 			"registerStar": true/false,
	 * 			"status": {
	 * 				"address": "{wallet address}"",
	 * 				"requestTimeStamp": "{request timestamp},
	 * 				"message": "{wallet address}:{timestamp}:starRegistry",
	 * 				"validationWindow": {time left in seconds},
	 * 				"messageSignature": "{valid|invalid}"
	 * 			}
	 * 		}
	 */
	async verifyMessageSignature(walletAddress, messageSignature)
	{
		let memPool = MemPoolSingleton.getInstance()
		let memPoolRequest = {}

		try {
			memPoolRequest = await this.getMemPoolRequest(walletAddress)

			if (memPoolRequest.messageSignature === 'valid') {
				return new StarValidationResponse(memPoolRequest)
			}

			// Will throw error if message signature can't be verified
			let verified = bitcoinMessage.verify(memPoolRequest.message, walletAddress, messageSignature)
			if (!verified) {
				throw new Error(`[ERROR] wrong signature for address:${walletAddress}, message:${messageSignature}`)
			}

			// remove the timeout
			clearTimeout(this.timeoutValidationRequests[walletAddress])
			delete this.timeoutValidationRequests[walletAddress]

			memPoolRequest.registerStar = true
			memPoolRequest.messageSignature = 'valid'
			memPoolRequest.requestTimeStamp = new Date().getTime().toString().slice(0, -3)
			memPoolRequest.validationWindow = TimeoutMessageVerificationWindowTime

			StarLog(`[VERIFIED] Star Registry message/signature validated = ${walletAddress}`)
			StarLog(`memPoolRequest: ${memPoolRequest.toString()}`)

			// add to timeout requests for message verification - waiting for Star Registration
			// with new larger validation window
			this.timeoutMessageVerificationRequests[walletAddress] = setTimeout(() => {
				this.removeMemPoolRequest(walletAddress)
				delete this.timeoutMessageVerificationRequests[walletAddress]
				StarLog(`[EXPIRED] Star Registry validation request = ${walletAddress}`)
			}, (memPoolRequest.validationWindow * 1000))			// Convert to milliseconds

		} catch (err) {
			if (Object.keys(memPoolRequest).length === 0)
			{
				// Request not found, must be invalid or expired
				throw new Error(err.message)
			} else {
				StarLog(err.message)
			}
			// Unable to verify message signature
			memPoolRequest.messageSignature = 'invalid'
		}

		// update memPool item status:
		// 	1) message signature as 'valid' with new validation window for Star Registration
		// OR
		//	2) message signature as 'invalid' and let validation window keep ticking down
		await memPool.push(walletAddress, JSON.stringify(memPoolRequest))

		return new StarValidationResponse(memPoolRequest)
	}

	/**
	 * getValidatedStarRequest - Get STAR validation request
	 *
	 * @param {string} walletAddress
	 *
	 * @return {Object} starValidationResponse
	 *
	 * 		Response format:
	 * 		{
	 * 			"registerStar": true/false,
	 * 			"status": {
	 * 				"address": "{wallet address}"",
	 * 				"requestTimeStamp": "{request timestamp},
	 * 				"message": "{wallet address}:{timestamp}:starRegistry",
	 * 				"validationWindow": {time left in seconds},
	 * 				"messageSignature": "{valid|invalid}"
	 * 			}
	 * 		}
	 */
	async getValidatedStarRequest(walletAddress)
	{
		try {
			let memPoolRequest = await this.getMemPoolRequest(walletAddress)
			if (memPoolRequest.registerStar && memPoolRequest.messageSignature === 'valid') {
				return new StarValidationResponse(memPoolRequest)
			} else {
				throw new Error('request has not been validated')
			}
		} catch (err) {
			throw new Error(`getValidatedStarRequest (walletAddress = ${walletAddress}) error: ${err.message}`)
		}
	}

 /**
  * removeValidatedStarRequest - Removes a message-signature/validate request
  * 	from the memPool, and clears the timeout on the request.
  *
  * This is only called after a valid Star block has been added to the blockchain
  *
  * @param {string} walletAddress
  *
  */
	async removeValidatedStarRequest(walletAddress)
	{
		try {
			await this.removeMemPoolRequest(walletAddress)
			// remove the timeout
			clearTimeout(this.timeoutMessageVerificationRequests[walletAddress])
			delete this.timeoutMessageVerificationRequests[walletAddress]

			StarLog(`Message verification request for address: ${walletAddress}, removed from mempool`)
		} catch (err) {
			throw new Error(`removeValidatedStarRequest (walletAddress = ${walletAddress}) error: ${err.message}`)
		}
	}

 /**
  * getMemPoolRequest - Get request from memPool
  *
  * @param {string} walletAddress
  *
  * @return {Object} memPoolRequest - empty if it's not in the memPool
  */
	async getMemPoolRequest(walletAddress)
	{
		let memPool = MemPoolSingleton.getInstance()

		try {
			let memPoolItem = JSON.parse(await memPool.get(walletAddress))
			let memPoolRequest = new MemPoolRequest(walletAddress)
			memPoolRequest.toClass(memPoolItem)
			return memPoolRequest
		} catch (err) {
			 throw new Error(`getMemPoolRequest: ${err.message}`)
		}
	}

 /**
  * removeMemPoolRequest - Remove a validation/verificationRequest request from the memPool
  *
  * @param {string} walletAddress
  */
	async removeMemPoolRequest(walletAddress)
	{
		let memPool = MemPoolSingleton.getInstance()

		try {
			await memPool.pop(walletAddress)
		} catch (err) {
			throw new Error(`removeMemPoolRequest error: ${err.message}`)
		}
	}
}

module.exports = new StarMemPoolManager()
