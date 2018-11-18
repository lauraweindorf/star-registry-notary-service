
/* ===== STAR  Class ================= */

class Star
{
	constructor(dec, ra, story)
  {
     this.dec = (dec ? dec : '')
		 this.ra = (ra ? ra : '')
		 this.story = (story ? story: '')
  }
}

module.exports = Star
