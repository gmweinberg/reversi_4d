const sumArray= (numbers) => numbers.reduce((acc, curr) => acc + curr, 0);
function other_player(pom){
		if (pow == 'w') {
				return 'b';
		}
		return 'w';
}

function grid_pos(straight_strides, y1, y2, x1, x2){
    return y1 * straight_strides[3] + y2 * straight_strides[2] + x1 * straight_strides[1] + x2;
}

function pos_coords(the_game, pos){ // most significant to least significant
	const strides = the_game.straight_strides;
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


class GameState {
		constructor(mode, size){
			this.size = size;
			this.grid = Array(size * size * size * size).fill('');
			this.straight_strides = [1, size, size * size, size * size * size];
			const strides = this.straight_strides;
			// put in initial pieces
			const piece0 = sumArray(strides) * (size / 2 - 1);
			this.grid[piece0] = 'w';
			this.straight_strides.forEach((element) => this.grid[piece0 + element] = 'b');
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
    const ps = pb + (the_game.size) * sqs + (the_game.size + 1) * sqb; // plane size
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


function redraw_canvas(){
    console.log("Called redraw_canvas", Math.random());
	const gs = the_game.size
	const cw = pb * (gs + 1) + sqb * (gs + 1) * gs + sqs * gs * gs;
	canvas.width = cw;
	canvas.height = cw;
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
            console.log("coords", coords,"color", the_game.grid[ii]);
        }
    }

}

redraw_canvas();
