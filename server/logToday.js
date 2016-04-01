import moment from "moment";

let now = new ReactiveVar();
Meteor.setInterval(function() {
	now.set(moment().toDate());
}, 60000);
Meteor.publish("logToday", function() {
	this.autorun(function(computation) {
		return getToday(EventLog, now.get());
	});
});
