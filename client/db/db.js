Template.db.onCreated(function() {
    this.subscribe("dbEventLog");
});
Template.dbOps.events({
    'click .button-syncnow': function() {
        Meteor.call("dbGetData");
    },
    'click .button-reinit': function() {
        Meteor.call("dbClearData");
        Meteor.call("dbLoadSheet", function() {
            Meteor.call("dbGetData");
        });
    },
});
Template.dbLog.helpers({
    dbLogEntries: function() {
        return EventLog.find({}, {
            sort: {
                timestamp: -1
            }
        });
    },
});
