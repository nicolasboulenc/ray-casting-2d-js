"use strict";

window.onload = ()=>{ setup(); };

const App = {
	canvas: null,
	ctx: null,
	light: null,
	walls: null,
	timer: 0,
	frame_count: 0,
	frame_per_seconds: 0
};


function setup() {

	App.canvas = document.getElementById("Canvas");
	App.canvas.onmousemove = mouse_move;
	App.ctx = App.canvas.getContext("2d", {alpha: false});
	App.ctx.fillStyle = "rgb(192, 192, 192)";
	App.ctx.font = "12px Lucida Console";

	App.light = new Light(App.canvas.width / 2, App.canvas.height / 2);
	App.walls = [];

	let offset1 = 300;
	let offset2 = 200;
	App.walls.push( segment(offset1, offset2, offset2, offset1) );
	App.walls.push( segment(App.canvas.width - offset1, offset2, App.canvas.width - offset2, offset1) );
	App.walls.push( segment(App.canvas.width - offset1, App.canvas.height - offset2, App.canvas.width - offset2, App.canvas.height - offset1) );
	App.walls.push( segment(offset1, App.canvas.height - offset2, offset2, App.canvas.height - offset1) );

	requestAnimationFrame(loop);
}

function mouse_move(evt) {

    let rect = App.canvas.getBoundingClientRect();
	App.light.x = evt.clientX - rect.left;
	App.light.y = evt.clientY - rect.top;
}

function loop(timestamp) {

	App.ctx.clearRect(0, 0, App.canvas.width, App.canvas.height);

	draw_walls(App.walls, App.ctx);
	draw_light(App.light, App.walls, App.ctx);

	if( (App.frame_count % 10) === 0 ) {

		const time = performance.now();
		App.frame_per_seconds = Math.round( 1000 / (time - App.timer) * App.frame_count );
		App.timer = time;
		App.frame_count = 0;
	}
	App.ctx.fillText(`FPS: ${App.frame_per_seconds}`, 1, 12);
	App.frame_count++;

	requestAnimationFrame(loop);
}


function draw_walls(walls, ctx) {

	ctx.strokeStyle = 'orange';
	ctx.beginPath();
	
	walls.forEach(wall => {

		ctx.moveTo(wall.ax, wall.ay);
		ctx.lineTo(wall.bx, wall.by);
	});

	ctx.closePath();
    ctx.stroke();
}


function draw_light(light, walls, ctx) {

	ctx.strokeStyle = 'orange';
	ctx.beginPath();

	ctx.arc(light.x, light.y, 10, 0, 2 * Math.PI);

	const rays = light.cast(walls);

	rays.forEach(ray => {

		ctx.moveTo(ray.ax, ray.ay);
		ctx.lineTo(ray.bx, ray.by);
	});

	ctx.closePath();
    ctx.stroke();
}