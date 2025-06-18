const sumArray= (numbers) => numbers.reduce((acc, curr) => acc + curr, 0);

function getAllStrideSums(strides) {
    const results = [];

    // For each subset size (1 through n elements)
    for (let size = 1; size <= strides.length; size++) {
        // Get all combinations of that size
        const combinations = getCombinations(strides, size);

        // For each combination, generate all possible sign combinations
        combinations.forEach(combo => {
            const signCombinations = getAllSignCombinations(combo.length);

            signCombinations.forEach(signs => {
                const sum = combo.reduce((acc, val, i) => acc + (signs[i] * val), 0);
                results.push(sum);
            });
        });
    }

    return results;
}

// Generate all possible combinations of +1 and -1 for n positions
function getAllSignCombinations(n) {
    const results = [];
    const totalCombinations = Math.pow(2, n);

    for (let i = 0; i < totalCombinations; i++) {
        const signs = [];
        for (let j = 0; j < n; j++) {
            // Use bit manipulation to determine sign
            signs.push((i & (1 << j)) ? -1 : 1);
        }
        results.push(signs);
    }

    return results;
}
// Helper function to get all combinations of size k from array
function getCombinations(arr, k) {
    if (k === 1) return arr.map(x => [x]);
    if (k === arr.length) return [arr];

    const combinations = [];

    for (let i = 0; i <= arr.length - k; i++) {
        const first = arr[i];
        const rest = getCombinations(arr.slice(i + 1), k - 1);
        rest.forEach(combo => combinations.push([first, ...combo]));
    }

    return combinations;
}

function other_player(pom){
		if (pom == 'w') {
				return 'b';
		}
		return 'w';
}

function grid_pos(y1, y2, x1, x2){
	const strides = the_game.spec.straight_strides;
    return y1 * strides[3] + y2 * strides[2] + x1 * strides[1] + x2;
}

function get_pos_coords(pos){ // most significant to least significant
	const strides = the_game.spec.straight_strides;
    let x1, x2, y1, y2;
    y1 = Math.floor(pos/strides[3]);
    pos -= y1 * strides[3];
    y2 = Math.floor(pos / strides[2]);
    pos -= y2 * strides[2];
    x1 = Math.floor(pos / strides[1]);
    pos -= x1 * strides[1];
    x2 = pos;
    return [y1, y2, x1, x2];
}

// helper function to make sure strides don't wrap coords across boundaries. That is,
// a coord which is increasing with a stride must not decrease with 2 or more strides.

function coords_no_wrap(pos, stride, steps){
	const size = the_game.spec.size;
    const pos_coords = get_pos_coords(pos);
    const stride_coords = get_pos_coords(stride);
    for (let ii =1; ii < pos_coords.length; ii++){
        if (stride_coords[ii] === 1 && pos_coords[ii] + steps === size) return false;
        if (stride_coords[ii] === -1 && steps > size) return false;
    }
    return true;
}



// Find all captures that can be made by placing a disk at the specified position.
// captures are specied by a list of tuplies (direction, length)
// return the list and a new grid with the captures made. 
// If there are no captures (or the square is occupied) the move is illegal.

function get_captures(grid, pos, pom) {
	const spec = the_game.spec;
	const captures = [];
	const ng = [...grid];
	if (grid[pos] != '') {
		return [captures, ng]; //occupied
	}
		//this.straight_strides.forEach((element) => this.grid[piece0 + element] = 'b');
	ng[pos] = pom;
    getAllStrideSums(spec.straight_strides).forEach((stride) =>{
		let dpc = 0; //direction possible captures
		let steps = 1;
		//let pos1 = pos + stride;
        while (coords_no_wrap(pos, stride, steps)){
			const pos1 = pos + stride * steps;
		//while (pos1 >= 0 && pos1 < spec.total){
			if (grid[pos1] == pom){
				if (dpc > 0){
					captures.push([stride, dpc]);
					for (let i = 1; i<= dpc; i++){
						ng[pos + stride * i] = pom;
					}
				}
				break;
			} else if (grid[pos1] == other_player(pom)){
				dpc++;
			} else {
				break;
			}
			steps += 1;
			//pos1 += stride;
		}
	});
	return [captures, ng];
}

class Spec {
    constructor(size){
        this.size = size; //along one axis
        this.total = Math.pow(size, 4);
        this.straight_strides = [1, size, size * size, size * size * size];
	}
}

class GameState {
	constructor(size, black_player, white_player){
		this.black_player = black_player;
		this.white_player = white_player
		this.done = false;
		this.winner = null;
		this.toroid = null;
		this.spec = new Spec(size);
		this.grid = Array(size * size * size * size).fill('');
		this.last_move = -1;
		this.last_captures = [];
		const strides = this.spec.straight_strides;
		// put in initial pieces
		const piece0 = sumArray(strides) * (size / 2 - 1);
		this.grid[piece0] = 'w';
		strides.forEach((element) => this.grid[piece0 + element] = 'b');
		this.grid[piece0 + strides[0] + strides[1]] = 'w';
		this.grid[piece0 + strides[0] + strides[2]] = 'w';
		this.grid[piece0 + strides[0] + strides[3]] = 'w';
		this.grid[piece0 + strides[1] + strides[2]] = 'w';
		this.grid[piece0 + strides[1] + strides[3]] = 'w';
		this.grid[piece0 + strides[2] + strides[3]] = 'w';
		this.grid[piece0 + sumArray(strides)] = 'w';
		this.grid[piece0 + strides[0] + strides[1] + strides[2]] = 'b';
		this.grid[piece0 + strides[0] + strides[1] + strides[3]] = 'b';
		this.grid[piece0 + strides[0] + strides[2] + strides[3]] = 'b';
		this.grid[piece0 + strides[1] + strides[2] + strides[3]] = 'b';

		this.moves = [];
		this.pom = 'w';
		this.check_scores();
	}
	check_scores(){
		this.white = 0;
		this.black = 0;
		let net = 0;
		this.done = true;
		for (let ii=0; ii < this.spec.total; ii++){
			if (this.grid[ii] == ''){
				this.done = false;
			}
			if (this.grid[ii] == 'w'){
				this.white += 1;
			}
			if (this.grid[ii] == 'b'){
				this.black += 1;
			}
		}
		if (this.black === 0 || this.white === 0){
			this.done = true;
		}
		if (this.done){
			if (net > 0){
				this.winner = 'w';
			} else if (net < 0) {
				this.winner =  'b';
			} else {
				this.winner = 'cat';
			}
		}

	}
	append_move(pos, captures, new_grid) {
		this.last_move = pos;
		this.last_captures = captures;
		this.moves.push[pos, captures];
		this.grid = new_grid;
		this.toggle_pom();
		this.check_scores();

	}
	toggle_pom() {
		this.pom = other_player(this.pom);
	}

}

/* drawing the canvas */
const canvas = document.getElementById('the_canvas');
let the_game;

const pb = 6; // boundary between planes
const sqb = 2; // boundary between squares
const sqs = 16; //square size
const diskr = 7; // radius

const square_boundary_color = "black";
const square_color = "forestgreen";
const hint_square_color = "palegreen";
const plane_boundary_color = "dodgerblue";
const last_move_color = "gold";


function get_square_corner(pos){
	coords = get_pos_coords(pos);
	let [y1, y2, x1, x2] = coords;
    const ps = pb + (the_game.spec.size) * sqs + (the_game.spec.size + 1) * sqb; // plane size
    const x = pb + sqb + x1 * ps + (sqs + sqb) * x2;
    const y = pb + sqb + + y1 * ps + (sqs + sqb) * y2;
    return [x, y];
}

function get_disk_center(pos){
	let [x, y] = get_square_corner(pos);
	return [x + sqs/2, y + sqs / 2];
}

function circle(ctx, x, y, r){
	//console.log('circle', x, y, r);
	ctx.beginPath();
	ctx.arc(x, y, r, 0, 2 * Math.PI);
	ctx.fill();
}

/* find the 4 d coords of a click event if it corresponds to a square. returns the grid pos
 * or -1 */

function get_click_square(e) {
    const ps = pb + the_game.spec.size * sqs + (the_game.spec.size + 1) * sqb; // plane size
    const rect = canvas.getBoundingClientRect();
    const canX = Math.floor(e.clientX - rect.left);
    const canY = Math.floor(e.clientY - rect.top);
    const planeX = Math.floor(canX / ps);
    const planeY = Math.floor(canY / ps);
    const relX = canX - (planeX * ps + pb);
    const relY = canY - (planeY * ps + pb);
    // console.log("relX", relX, "relY", relY);
    if (relX < 0) {
            return -1;
    }
    if (relY < 0) {
            return -1;
    }
    const sqX = Math.floor(relX / (sqb + sqs));
    const sqY = Math.floor(relY / (sqb + sqs));
    const pos =  grid_pos( planeY, sqY, planeX, sqX);
    // console.log("coords", planeX, sqX, planeY, sqY, pos);
    return pos;
}

function handle_canvas_click(e) {
    if (the_game.done) {
            return;
    }
    if (the_game.computer_moving){
            return;
    }
    pos = get_click_square(e);
	const [captures, ng] = get_captures(the_game.grid, pos, the_game.pom);
	if (captures.length === 0){
		console.log("illegal move");
		return;
	}
	//console.log("captures", captures);
	the_game.append_move(pos, captures, ng); 
	redraw_canvas();
	if (the_game.done) return;
	maybe_computer_move();

	// console.log("handle_canvas_click", pos);
}
/* evaluation score for a particular square. For now we score extra for the
 * 16 corners and everything else is the same
 */
function score_pos(pos) {
	const pos_coords = get_pos_coords(pos);
	if (pos_coords.every(elm => elm === 0 || elm === the_game.spec.size)){
		return 20;
	}
	return 1;
}
/* score the grid from white's point of view */
function score_grid(grid) {
	let total = 0;
	for (let ii = 0; ii < the_game.spec.total; ii++){
		if (grid[ii] == 'w'){
			total += score_pos(ii);
		} else if (grid[ii] == 'b'){
			total -= score_pos(ii); 
		} // no score if unoccupied
	}
	return total + Math.random();
}

function get_2ply_move(grid, pom){
	const them = other_player(pom);
	let alpha = -20000000000;  
	let maxpos;
	let them_min;
	let ascore;
	let tc;
	for (let ii = 0; ii < the_game.spec.total; ii++){
		// const [captures, ng] = get_captures(the_game.grid, pos, the_game.pom);
		const [captures1, ng1] = get_captures(grid, ii, pom);
		if (captures1.length===0) {
			continue;
		}
		them_min = -2000000; 
		for (let iii = 0; iii < the_game.spec.total; iii++){
			const [captures2, ng2] = get_captures(ng1, iii, them);
			if (captures2.length === 0){
				continue;
			}
			ascore = score_grid(ng2);
			if (pom === 'w'){
				ascore *= -1;
			}
			if (ascore > them_min){
				them_min = ascore;
			}
			if (ascore < alpha){
				continue;
			} 
		}
		if (them_min > alpha){
			alpha = them_min;
			maxpos = ii;
			tc = captures1;
		}
	}
	// console.log("tc", tc, "alpha", alpha);
    return maxpos;

}

function resolveAfter20ms() {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve('resolved');
    }, 20);
  });
}

function maybe_computer_move(){
	if (the_game.pom === "w"){
		if (the_game.white_player != "human") {
			 setTimeout(do_computer_move, 1000);
		}
	} else if (the_game.pom === "b") {
		if (the_game.black_player != "human") {
			 setTimeout(do_computer_move, 1000);
		}
	}
}

async function do_computer_move(){
	console.log("computer moving", the_game.pom, the_game.white_player, the_game.black_player);
	the_game.computer_moving = true;
	await resolveAfter20ms();
	//const computer_move = get_random_move(the_game.grid, the_game.pom);
	const computer_move = get_2ply_move(the_game.grid, the_game.pom); // computer_move is just pos
	const [captures, ng] = get_captures(the_game.grid, computer_move, the_game.pom);
	// console.log("got computer move", computer_move, captures);
	the_game.append_move(computer_move, captures, ng);
	the_game.computer_moving = false;
	// console.log("computer moved", computer_move);
	redraw_canvas();
	maybe_computer_move();
}

function should_show_hints(){
	return document.getElementById("frm").elements["hint"].checked;
}

function handle_toroid(){
	the_game.toroid =  document.getElementById("frm").elements["toroid"].checked;
}

function handle_mode_change(){
	the_game.black_player = document.getElementById("frm").elements["black_player"].value;
	the_game.white_player = document.getElementById("frm").elements["white_player"].value;
	console.log("handle_mode_change", the_game.white_player, the_game.black_player);
	maybe_computer_move();
}

function handle_new_game(){
        const black_player = document.getElementById("frm").elements["black_player"].value;
        const white_player = document.getElementById("frm").elements["white_player"].value;
        const size = parseInt(document.getElementById("frm").elements["size"].value);
        // console.log("new game");
        the_game = new GameState(size, black_player, white_player);
	    handle_toroid;
	    redraw_canvas();
	    maybe_computer_move();
}

function redraw_canvas(){
    console.log("Called redraw_canvas", Math.random());
	const gs = the_game.spec.size;
	const tot = the_game.spec.total;
	const cw = pb * (gs + 1) + sqb * (gs + 1) * gs + sqs * gs * gs;
	canvas.width = cw;
	canvas.height = cw;
	// console.log("cw", cw);
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = square_color;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    let ii, iii;
    let x, y;
    ctx.fillStyle = square_boundary_color;
    for (ii = 0; ii < gs + 1; ii++){
            for (iii = 0; iii < gs + 1; iii++){
                    x = pb + ii * (pb + sqs * gs + sqb * (gs + 1)) + iii * (sqb + sqs);
                    ctx.fillRect(x, 0, sqb, canvas.height);
                    y = pb + ii * (pb + sqs * gs + sqb * (gs + 1)) + iii * (sqb + sqs);
                    ctx.fillRect(0, y, canvas.width, sqb);
            }
    }
    ctx.fillStyle = plane_boundary_color;
    for (ii = 0; ii < gs + 1; ii++){
        x = ii * (pb + sqs * gs + sqb * (gs + 1));
        ctx.fillRect(x, 0, pb, canvas.height);
        y = ii * (pb + sqs * gs + sqb * (gs + 1));
        ctx.fillRect(0, y, canvas.width, pb);
    }
	if (should_show_hints()){
		ctx.fillStyle = hint_square_color;
		for (ii= 0; ii < tot; ii++){
	        const [captures1, ng1] = get_captures(the_game.grid, ii, the_game.pom);
            if (captures1.length===0) {
                continue;
            }
			const [sqx, sqy] = get_square_corner(ii);
			ctx.fillRect(sqx, sqy, sqs, sqs);
	    }
	}
    // disks
    ctx.fillStyle = square_boundary_color;
    for (ii = 0; ii < Math.pow(gs, 4) ; ii++){
        if (the_game.grid[ii] != ''){
            const coords = get_pos_coords(the_game, ii);
            const disk_center = get_disk_center(ii);
            ctx.fillStyle = the_game.grid[ii] == 'w' ? 'white' : 'black';
			circle(ctx, disk_center[0], disk_center[1], diskr);
            // console.log("coords", coords,"color", the_game.grid[ii]);
        }
    }
	if (the_game.last_move >= 0){
		ctx.fillStyle = the_game.pom == 'w' ? 'darkslategray': 'gainsboro';
		let disk_center = get_disk_center(the_game.last_move);
		circle(ctx, disk_center[0], disk_center[1], diskr);
		the_game.last_captures.forEach(capture => {
			for (ii = 1; ii <= capture[1]; ii++){
				disk_center = get_disk_center(the_game.last_move + ii * capture[0]);
				circle(ctx, disk_center[0], disk_center[1], diskr);
			}
		});
	}
	let score_text = "white: " + the_game.white + " black: " + the_game.black;
	if (the_game.done){
		if (the_game.winner === "w"){
			score_text += " white won!";
		} else if (the_game.winner === "b") {
			score_text += " black won!";
		} else {
			score_text += " cat's game!";
		}
	}
	document.getElementById("winner").innerHTML=score_text;
}
document.getElementById('btn_new_game').onclick = handle_new_game;
canvas.onclick = handle_canvas_click;
handle_new_game();
redraw_canvas();
