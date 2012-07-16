const COIN_PADDING = 20;

const COIN_VALUES = [3, 4];
const START_COIN_QUANTITY = [6, 3];

const REJECTION_MESSAGE_TITLE = "Hmmm&hellip;";

const WELCOME_MESSAGE_TITLE = "The Strong Induction Game";
const WELCOME_MESSAGE = "Use the items in your wallet to pay for the stamps.";

const FINISH_MESSAGE_TITLE = "Hurrah!";
const FINISH_MESSAGE = "You completed the game!<br/><br/>Hopefully you've" +
	" have an idea of what Strong Induction is now.<br/><br/>Refresh to " +
	" replay. Tap continue to watch an explanation video.";

const DIALOG_CLOSE_TEXT = "Continue"
const DIALOG_MIN_WIDTH = 400;

const WALLET_LAST_COIN_STACK = "#bottom .stack#b";

const LAST_STAMP_COST = 11;

var currentState = null;
var currentStamp = null;

var coinsInDish = [];
var stampsInDish = [];

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
	var elevenCentComboState = createComboState(11, [3], [8], null);
	var tenCentComboState = createComboState(10, [3], [7], elevenCentComboState);
	var nineCentComboState = createComboState(9, [3], [6], tenCentComboState);
	var eightCentState = createCoinState(8, nineCentComboState);
	var sevenCentState = createCoinState(7, eightCentState);
	var sixCentState = createCoinState(6, sevenCentState);

	currentState = sixCentState;
}

function createCoinState(stampPrice, nextState) {
	var state = new State();

	state.introMessageTitle = "Objective";
	state.introMessage = "Pay for a " + stampPrice + " cent stamp using ";
	state.introMessage += paymentMethodAsString(true, false) + ".";

	state.validMessageTitle = "Good job!";
	state.validMessage = "You got the coin amount correct.<br/><br/>A " +
		+ stampPrice + " cent stamp has been added to your wallet.";

	state.stampPrice = stampPrice;
	state.validationMethod = function() {
		return getValueOfCoins(coinsInDish).sum() == stampPrice;
	}
	state.rejectionMethod = function() {
		var dishCoinValue = getValueOfCoins(coinsInDish).sum();
		var dishStampValue = getValueOfStamps(stampsInDish).sum();

		if (dishCoinValue + dishStampValue > stampPrice) {
			var string = "That's a bit too much. Try removing some ";

			if (dishStampValue > 0 && dishCoinValue > 0) {
				string += "coins or stamps";
			} else if (dishCoinValue > 0) {
				string += "coins";
			} else if (dishStampValue > 0) {
				string += "stamps";
			}

			string += " from the dish.";

			return string;
		}

		return null;
	}
	state.nextState = nextState;

	return state;
}

function createComboState(stampPrice, validCoins, validStamp, nextState) {
	var state = new State();

	state.introMessageTitle = "Objective";
	state.introMessage = "Pay for a " + stampPrice + " cent stamp using ";

	state.willBeginMethod = function() {
		state.introMessage += paymentMethodAsString(true, true) + ".";
	}

	state.validMessageTitle = "Good job!";
	state.validMessage = "You got the payment correct.<br/><br/>A " +
		+ stampPrice + " cent stamp has been added to your wallet.";

	state.stampPrice = stampPrice;
	state.validationMethod = function() {
		var dishCoinValue = getValueOfCoins(coinsInDish).sum();

		if (dishCoinValue == stampPrice) {
			return false;
		} else {
			return dishCoinValue + getValueOfStamps(stampsInDish).sum() == stampPrice;
		}
	}
	state.rejectionMethod = function() {
		var dishCoinValue = getValueOfCoins(coinsInDish).sum();
		var dishStampValue = getValueOfStamps(stampsInDish).sum();

		if (dishCoinValue == stampPrice) {
			return "You don't want to use more coins than you have to." +
				"<br/><br/>Is there some other way to pay for the stamp?";
		}

		if (dishCoinValue + dishStampValue > stampPrice) {
			var string = "That's a bit too much. Try removing some ";

			if (dishStampValue > 0 && dishCoinValue > 0) {
				string += "coins or stamps";
			} else if (dishCoinValue > 0) {
				string += "coins";
			} else if (dishStampValue > 0) {
				string += "stamps";
			}

			string += " from the dish.";

			return string;
		}

		return null;
	}
	state.nextState = nextState;

	return state;
}

function initLayout() {
	if (COIN_VALUES.length != START_COIN_QUANTITY.length) {
		console.error("COIN_VALUES is not the same length as START_COIN_QUANTITY");
	}

	for (var i = 0; i < COIN_VALUES.length; i++) {
		for (var j = 0; j < START_COIN_QUANTITY[i]; j++) {
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

	showTopCoinInStacks();

	if (currentState) {
		setCurrentStamp(createStamp(currentState.stampPrice, false));
	}

	var welcomeDialog = showDialog(WELCOME_MESSAGE_TITLE, WELCOME_MESSAGE, true);
	welcomeDialog.on("dialogclose", function(event, ui) {
		if (currentState) {
			showDialog(currentState.introMessageTitle, currentState.introMessage, true);
		}
	});
}

function refreshLayout() {
	// Move coins back to their respective stacks
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

		coin.removeClass("dragged");

		coin.css("visibility", "hidden");
	});

	// Move stamps back to the wallet
	moveStampsBackToWallet();

	showTopCoinInStacks();
}

function refresh() {
	if (!currentState) {
		showFinish();
	}

	var dishChanged = false;

	var coins = getCoinsInDish();

	if (coins.length != coinsInDish.length) {
		dishChanged = true;
	} else {
		for (var i = 0; i < coins.length; i++) {
			for (var j = 0; j < coinsInDish.length; j++) {
				if (coins[i] !== coinsInDish[j]) {
					dishChanged = true;
				}
			}
		}
	}

	var stamps = getStampsInDish();
	if (stamps.length != stampsInDish.length) {
		dishChanged = true;
	} else {
		for (var i = 0; i < stamps.length; i++) {
			for (var j = 0; j < stampsInDish.length; j++) {
				if (stamps[i] !== stampsInDish[j]) {
					dishChanged = true;
				}
			}
		}
	}

	if (dishChanged) {
		coinsInDish = coins;
		stampsInDish = stamps;

		if (currentState && currentState.validationMethod()) {
			for (var i = 0; i < coinsInDish.length; i++) {
				coinsInDish[i].remove();
			}

			for (var i = 0; i < stampsInDish.length; i++) {
				stampsInDish[i].remove();
			}

			refreshLayout();

			moveStampToWallet(currentStamp);

			var validDialog = showDialog(currentState.validMessageTitle, currentState.validMessage, true);
			validDialog.bind("dialogclose", function(event, ui) {
				currentState = currentState.nextState;

				if (currentState) {
					if (currentState.willBeginMethod) {
						currentState.willBeginMethod();
					}
					setCurrentStamp(createStamp(currentState.stampPrice, false));

					showDialog(currentState.introMessageTitle, currentState.introMessage, true);
				} else {
					showFinish();
				}
			});
		}

		if (currentState) {
			var rejectMessage = currentState.rejectionMethod();
			if (rejectMessage) {
				showDialog(REJECTION_MESSAGE_TITLE, rejectMessage, true);
			}
		}
	}
}

function showFinish() {
	var finishDialog = showDialog(FINISH_MESSAGE_TITLE, FINISH_MESSAGE, false);

	finishDialog.bind("dialogopen", function(event, ui) {
		$(".stamp").remove();
		$(".coin").remove();

		const NUM_STAMPS = 50;

		const STAMP_VALUE_MAX = 50;
		const STAMP_VALUE_MIN = 5;

		const MAX_ANIMATE_TIME = 3000;
		const MIN_ANIMATE_TIME = 1500;

		const MAX_SPINS = 5;

		const FINAL_SPIN_TIME = 250;

		for (var value = LAST_STAMP_COST; value < LAST_STAMP_COST + NUM_STAMPS; value++) {
			var stampContainer = $("<div class=\"stamp-container\"></div>");
			var stamp = createStamp(value, true);

			stamp.appendTo(stampContainer)
			stampContainer.appendTo("#main").position({
				of: $(window),
				my: "center center",
				at: "center center",
				offset: "0 0"
			});

			makeStampDraggable(stamp);

			var time = Math.random() * (MAX_ANIMATE_TIME - MIN_ANIMATE_TIME) + MIN_ANIMATE_TIME;

			stamp.transition({
				rotate: Math.random() * 360 * MAX_SPINS * 2 - 360 * MAX_SPINS,
			}, time);
			
			const windowWidth = $(window).width();
			const windowHeight = $(window).height();
			
			var x = Math.floor(Math.random() * windowWidth) - windowWidth / 2;
			var y = Math.floor(Math.random() * windowHeight) - windowHeight / 2;

			stampContainer.transition({
				x: x,
				y: y,
			}, time - FINAL_SPIN_TIME);
		}
	});

	finishDialog.dialog("open");

	finishDialog.bind("dialogclose", function(event, ui) {
		$("#main").transition({
			perspective: "800px",
			rotateY: "90deg"
		}, 250, 'linear', function() {
			$("#top").remove();
			$("#bottom").remove();

			$(this).transition({
				perspective: "800px",
				rotateY: "180deg"
			}, 250, 'linear', function() {
				$(this).css("-webkit-transform", "inherit");
			});
		});
	});
}

function showDialog(title, content, autoOpen) {
	if (!autoOpen) {
		autoOpen = false;
	}

	var dialog = $("<div></div>").html(content).dialog({
		title: title,
		draggable: false,
		autoOpen: autoOpen,
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
			coins.push($(this));
		}
	});

	return coins;
}

function getValueOfCoins(coins) {
	var coinValues = [];

	for (var i = 0; i < coins.length; i++) {
		coinValues[i] = parseInt(coins[i].attr("data-value"));
	}

	return coinValues;
}

function getStampsInDish() {
	var stamps = [];

	$(".stamp").each(function(e) {
		if (new $.rect($(this),{
		    position: 'offset',
		    dimension: 'outer',
		    withMargin: true
		}).intersects($("#dish"))) {
			stamps.push($(this));
		}
	});

	return stamps;
}

function getValueOfStamps(stamps) {
	var stampValues = [];

	for (var i = 0; i < stamps.length; i++) {
		stampValues[i] = parseInt(stamps[i].attr("data-cost"));
	}

	return stampValues;
}

function getStampsInWallet() {
	var stamps = [];

	$("#bottom .stamp").each(function() {
		stamps.push($(this));
	});

	return stamps;
}

function canPurchaseStamp(stamp) {
	if (!stamp) {
		return false;
	}

	var dishValue = getValueOfCoins(getCoinsInDish()).sum();

	return dishValue == stamp.attr("data-cost");
}

function moveStampToWallet(stamp) {
	stamp.off("mousedown");

	var bottomChildren = $("#bottom").children();
	stamp.appendTo("#bottom").position({
		of: bottomChildren.eq(bottomChildren.length - 1),
		my: "left center",
		at: "right center",
		offset: "20 0"
	});

	makeStampDraggable(stamp);
}

function moveStampsBackToWallet() {
	var appendingElement = $(WALLET_LAST_COIN_STACK);
	$("#bottom .stamp").each(function() {
		$(this).position({
			of: appendingElement,
			my: "left center",
			at: "right center",
			offset: "20 0"
		});

		appendingElement = $(this);
	})
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

	stamp.on("mousedown", function() {
		showDialog("You can't take that!", "You have to pay for it first" +
			" &mdash; that'll be " + stamp.attr("data-cost") + " cents.");
	})

	currentStamp = stamp;
}

function makeStampDraggable(stamp) {
	stamp.draggable({
		stack: ".stamp, .coin",
		containment: "#main",
		drag: function(event, ui) {
			$(this).addClass("dragging");
			$(this).addClass("dragged");
		},
		stop: function(event, ui) {
			$(this).removeClass("dragging");
			refresh();
		}
	});
}

function paymentMethodAsString(includeCoins, includeStamps) {
	var string = "";

	if (includeCoins) {
		string += COIN_VALUES.list() + " cent ";

		if (COIN_VALUES.length > 1 || COIN_VALUES.length == 0) {
			string += "coins";
		} else {
			string += "coin";
		}
	}

	if (includeCoins && includeStamps) {
		string += " along with ";
	}

	if (includeStamps) {
		var stamps = getStampsInWallet();

		var stampPrinter = function(element) {
			return element.attr("data-cost");
		};

		string += stamps.list(stampPrinter) + " cent ";

		if (stamps.length > 1 || stamps.length == 0) {
			string += "stamps";
		} else {
			string += "stamp";
		}
	}

	return string;
}

function createCoin(value) {
	var coin = $("<div>", {
		"class": "coin",
	});

	coin.attr("data-value", value);
	coin.draggable({
		stack: ".coin, .stamp",
		containment: "#main",
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

function createStamp(cost, randomColor) {
	var stamp = $("<div>", {
		"class": "stamp",
	});

	stamp = $("<div class=\"stamp\"><div><div><span id=\"cent\"></span><span>" + cost + "</span></div></div></div>");
	stamp.attr("data-cost", cost);

	var pow = 1024;
	var h = 0;
	var s = 100;
	var l = 30;

	if (randomColor) {
		h = Math.floor(Math.random() * 360);
	} else {
		h = Math.pow(pow, cost % 3 + 6) % 360;
	}

	stamp.children().children("div").css("background", "hsl(" + h + ", " + s + "%, " + l + "%)");

	return stamp;
}

function State() {
	this.introMessageTitle = "";
	this.introMessage = "";

	this.validMessageTitle = "";
	this.validMessage = "";

	this.willBeginMethod = null;

	this.validationMethod = null;
	this.rejectionMethod = null;

	this.stampPrice = 0;

	this.nextState = null;
}

Array.prototype.list = function(elementPrinter) {
	if (this.length == 0) {
		return "no";
	}

	var printElement = elementPrinter ? elementPrinter : function(element) {
		return element;
	}

	var string = "";

	for (var i = 0; i < this.length; i++) {
		if (i == this.length - 1) {
			string += "and " + printElement(this[i]);
		} else if (this.length > 2) {
			string += printElement(this[i]) + ", ";
		} else {
			string += printElement(this[i]) + " ";
		}
	}

	return string;
}

Array.prototype.sum = function() {
	var sum = 0;

	for (var i = 0; i < this.length; i++) {
		sum += this[i];
	}

	return sum;
}