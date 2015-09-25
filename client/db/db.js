Template.db.onCreated(function() {
    var instance = this;
    this.autorun(function() {
        instance.subscribe("sheetDataCount", function() {});
        instance.subscribe("eventLogCount");
        instance.subscribe("dbMessageLog");
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
    messages: function() {
        return MessageLog.find({}, {
            sort: {
                timestamp: 1
            }
        });
    },
    hasMessages: function() {
        return MessageLog.find().count() > 0;
    },
});
Template.db.events({
    'click .js-syncnow': function(event, instance) {
        Meteor.call("dbGetData");
    },
    'click .js-clear': function(event, instance) {
        Meteor.call("dbClearData");
    },
    "click .js-clearmessages": function(event, instance) {
        Meteor.call("clearMessages");
    },
});
Template.messageLogEntry.onRendered(function() {
    var messageBox = $(".db-messages");
    messageBox.scrollTop(messageBox.prop("scrollHeight"));
});
Template.messageLogEntry.helpers({
    errorMessage: function() {
        return this.message;
    }
});
Template.dbLog.onCreated(function() {
    var instance = this;
    instance.pageSize = 10;
    instance.eventFetchPage = new ReactiveVar(1);
    instance.eventFetchLimit = function() {
        return instance.eventFetchPage.get() * instance.pageSize;
    };
    instance.autorun(function() {
        instance.subscribe("dbEventLog", instance.eventFetchLimit(), function() {});
    });
});
Template.dbLog.helpers({
    dbLogEntries: function() {
        return EventLog.find({}, {
            sort: {
                id: -1
            }
        });
    },
});
Template.dbLog.events({
    "click .js-eventloadmore": function(event, instance) {
        instance.eventFetchPage.set(instance.eventFetchPage.get() + 1);
    },
    "click .js-eventloadall": function(event, instance) {
        instance.eventFetchPage.set(0);
    },
});
