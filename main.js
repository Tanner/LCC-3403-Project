
var States = {
	Start : 0,
}

var state = States.Start;
var coinsInDish = 0;
const COIN_PADDING = 20;

function refresh() {
	var coins = numberOfCoinsInDish();
	if (coins != coinsInDish) {
		alert(coins + " coin" + (coins != 1 ? "s" : "") + " in the dish");
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

			for (var i = 0; i < $(".coin").length; i++) {
				$(".coin").eq(i).position({
					of: $("#left"),
					my: "left bottom",
					at: "left bottom",
					offset: ((i + 1) * ($(".coin").width() + COIN_PADDING)) - $(".coin").width() + " -" + COIN_PADDING,
				});
			}
	}
}

$(document).on("ready", function(e) {
	$(".coin").draggable({
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

	layout();
});