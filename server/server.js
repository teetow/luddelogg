if (Luddelog.findOne() == undefined) {
    console.log('no default data');
    addDefaultData();
} else {
    console.log('default data found. good to go.');
}

function addDefaultData() {
    var defaultData = JSON.parse(Assets.getText("luddelog.json"));
    defaultData.forEach(function(item, index, array) {
        console.log("inserting " + item.event);
        Luddelog.insert(item);
    });
}
