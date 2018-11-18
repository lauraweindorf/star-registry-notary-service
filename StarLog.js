
/**
 * StarLog - Convenience method for logging app messages
 *
 * @param {string} logMessage
 */
function StarLog(logMessage)
{
	console.log(`${new Date().toString()}: ${logMessage}`)
}

module.exports = StarLog
