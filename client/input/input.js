Template.input.onCreated(function() {
    let instance = this;
    instance.eventData = new Mongo.Collection(null);
    instance.setEventProp = function(attribute, value) {
        var currentEventData = eventData.findOne();
        if (currentEventData) {
            currentEventData[attribute] = value;
            instance.eventData.upsert(currentEventData._id, currentEventData);
        } else {
            var newData = {};
            newData[attribute] = value;
            instance.eventData.insert(newData);
        }
    };
    instance.sheetReady = new ReactiveVar(true); //fix later
});
Template.input.helpers({
    sheetReady: function() {
        return Template.instance().sheetReady.get();
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
