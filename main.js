const COIN_PADDING = 20;

const COIN_VALUES = [3, 4];
const START_COIN_QUANTITY = 5;

const REJECTION_MESSAGE_TITLE = "Hmmm&hellip;";

const WELCOME_MESSAGE_TITLE = "The Strong Induction Game";
const WELCOME_MESSAGE = "Use the items in your wallet to pay for the stamps.";

const DIALOG_CLOSE_TEXT = "Continue"
const DIALOG_MIN_WIDTH = 400;

var currentState = null;
var currentStamp = null;

var coinsInDish = [];

var currentDialog = null;

$(document).on("ready", function(e) {
	initStates();

	initLayout();
});

$(document).on("keyup", function(e) {
	var code = (e.keyCode ? e.keyCode : e.which);
	// enter key pressed
	if (e.keyCode == 13) {
		closeDialog();
	}
});

function initStates() {
	var nineCentComboState = createComboState(9, [3], [6], null);
	var nineCentCoinsState = createCoinState(9, nineCentComboState);
	var eightCentState = createCoinState(8, nineCentCoinsState);
	var sevenCentState = createCoinState(7, eightCentState);
	var sixCentState = createCoinState(6, sevenCentState);

	currentState = nineCentComboState;
}

function createCoinState(stampPrice, nextState) {
	var state = new State();

	state.introMessageTitle = "Objective";
	state.introMessage = "Pay for a " + stampPrice + " cent stamp with 3 and 4 cent coins.";

	state.validMessageTitle = "Good job!";
	state.validMessage = "You got the coin amount correct.";

	state.stampPrice = stampPrice;
	state.validationMethod = function() {
		return getValueOfCoins(coinsInDish) == stampPrice;
	}
	state.rejectionMethod = function() {
		if (getValueOfCoins(coinsInDish) > stampPrice) {
			return "That's a bit too much. Try removing some coins.";
		}

		return null;
	}
	state.nextState = nextState;

	return state;
}

function createComboState(stampPrice, validCoins, validStamp, nextState) {
	var state = new State();

	state.introMessage = "Pay for a " + stampPrice + " cent stamp using ";
	state.introMessage += paymentMethodAsString(true, true) + ".";

	state.validMessage = "You got the coin amount correct.<br/><br/>Good job!";

	state.stampPrice = stampPrice;
	state.validationMethod = function() {
		return getValueOfCoins(coinsInDish) == stampPrice;
	}
	state.rejectionMethod = function() {
		if (getValueOfCoins(coinsInDish) > stampPrice) {
			return "That's a bit too much. Try removing some coins.";
		}

		return null;
	}
	state.nextState = nextState;

	return state;
}

function initLayout() {
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

	var welcomeDialog = showDialog(WELCOME_MESSAGE_TITLE, WELCOME_MESSAGE);
	welcomeDialog.on("dialogclose", function(event, ui) {
		showDialog(currentState.introMessageTitle, currentState.introMessage);
	});
}

function refreshLayout() {
	$(".coin").each(function() {
		var coin = $(this);
		var stack = $("#dish");

		$(".stack").each(function() {
			var stackValue = parseInt($(this).attr("data-value"));
			var coinValue = parseInt(coin.attr("data-value"));

			if (stackValue == coinValue) {
				stack = $(this);
				return;
			}
		});

		coin.position({
			of: stack,
			my: "center center",
			at: "center center"
		});

		coin.css("visibility", "hidden");
	});

	setCurrentStamp(createStamp(currentState.stampPrice));

	showTopCoinInStacks();
}

function refresh() {
	var coins = getCoinsInDish();

	if ((coins < coinsInDish) || (coins > coinsInDish)) {
		var quantity = coins.length;
		var value = getValueOfCoins(coins);

		console.log(quantity + " coin" + (quantity != 1 ? "s" : "") + " in " +
			"the dish for a total of " + value + " cents.");
		console.log("You " + (canPurchaseStamp(currentStamp) ? "can" : "cannot") + 
			" purchase the current stamp.");
		console.log("Cost of current stamp: " + currentStamp.attr("data-cost") +
			" cents.");

		coinsInDish = coins;

		if (currentState.validationMethod()) {
			moveStampToWallet(currentStamp);

			var validDialog = showDialog(currentState.validMessageTitle, currentState.validMessage);
			validDialog.bind( "dialogclose", function(event, ui) {

				currentState = currentState.nextState;
				refreshLayout();

				showDialog(currentState.introMessageTitle, currentState.introMessage);
			});
		}

		var rejectMessage = currentState.rejectionMethod();
		if (rejectMessage) {
			showDialog(REJECTION_MESSAGE_TITLE, rejectMessage);
		}
	}
}

function showDialog(title, content) {
	var dialog = $("<div></div>").html(content).dialog({
		title: title,
		draggable: false,
		closeText: DIALOG_CLOSE_TEXT,
		closeOnEscape: true,
		minWidth: DIALOG_MIN_WIDTH,
		open: function(event) {
			$(".stack .coin").each(function() {
				$(this).draggable("disable");
			});
			$("body").append("<div id='modal-overlay'></div>");
		},
		close: function(event) {
			$(".stack .coin").each(function() {
				$(this).draggable("enable");
			});

			$("#modal-overlay").remove();

			$(this).remove();
		}
	});

	currentDialog = dialog;
	return dialog;
}

function closeDialog(dialog) {
	currentDialog.dialog('close');
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
		    position: 'offset',
		    dimension: 'outer',
		    withMargin: true
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
	if (!coins) {
		return 0;
	}

	var value = 0;

	for (var i = 0; i < coins.length; i++) {
		value += coins[i];
	}

	return value;
}

function moveStampToWallet(stamp) {
	var bottomChildren = $("#bottom").children();
	stamp.appendTo("#bottom").position({
		of: bottomChildren.eq(bottomChildren.length - 1),
		my: "left center",
		at: "right center",
		offset: "20 0"
	});
}

function setCurrentStamp(stamp) {
	if (!stamp) {
		return;
	}

	stamp.appendTo("#top").position({
		of: $("#top"),
		my: "left top",
		at: "left top",
		offset: "20 20"
	});

	currentStamp = stamp;
}

Array.prototype.list = function() {
	var string = "";

	for (var i = 0; i < this.length; i++) {
		if (i == this.length - 1) {
			string += "and " + this[i];
		} else if (this.length > 2) {
			string += this[i] + ", ";
		} else {
			string += this[i] + " ";
		}
	}

	return string;
}

function paymentMethodAsString(coins, stamps) {
	var string = "";

	if (coins) {
		string += COIN_VALUES.list() + " cent coins";
	}

	if (coins && stamps) {
		string += " along with ";
	}

	if (stamps) {
		string += COIN_VALUES.list() + " cent coins";
	}

	return string;
}

function createCoin(value) {
	var coin = $("<div>", {
		"class": "coin",
	});

	coin.attr("data-value", value);
	coin.draggable({
		stack: ".coin",
		containment: "#main",
		snap: $(".stack"),
		snapMode: "inner",
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

	stamp = $("<div class=\"stamp\"><div><div><span>" + cost + "</span></div></div></div>");
	stamp.attr("data-cost", cost);

	return stamp;
}

function State() {
	this.introMessageTitle = "";
	this.introMessage = "";

	this.validMessageTitle = "";
	this.validMessage = "";

	this.validationMethod = null;
	this.rejectionMethod = null;

	this.stampPrice = 0;

	this.nextState = null;
}