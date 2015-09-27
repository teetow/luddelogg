Template.sleepchartOptionCheckbox.events({
	"click .sleepchart-option": function(event, template) {
		var options = Template.instance().closestInstance("sleepchart").options.get();
		options[this.name].value = !options[this.name].value;
		Template.instance().closestInstance("sleepchart").options.set(options);
	},
});
Template.sleepchartOptionCheckbox.helpers({
	checkedClass: function() {
		return Template.instance().closestInstance("sleepchart").options.get()[this.name].value ? "mod-checked" : "";
	},
});
