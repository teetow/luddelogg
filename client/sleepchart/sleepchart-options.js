Template.sleepchartOptionCheckbox.events({
	"click .sleepchart-option-checkbox": function(event, template) {
		var x = template.$('input').is(":checked");
		var options = Template.instance().closestInstance("sleepchart").options.get();
		options[template.$("input").attr("name")].value = x;
		Template.instance().closestInstance("sleepchart").options.set(options);
	},
});