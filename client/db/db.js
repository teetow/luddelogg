var pageSize = 10;
Template.db.onCreated(function() {
    var instance = this;
    this.eventFetchLimit = new ReactiveVar(pageSize);
    this.autorun(function() {
        instance.subscribe("sheetDataCount", function() {});
        instance.subscribe("dbEventLog", instance.eventFetchLimit.get(), function() {});
    });
});
Template.dbOps.events({
    'click .button-syncnow': function() {
        Meteor.call("dbGetData");
    },
    'click .button-clear': function() {
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
Template.dbInfo.helpers({
    numSheetRows: function() {
        return Counts.get("sheetData");
    },
    numEventRows: function() {
        return EventLog.find().count();
    },
});
