Template.inputbuttons.created = function() {
    var sheetReady = this.sheetReady = new ReactiveVar();
    Meteor.call("isSheetReady", function(err, result) {
        sheetReady.set(true);
    });
}

Template.inputbuttons.helpers({
    sheetReady: function() {
        var sheetReady = Template.instance().sheetReady;
        if (sheetReady)
            return sheetReady.get();
        return false;
    },
});

Template.inputbuttons.events({
    'click .js-button-sleep': function() {
        Meteor.call("dbAddEntry", {
            activity: "sleep",
            label: "nap 1",
        });
    },
    'click .js-button-food': function() {
        Meteor.call("dbAddEntry", {
            activity: "food",
            label: "meal",
        });
    },
});
