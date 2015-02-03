Meteor.startup(function () {
	if (Luddelog.findOne() === undefined) {
		console.log('no default data');
		addDefaultData();
	} else {
		console.log('default data found. good to go.');
	}
});
Meteor.methods({
	addDefaultData: function() {
		addDefaultData();
	},
	removeDefaultData: function() {
		removeDefaultData();
	},
	flushDefaultData: function() {
		removeDefaultData();
		addDefaultData();
	},
	getGroupedLogData: function() {
		return getGroupedLogData();
	}
})

function addDefaultData() {
	var defaultData = JSON.parse(Assets.getText("luddelog.json"));
	defaultData.forEach(function(item, index, array) {
		console.log("inserting " + item.event);
		Luddelog.insert(item);
	});
}

function removeDefaultData(){
	Luddelog.remove({});
	return "data cleared.";
}


function getGroupedLogData(){
	var logData = Luddelog.find({},{
		sort:{
			calendarDate:1
		}
	}).fetch();

	var countingArgs = [{
		$group: {
			_id: "$calendarDate",
			numEntries: {$sum: 1}
		}
	}];
	var availableDates = Luddelog.aggregate(countingArgs);
	var groupedData = [];
	availableDates.forEach(function(item, index, array) {
		var date = item._id;
		var entries = Luddelog.find({calendarDate: date}).fetch();
		groupedData.push({
			date: date,
			entries: entries
		});
	});
	groupedData.sort(function(a, b){
		if (a.date > b.date)
			return 1;
		if (a.date < b.date)
			return -1;
		return 0;
	});
	return groupedData;
}