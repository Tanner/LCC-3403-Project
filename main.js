
var States = {
	Start : 0,
}

var state = States.Start;

function refresh() {

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
					offset: ((i + 1) * ($(".coin").width() + 25)) - $(".coin").width() + " -25",
				});
			}
	}
}

$(document).on("ready", function(e) {
	$(".coin").draggable( {
		start: function() {
			var coinMoved = $(this).index();
			$(".coin").each(function(e) {
				if ($(this).index() == coinMoved) {
					$(this).css("z-index", 9999);
				} else if ($(this).css("z-index") > 0){
					$(this).css("z-index", $(this).css("z-index") - 1);
				}
			});
		}
	});
	$(".dish").droppable({
		drop: function() {
			refresh();
		}
	});

	layout();
});