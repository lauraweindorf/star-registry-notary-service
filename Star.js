
/* ===== STAR  Class ================= */

class Star
{
	constructor(dec, ra, mag, cen, story)
	{
		this.dec = (dec ? dec : '')
		this.ra = (ra ? ra : '')
		this.mag = (mag ? mag : '')
		this.cen = (cen ? cen : '')
		this.story = (story ? story: '')
	}
}

module.exports = Star
