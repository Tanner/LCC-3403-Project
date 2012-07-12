
const States = {
	Start : 0,
}

const COIN_PADDING = 20;

const COIN_VALUES = [5, 2];
const START_COIN_QUANTITY = 5;

var state = States.Start;
var coinsInDish = [];

$(document).on("ready", function(e) {
	layout();
});

function layout() {
	switch (state) {
		case States.Start:
			$("#dish").position({
				of: $("#left"),
				my: "center center",
				at: "center center"
			});

			for (var i = 0; i < COIN_VALUES.length; i++) {
				for (var j = 0; j < START_COIN_QUANTITY; j++) {
					var coin = createCoin(COIN_VALUES[i]);
					var stack = $("#dish");

					$(".stack").each(function() {
						if (parseInt($(this).attr("data-value")) == COIN_VALUES[i]) {
							stack = $(this);
							return;
						}
					});

					coin.position({
						of: stack,
						my: "center center",
						at: "center center"
					});
				}
			}

			var stamp = createStamp(12);
			stamp.position({
				of: dish,
				my: "center bottom",
				at: "center top"
			});
	}
}

function refresh() {
	var coins = getCoinsInDish();
	if (coins != coinsInDish) {
		var quantity = coins.length;
		var amount = 0;

		for (var i = 0; i < coins.length; i++) {
			amount += coins[i];
		}

		console.log(quantity + " coin" + (quantity != 1 ? "s" : "") + " in " +
			"the dish for a total of " + amount + " cents.");

		coinsInDish = coins;
	}
}

function getCoinsInDish() {
	var coins = [];

	$(".coin").each(function(e) {
		if (new $.rect($(this)).intersects($("#dish"))) {
			coins.push(parseInt($(this).attr("data-value")));
		}
	});

	return coins;
}

function createCoin(value) {
	var coin = $("<div>", {
		"class": "coin",
	});

	coin.attr("data-value", value);
	coin.appendTo("#left");
	coin.draggable({
		stack: ".coin",
		containment: "parent",
		drag: function(event, ui) {
			$(this).addClass("darkshadow");
		},
		stop: function(event, ui) {
			$(this).removeClass("darkshadow");
			refresh();
		}
	});

	return coin;
}

function createStamp(cost) {
	var stamp = $("<div>", {
		"class": "stamp",
	});

	stamp.attr("data-cost", cost);
	stamp.appendTo("#left");

	return stamp;
}