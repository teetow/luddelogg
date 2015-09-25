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
	MessageLog.insert({
		message: message,
		timestamp: new Date().toISOString(),
		origin: origin
	})
}
ClearMessages = function() {
	MessageLog.remove({});
}
