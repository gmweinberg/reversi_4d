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
// Find all captures that can be made by placing a disk at the specified position.
// captures are specied by a list of tupls (direction, length)
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
		let pos1 = pos + stride;
		while (pos1 >= 0 && pos1 < spec.total){
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
			pos1 += stride;
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
	constructor(mode, size){
		this.mode = mode;
		this.done = false;
		this.winner = null;
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
	}
	append_move(pos, captures, new_grid) {
		this.last_move = pos;
		this.last_captures = captures;
		this.moves.push[pos, captures];
		this.grid = new_grid;
		the_game.toggle_pom();
		let net = 0;
		let done = true;
		for (let ii=0; ii < the_game.spec.total; ii++){
			if (the_game.grid[ii] == ''){
				done = false;
				break;
			}
			if (the_game.grid[ii] == 'w'){
				net += 1;
			} else {
				net -= 1;
			}
		}
		if (done){
			this.done = true;
			if (net > 0){
				this.winner = 'w';
			} else if (net < 0) {
				this.winner =  'b';
			} else {
				this.winner = 'cat';
			}
		}
	}
	toggle_pom() {
		this.pom = other_player(this.pom);
	}

}

/* drawing the canvas */
const canvas = document.getElementById('the_canvas');
//const mode = document.getElementById("frm").elements["mode"].value;
let the_game;

const pb = 6; // boundary between planes
const sqb = 2; // boundary between squares
const sqs = 16; //square size
const diskr = 7; // radius

const square_boundary_color = "black";
const square_color = "forestgreen";
const plane_boundary_color = "dodgerblue";
const win_color = "crimson";
const last_move_color = "gold";

function get_disk_center(pos){
	coords = get_pos_coords(pos);
	let [y1, y2, x1, x2] = coords;
    const ps = pb + (the_game.spec.size) * sqs + (the_game.spec.size + 1) * sqb; // plane size
    const x = pb + sqb + sqs / 2 + x1 * ps + (sqs + sqb) * x2;
    const y = pb + sqb + sqs / 2 + y1 * ps + (sqs + sqb) * y2;
	//console.log('get_disk_center', pos, coords, x, y);
    return [x, y];

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
    if (the_game.mode == 'cvc'){
            return;
    }
    pos = get_click_square(e);
	const [captures, ng] = get_captures(the_game.grid, pos, the_game.pom);
	if (captures.length === 0){
		console.log("illegal move");
		return;
	}
	console.log("captures", captures);
	the_game.append_move(pos, captures, ng); 
	redraw_canvas();
	if (the_game.done) return;
	if (the_game.mode == 'pvc'){
			do_computer_move();
			redraw_canvas();
	}

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
/* score the grod from white's point of view */
function score_grid(grid) {
	let total = 0;
	for (let ii = 0; ii < the_game.spec.total; ii++){
		if (grid[ii] == 'w'){
			total += score_pos(ii);
		} else if (grid[ii] == 'b'){
			total -= score_pos[ii]; 
		} // no score if unoccupied
	}
	return total;
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
		them_min = 2000000; 
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
	console.log("tc", tc);
    return maxpos;

}

function resolveAfter20ms() {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve('resolved');
    }, 20);
  });
}

async function do_computer_move(){
	console.log("computer moving");
	the_game.computer_moving = true;
	await resolveAfter20ms();
	//const computer_move = get_random_move(the_game.grid, the_game.pom);
	const computer_move = get_2ply_move(the_game.grid, the_game.pom); // computer_move is just pos
	const [captures, ng] = get_captures(the_game.grid, computer_move, the_game.pom);
	console.log("got computer move", computer_move, captures);
	the_game.append_move(computer_move, captures, ng);
	the_game.computer_moving = false;
	console.log("computer moved", computer_move);
	redraw_canvas();
	if (the_game.mode == 'cvc'){
			if (!the_game.done) {
					setTimeout(do_computer_move, 1000);
			}
	}
}



function handle_new_game(){
        const mode = document.getElementById("frm").elements["mode"].value;
        const size = parseInt(document.getElementById("frm").elements["size"].value);
        console.log("new game", mode);
        the_game = new GameState(mode, size);
        if (mode == "pvc"){
            const player_color =  document.getElementById("frm").elements["color"].value;
            if (player_color == 'b'){
                    console.log("doing computer move.");
                    do_computer_move();
            }
        } else if (mode == "cvc"){
			console.log("not yet supported");
            //do_computer_move();
        }
        redraw_canvas();
}

function redraw_canvas(){
    console.log("Called redraw_canvas", Math.random());
	const gs = the_game.spec.size
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
}
document.getElementById('btn_new_game').onclick = handle_new_game;
canvas.onclick = handle_canvas_click;
handle_new_game();
redraw_canvas();
