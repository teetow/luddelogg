Meteor.publish("dbMessageLog", function() {
	return MessageLog.find();
});
Meteor.methods({
	addMessage: function(message) {
		AddMessage(message, "addMessage Meteor method");
	},
	clearMessages: function() {
		MessageLog.remove({});
	},
});
AddMessage = function(message, origin) {
	let timestamp = new Date();
	console.log(`${origin}: ${message}`);
	MessageLog.insert({
		message: message,
		timestamp: timestamp,
		origin: origin
	});
	PurgeOldMessages();
}
ClearMessages = function() {
	MessageLog.remove({});
}
PurgeOldMessages = function() {
	var cutoffDate = moment();
	cutoffDate.subtract(10, "minutes");
	var oldMessages = MessageLog.find({
		timestamp: {
			$lte: cutoffDate.toDate()
		}
	}).fetch();
	var oldMsgIds = _.pluck(oldMessages, "_id");
	MessageLog.remove({
		_id: {
			$in: oldMsgIds
		}
	});
}
