Template.db.onCreated(function() {
    var instance = this;
    this.autorun(function() {
        instance.subscribe("dbMessageLog");
    });
});
Template.db.helpers({
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
// dbLog ----------------------------
Template.dbLog.onCreated(function() {
    var instance = this;
    instance.subscribe("eventLogCount");
    instance.pageSize = 10;
    instance.eventsFetched = new ReactiveVar(0);
    instance.eventFetchLimit = new ReactiveVar(instance.pageSize);
    instance.events = function() {
        return EventLog.find({}, {
            sort: {
                id: -1
            },
            limit: instance.eventsFetched.get()
        });
    }
    this.autorun(function() {
        var limit = instance.eventFetchLimit.get();
        var subscription = instance.subscribe('dbEventLog', {
            limit: limit
        }, function() {
            instance.eventsFetched.set(limit);
        });
    });
});
Template.dbLog.helpers({
    numEventRows: function() {
        return Counts.get("eventLog");
    },
    numEventRowsShown: function() {
        return Template.instance().eventsFetched.get();
    },
    dbLogEntries: function() {
        return Template.instance().events();
    },
    showingAll: function() {
        var instance = Template.instance();
        var fetchedRows = instance.events().count();
        var totalRows = Counts.get("eventLog");
        return (fetchedRows == totalRows);
    },
    hasMoreEvents: function() {
        return Template.instance().events().count() >= Template.instance().eventFetchLimit.get();
    }
});
Template.dbLog.events({
    "click .js-eventloadmore": function(event, instance) {
        var limit = instance.eventFetchLimit.get();
        instance.eventFetchLimit.set(limit + instance.pageSize);
    },
    "click .js-eventloadall": function(event, instance) {
        instance.eventFetchLimit.set(0);
    },
});
