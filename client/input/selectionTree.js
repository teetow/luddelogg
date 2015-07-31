Template.input.onCreated(function() {
	this.selectionTree = {
		propLabel: "Add event",
		propValue: "addevent",
		choices: [{
			prop: "eventType",
			propValue: "sleep",
			propLabel: "Sleep",
			choices: [{
				prop: "eventLabel",
				propValue: "nap",
				propLabel: "Nap"
			}, {
				prop: "eventLabel",
				propValue: "night",
				propLabel: "night"
			}]
		}, {
			prop: "eventType",
			propValue: "food",
			propLabel: "Food",
			choices: [{
				prop: "eventLabel",
				propValue: "feeding",
				propLabel: "Feeding",
				choices: [{
					prop: "eventDetail",
					propValue: "left",
					propLabel: "Left"
				}, {
					prop: "eventDetail",
					propValue: "right",
					propLabel: "Right"
				}]
			}, {
				prop: "eventLabel",
				propValue: "snack",
				propLabel: "Snack",
				choices: [{
					prop: "eventDetail",
					propValue: "fruit",
					propLabel: "Fruit"
				}, {
					prop: "eventDetail",
					propValue: "sandwich",
					propLabel: "Sandwich"
				}]
			}, {
				prop: "eventLabel",
				propValue: "meal",
				propLabel: "Meal"
			}]
		}, {
			prop: "eventType",
			propValue: "routine",
			propLabel: "Routine",
			choices: [{
				prop: "eventLabel",
				propValue: "toothbrush",
				propLabel: "Toothbrush"
			}, {
				prop: "eventLabel",
				propValue: "drops",
				propLabel: "Drops"
			}, {
				prop: "eventLabel",
				propValue: "diaper",
				propLabel: "Diaper",
				choices: [{
					prop: "eventDetail",
					propValue: "wet",
					propLabel: "Wet"
				}, {
					prop: "eventDetail",
					propValue: "messy",
					propLabel: "Messy"
				}]
			}]
		}]
	};
});
