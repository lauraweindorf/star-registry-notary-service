const Hapi = require('hapi')

/**
 * Class Definition for the Star Notary RESTful Service API
 */
class StarRegistryNotaryService
{
	/**
	 * Constructor that allows initialize the class
	 */
	 constructor()
	 {
		 this.server = Hapi.Server({
			 port: 8000,
			 host: 'localhost'
		 })
		 this.initControllers()
		 this.start()
	 }

	 /**
		* Initilization of all the controllers
		*/
		initControllers()
		{
			require("./StarRegistryServiceController.js")(this.server)
		}

		/*
		 * Starts the Star Registry Notary Service (Hapi Server)
		 */
    async start()
		{
			await this.server.start()
			console.log(`Star Registry Notary Service running at: ${this.server.info.uri}`)
    }
}

new StarRegistryNotaryService()
