Template.input.onCreated(function() {
    var eventData = this.eventData = new Mongo.Collection(null);
    this.setEventProp = function(attribute, value) {
        var currentEventData = eventData.findOne();
        if (currentEventData) {
            currentEventData[attribute] = value;
            eventData.upsert(currentEventData._id, currentEventData);
        } else {
            var newData = {};
            newData[attribute] = value;
            eventData.insert(newData);
        }
    };
    var sheetReady = this.sheetReady = new ReactiveVar(false);
    Meteor.call("isSheetReady", function(err, result) {
        sheetReady.set(true);
    });
});
Template.input.helpers({
    sheetReady: function() {
        return Template.instance().sheetReady;
    },
    eventData: function() {
        return Template.instance().eventData.findOne();
    },
    hasEventData: function() {
        var currentEventData = Template.instance().eventData.findOne();
        return (currentEventData && currentEventData.eventType !== undefined);
    },
    selectionTree: function() {
        return Template.instance().selectionTree;
    },
});
Template.input.events({
    'click .js-action': function(event, template) {
        template.setEventProp(this.propLabel, this.propValue);
    },
});
