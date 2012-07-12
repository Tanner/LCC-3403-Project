const COIN_PADDING = 20;

const COIN_VALUES = [3, 4];
const START_COIN_QUANTITY = 5;

var currentState = null;
var currentStamp = null;

var coinsInDish = [];

$(document).on("ready", function(e) {
	initStates();

	layout();
});

function initStates() {
	var prevState = null;
	var state = new State();
	state.introMessage = "Pay for a 8 cent stamp with 3 and 4 cent coins.";
	state.rejectMessage = "That is not right, try again.";
	state.stampPrice = 8;
	state.validationMethod = function() {
		return getValueOfCoins() == state.stampPrice;
	}
	state.nextState = prevState;

	prevState = state;
	state = new State();
	state.introMessage = "Pay for a 7 cent stamp with 3 and 4 cent coins.";
	state.rejectMessage = "That is not right, try again.";
	state.stampPrice = 7;
	state.validationMethod = function() {
		return getValueOfCoins() == state.stampPrice;
	}
	state.nextState = prevState;

	prevState = state;
	state = new State();
	state.introMessage = "Pay for a 6 cent stamp with 3 and 4 cent coins.";
	state.rejectMessage = "That is not right, try again.";
	state.stampPrice = 6;
	state.validationMethod = function() {
		return getValueOfCoins() == state.stampPrice;
	}
	state.nextState = prevState;

	currentState = state;
}

function layout() {
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

			coin.appendTo(stack);

			coin.position({
				of: stack,
				my: "center center",
				at: "center center"
			});

			coin.css("visibility", "hidden");
		}
	}

	setCurrentStamp(createStamp(currentState.stampPrice));

	showTopCoinInStacks();
}

function refresh() {
	var coins = getCoinsInDish();

	if (coins != coinsInDish) {
		var quantity = coins.length;
		var value = getValueOfCoins(coins);

		console.log(quantity + " coin" + (quantity != 1 ? "s" : "") + " in " +
			"the dish for a total of " + value + " cents.");
		console.log("You " + (canPurchaseStamp(currentStamp) ? "can" : "cannot") + 
			" purchase the current stamp.");
		console.log("Cost of current stamp: " + currentStamp.attr("data-cost") +
			" cents.");

		coinsInDish = coins;
	}
}

function showTopCoinInStacks() {
	$(".stack").each(function() {
		var coinsInStack = $(this).children().filter(function() {
			if (!$(this).hasClass("dragged")) {
				return true;
			}
		});

		coinsInStack.first().css("visibility", "visible");
	});
}

function getCoinsInDish() {
	var coins = [];

	$(".coin").each(function(e) {
		if (new $.rect($(this),{
		    position : 'offset',
		    dimension : 'outer',
		    withMargin : true
		}).intersects($("#dish"))) {
			coins.push(parseInt($(this).attr("data-value")));
		}
	});

	return coins;
}

function canPurchaseStamp(stamp) {
	if (!stamp) {
		return false;
	}

	var coins = getCoinsInDish();

	var value = 0;
	for (var i = 0; i < coins.length; i++) {
		value += coins[i];
	}

	return value == stamp.attr("data-cost");
}

function getValueOfCoins(coins) {
	var value = 0;

	for (var i = 0; i < coins.length; i++) {
		value += coins[i];
	}

	return value;
}

function setCurrentStamp(stamp) {
	if (!stamp) {
		return;
	}

	stamp.position({
		of: dish,
		my: "center bottom",
		at: "center top"
	});

	currentStamp = stamp;
}

function createCoin(value) {
	var coin = $("<div>", {
		"class": "coin",
	});

	coin.attr("data-value", value);
	coin.draggable({
		stack: ".coin",
		containment: "#left",
		drag: function(event, ui) {
			$(this).addClass("dragging");
			$(this).addClass("dragged");
			showTopCoinInStacks();
		},
		stop: function(event, ui) {
			$(this).removeClass("dragging");
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

function State() {
	this.introMessage = "";
	this.rejectMessage = "";

	this.validationMethod = null;
	this.stampPrice = 0;

	this.nextState = null;
}