var pageSize = 10;
Template.db.onCreated(function() {
    var instance = this;
    instance.errorMessage = new ReactiveVar();
    this.eventFetchLimit = new ReactiveVar(pageSize);
    this.autorun(function() {
        instance.subscribe("sheetDataCount", function() {});
        instance.subscribe("eventLogCount");
        instance.subscribe("dbEventLog", instance.eventFetchLimit.get(), function() {});
    });
});
Template.db.helpers({
    numSheetRows: function() {
        return Counts.get("sheetData");
    },
    numEventRows: function() {
        return Counts.get("eventLog");
    },
    numEventRowsShown: function() {
        return EventLog.find().count();
    },
    errorMessage: function() {
        return Template.instance().errorMessage.get();
    }
});
Template.db.events({
    'click .js-syncnow': function(event, instance) {
        Meteor.call("dbGetData", function(err, data) {
            if (err) {
                instance.errorMessage.set(err.reason);
                Meteor.setTimeout(function() {
                    instance.errorMessage.set(undefined);
                }, 2000);
            }
        });
    },
    'click .js-clear': function(event, instance) {
        Meteor.call("dbClearData");
    },
});
Template.dbLog.helpers({
    dbLogEntries: function() {
        return EventLog.find({});
    },
});
Template.dbLogEntry.helpers({
    prettyDate: function(date) {
        if (!date) return "";
        return moment(date).format("YYYY-MM-DD HH:mm:ss");
    }
});
