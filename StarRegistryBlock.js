
const Star = require('./Star.js')						// Star class

/* ===== STAR Registry Block Class ================= */

class StarRegistryBlock
{
  constructor(walletAddress, star)
  {
		let encodedStar = new Star(star.ra, star.dec, Buffer(star.story).toString('hex'))

		this.body = { address: walletAddress, star: encodedStar}
		this.hash = ''
		this.height = 0
		this.time = new Date().getTime().toString().slice(0,-3)
		this.previousBlockHash = ''
  }

  toString()
  {
     return `block.height = ${this.height}\n` +
      `block.body.address = ${this.body.address}\n` +
			`block.body.star = ${JSON.stringify(this.body.star).toString()}\n` +
      `block.hash = ${this.hash}\n` +
      `block.time = ${this.time}\n` +
      `block.previousBlockHash = ${this.previousBlockHash}\n`
  }
}

module.exports = StarRegistryBlock
