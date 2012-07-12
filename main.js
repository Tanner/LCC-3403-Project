
const States = {
	Start : 0,
}

const COIN_PADDING = 20;

const COIN_VALUES = [5, 2];
const START_COIN_QUANTITY = 5;

var state = States.Start;
var coinsInDish = 0;

function refresh() {
	var coins = numberOfCoinsInDish();
	if (coins != coinsInDish) {
		console.log(coins + " coin" + (coins != 1 ? "s" : "") + " in the dish");
		coinsInDish = coins;
	}
}

function numberOfCoinsInDish() {
	var coins = 0;

	$(".coin").each(function(e) {
		if (new $.rect($(this)).intersects($("#dish"))) {
			coins++;
		}
	});

	return coins;
}

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
	}
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

$(document).on("ready", function(e) {
	layout();
});