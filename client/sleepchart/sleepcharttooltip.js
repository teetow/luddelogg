Template.sleepchartTooltip.helpers({
	tooltipinfo: function() {
		var tooltipinfo = Session.get("tooltipInfo");
		if (!tooltipinfo) {
			return;
		}
		if (tooltipinfo.data.duration) {
			tooltiptext = tooltipinfo.data.duration;
		} else if (tooltipinfo.data.time) {
			tooltiptext = tooltipinfo.data.time;
		}
		tooltipinfo.text = tooltiptext;
		return tooltipinfo;
	},
});
