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
		if (pow == 'w') {
				return 'b';
		}
		return 'w';
}

function grid_pos(y1, y2, x1, x2){
	const strides = the_game.spec.straight_strides;
    return y1 * strides[3] + y2 * strides[2] + x1 * strides[1] + x2;
}

function pos_coords(the_game, pos){ // most significant to least significant
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

function get_captures(spec, grid, pos, pom) {
	const captures = [];
	const ng = [...grid];
	if (grid[pos] != '') {
		return [captures, ng]; //occupied
	}
		//this.straight_strides.forEach((element) => this.grid[piece0 + element] = 'b');
    getAllStrideSums(spec.straight_strides).forEach((stride) =>{
		let dpc = 0; //direction possible captures
		let pos1 = pos;
		while (pos1 >= 0 && pos1 < spec.total){
			if (grid[pos1] == pom){
				if (dpc > 0){
					captures.push([stride, dpc]);
					for (let i = 1; i<= dpc; i++){
						ng[stride * i] = pom;
					}
				}
				break;
			} else if (grid[pos1] == other_player(pom)){
				dbc++;
			} else {
				break;
			}
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
		this.spec = new Spec(size);
		this.grid = Array(size * size * size * size).fill('');
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
	toggle_pom() {
		this.pom = other_player(this.pom);
	}

}


/* drawing the canvas */
const canvas = document.getElementById('the_canvas');
//const mode = document.getElementById("frm").elements["mode"].value;
const mode = 'PVP';
let the_game = new GameState(mode, 6);

const pb = 6; // boundary between planes
const sqb = 2; // boundary between squares
const sqs = 16; //square size
const diskr = 7; // radius

const square_boundary_color = "black";
const square_color = "forestgreen";
const plane_boundary_color = "dodgerblue";
const win_color = "crimson";
const last_move_color = "gold";

function get_disk_center(the_game, pos){
	coords = pos_coords(the_game, pos);
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
	console.log("handle_canvas_click", pos);
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
            const coords = pos_coords(the_game, ii);
            const disk_center = get_disk_center(the_game, ii);
            ctx.fillStyle = the_game.grid[ii] == 'w' ? 'white' : 'black';
			circle(ctx, disk_center[0], disk_center[1], diskr);
            // console.log("coords", coords,"color", the_game.grid[ii]);
        }
    }

}
canvas.onclick = handle_canvas_click;
redraw_canvas();
