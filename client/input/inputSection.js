Template.inputSection.onCreated(function() {
    var instance = this;
    var currentSelectedValue = instance.currentSelectedValue = new ReactiveVar();
    var currentSelectedItem = instance.currentSelectedItem = new ReactiveVar();
    instance.autorun(function() {
        var currentValue = currentSelectedValue.get();
        if (currentValue) {
            var choices = instance.data.choices;
            choices.forEach(function(item) {
                if (item.propValue == currentValue) {
                    currentSelectedItem.set(item);
                }
            });
        }
    });
});
Template.inputSection.helpers({
    hasValue: function() {
        var currentSelectedValue = Template.instance().currentSelectedValue.get();
        var choices = Template.instance().data.choices;
        if (!choices) return false;
        var hasValue = false;
        choices.forEach(function(choice) {
            if (currentSelectedValue == choice.propValue) {
                hasValue = true;
            }
        });
        return hasValue;
    },
    subChoices: function() {
        return Template.instance().currentSelectedItem.get();
    },
    isActiveChoice: function() {
        return this.propValue == Template.instance().currentSelectedValue.get();
    },
});
Template.inputSection.events({
    "click .js-action": function(event, template) {
        if ($(event.target).hasClass(template.data.propValue)) {
            template.currentSelectedValue.set(this.propValue);
        }
    }
});
