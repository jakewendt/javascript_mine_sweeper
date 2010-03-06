$(function(){
	if (typeof(w) == 'undefined') w = 20;
	if (typeof(h) == 'undefined') h = 15;
	if (typeof(d) == 'undefined') d = 10;

	m = new MineSweeperBoard({
		height: h,
		width:  w,
		mines:  parseInt((w*h*d)/100, 10)
	});

	//  Modified for right click control from ...
	//  http://abeautifulsite.net/2008/05/jquery-right-click-plugin/
	$('.square').mousedown( function(e) {
		evt = e;
		$(this).mouseup( function() {
			$(this).unbind('mouseup');
			var sq_id = $(this).attr('id');
			var square = m.squares[sq_id]
			//	evt.metaKey seems to work on both Firefox and Safari
			//	It works on Command and Control on my MacBook.
			//  I haven't checked it on an actual 2 button mouse.  Will test it soon on my iMac.
			if( evt.button == 2 || evt.metaKey ) {	//	right click (button always seems to equal 0 on Safari)
				if(square.covered ) {
					if(square.flagged) {
						$(this).removeClass('flagged');
						square.flagged = false;
					} else {
						$(this).addClass('flagged');
						square.flagged = true;
					}
				}
			} else if( evt.button == 0 ) {	// left click
				if(square.covered && !square.flagged) {
					if(square.mined) {
						$(this).css('background-color','red'); 
						if( confirm('Boom!  Game Over!  Play again?') ){
							window.location.reload();
						} else {
							$('.square').unbind();
						}
					} else {
						m.clear_square(square);
					}
				}
				return false;
			} else {
				return true;
			}
		});
	});

});





/* 
	This produces a much more shuffled array than 
		sort(function(){return Math.round(Math.random()) - 0.5}) 
	which often returned a very 'coagulated' shuffle.
	modified a bit from http://jsfromhell.com/array/shuffle
*/
Array.prototype.shuffle = function(){
	for(var j, x, i = this.length; i; j = parseInt(Math.random() * i), x = this[--i], this[i] = this[j], this[j] = x);
	return this;
};

function MineSweeperBoard(options_) {
	msb = this;		/* inside jQuery loops, this is not this this, it's jQuery's this! */
	var options = {
		board_tag:         "div#mine_sweeper",
		squares_count_tag: "span#squares_count",
		mines_count_tag:   "span#mines_count",
		cleared_count_tag: "span#cleared_count",
		safe_count_tag:    "span#safe_count",
		height: 15,
		width:  25,
		mines:  40
	}
	$.extend( true, options, options_ );
	var height  = parseInt(options.height,10);
	var width   = parseInt(options.width,10);
	var mines   = parseInt(options.mines,10);
	var total   = height * width
	var cleared = 0;
	var game_over = false;

	this.squares = squares = {};

	build_board();
	lay_mines();
	compute_contacts();


	function build_board(){
		for( var i=0; i<(total); i++ ) {
			var id = "sq" + i
			$(options.board_tag).append("<div id='"+id+"' class='square'></div>");
			squares[id] = { id:i, covered: true }
		}
		$(options.board_tag).css('width',(4+(width*32))+'px')
		$(options.board_tag+ ' div.square:nth-of-type('+width+'n+1)').css('clear','left')
		$(options.mines_count_tag).html(mines);
		$(options.squares_count_tag).html(total);
		$(options.cleared_count_tag).html(cleared);
		$(options.safe_count_tag).html(total - mines - cleared);
		//	block the right click context menu from popping up when flag squares
		$(options.board_tag)[0].oncontextmenu = function(){return false;}
	}

	function lay_mines() {
		var all_keys = new Array(total);
		for( var i=0; i<(total); i++ ) {
			all_keys[i] = "sq" + i
		}
		var xmines = all_keys.shuffle().slice(0,mines)
		$.each(xmines, function() {
			squares[this].mined = true;
		});
	}

	function compute_contacts() {
		for( var square_key in squares ) {
			var square = squares[square_key];
			if( square.mined ) continue;
			var neighbors = get_neighbor_ids_of(square);
			var count = 0;
			$.each(neighbors,function(){
				if(typeof(squares['sq'+this]) == 'object' && squares['sq'+this].mined) {
					count++
				}
			});
			if( count > 0 ) square['contacts'] = count;
		}
	}

	function get_neighbor_ids_of(square){
		var neighbors = []
		if ( square.id % width )     neighbors.push(square.id - (width+1))
		neighbors.push(square.id - width)
		if ( (square.id+1) % width ) neighbors.push(square.id - (width-1))
		if ( square.id % width )     neighbors.push(square.id - 1)
		if ( (square.id+1) % width ) neighbors.push(square.id + 1)
		if ( square.id % width )     neighbors.push(square.id + (width-1))
		neighbors.push(square.id + width)
		if ( (square.id+1) % width ) neighbors.push(square.id + (width+1))
		return neighbors;
	}

	this.clear_square = clear_square;	// called from outside
	function clear_square(square){
		square.covered = false;
		$(options.board_tag + ' #sq'+square.id).unbind();
		$(options.board_tag + ' #sq'+square.id).addClass('cleared');
		$(options.board_tag + ' #sq'+square.id).html(square.contacts);
		$(options.cleared_count_tag).html(++cleared);
		$(options.safe_count_tag).html(total - mines - cleared);
		if( (mines + cleared ) == total && !game_over ) {
			game_over = true
			if( confirm('Congrats!  You win! Play again?') ){
				window.location.reload();
			} else {
				$(options.board_tag + ' .square').unbind();
			}
		} else {
			if( square.contacts == null ) clear_neighbors_of(square);
		}
	}

	function clear_neighbors_of(square){
		var neighbors = get_neighbor_ids_of(square);
		$.each(neighbors,function(){
			if( typeof(squares['sq'+this]) == 'object' && 
				squares['sq'+this].covered && 
				!squares['sq'+this].mined) {
				clear_square(squares['sq'+this]);
			}
		});
	}

}
/*
function Square(id) {
	var id = id;
	var flagged = false;
	var covered = true;
	var tag = "sq" + id;
	
	this.id = id;
	function id(){ return id; }
	this.flagged = flagged;
	function flagged(){ return flagged; }
	this.flag = flag;
	function flag(){ flagged = true; return flagged; }
	this.unflag = unflag;
	function unflag(){ flagged = false; return flagged; }
}
*/
