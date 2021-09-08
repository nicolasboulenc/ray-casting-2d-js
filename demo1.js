"use strict";

window.onload = ()=>{ setup(); };

const App = {
	canvas: null,
	ctx: null,
	debug: null,
	lights: null,
	walls: null,
	intersections_count: 0,
	timer: 0,
	frame_count: 0,
	frame_per_seconds: 0
};


function setup() {

	App.canvas = document.getElementById("Canvas");
	// App.canvas.onmousemove = mouse_move;

	App.debug = document.getElementById("Debug");

	App.ctx = App.canvas.getContext("2d", {alpha: false});
	App.ctx.fillStyle = "rgb(192, 192, 192)";
	App.ctx.font = "12px Lucida Console";

	App.lights = [];
	// App.lights.push(new Light(324, 244, 720, "rgba(255, 127, 0, 0.5)"));
	// App.lights.push(new Light(400, 420, 720, "rgba(0, 127, 255, 0.5)"));

	App.lights.push(new Light(798, 1, 250, "rgba(200, 100, 1, 0.5)"));

	App.lights.push(new Light(1, 1, 250, "rgba(0,0,255, 0.85)"));
	App.lights.push(new Light(798, 1, 250, "rgba(255,0,0, 0.5)"));
	App.lights.push(new Light(798, 798, 250, "rgba(200, 100, 1, 0.5)"));
	App.lights.push(new Light(1, 798, 250, "rgba(200, 100, 1, 0.5)"));

	let scene = 3;

	if(scene === 4 || scene === 1) {
		App.canvas.onmousemove = mouse_move;
	}
	load_scene(scene);

	requestAnimationFrame(loop);
}


function mouse_move(evt) {

	const rect = App.canvas.getBoundingClientRect();
	const x = evt.clientX - rect.left;
	const y = evt.clientY - rect.top;
	App.lights[0]._x = x;
	App.lights[0]._y = y;
	App.debug.innerHTML = `x: ${x}   y: ${y}`;
}


function loop(timestamp) {

	//clear canvas
	App.ctx.clearRect(0, 0, App.canvas.width, App.canvas.height);
	draw(App.lights, App.walls, App.ctx);

	// display fps
	if( (App.frame_count % 10) === 0 ) {

		const time = performance.now();
		App.frame_per_seconds = Math.round( 1000 / (time - App.timer) * App.frame_count );
		App.timer = time;
		App.frame_count = 0;
	}
	App.ctx.fillText(`FPS: ${App.frame_per_seconds} Intersect: ${App.intersections_count}`, 1, 12);
	App.debug.innerHTML = `FPS: ${App.frame_per_seconds} Intersect: ${App.intersections_count}`;
	App.frame_count++;

	requestAnimationFrame(loop);
}


function draw(lights, walls, ctx) {

	App.intersections_count = 0;

	// update light casting
	for(const wall of walls) {
		wall.reset();
	}

	for(const light of lights) {
		light.reset();
		light.cast(walls);
	}

	for(const wall of walls) {
		wall.process_hits();
		// wall.unify_hits();
	}

	// draw light area
	for(const light of lights) {

		ctx.fillStyle = light._color;
		ctx.strokeStyle = light._color;

		// draw light as surface
		ctx.beginPath();
		App.intersections_count += light._hits.length;
		light._hits.forEach((hit, index) => {
			if(index === 0) ctx.moveTo(Math.round(hit.x), Math.round(hit.y));
			ctx.lineTo(Math.round(hit.x), Math.round(hit.y));
		});
		ctx.closePath();
		ctx.fill();

		// draw light as rays
		// for(const hit of light._hits) {
		// 	ctx.beginPath();
		// 	ctx.moveTo(Math.round(light.x), Math.round(light.y));
		// 	ctx.lineTo(Math.round(hit.x), Math.round(hit.y));
		// 	ctx.stroke();
		// }
	}


	// draw walls
	ctx.lineWidth = 3;
	for(const wall of walls) {

		ctx.strokeStyle = "#333";
		// ctx.strokeStyle = "blue";
		ctx.beginPath();
		ctx.moveTo(wall.ax, wall.ay);
		ctx.lineTo(wall.bx, wall.by);
		ctx.stroke();

		for(const light_segments of wall.segments) {

			for(const segment of light_segments) {

				// mix colors
				if(segment.is_lit)
					ctx.strokeStyle = "white";
				else
					ctx.strokeStyle = "#333";
					// ctx.strokeStyle = "red";

				ctx.beginPath();
				ctx.moveTo(Math.round(segment.ax), Math.round(segment.ay));
				ctx.lineTo(Math.round(segment.bx), Math.round(segment.by));
				ctx.stroke();
			}
		}
	}


	// draw light source
	ctx.lineWidth = 1;
	for(const light of lights) {

		ctx.strokeStyle = light._color;
		ctx.fillStyle = light._color;
		ctx.lineWidth = 1;

		ctx.beginPath();
		ctx.arc(light.x, light.y, 10, 0, 2 * Math.PI);
		ctx.closePath();
		ctx.fill();
	}
}


function load_scene(scene) {

	App.walls = [];

	if(scene === 0){

		// 4 walls
		App.walls.push( new Wall(300, 200, 500, 200) );
		App.walls.push( new Wall(500, 200, 500, 220) );
		App.walls.push( new Wall(500, 220, 300, 220) );
		App.walls.push( new Wall(300, 220, 300, 200) );

		App.walls.push( new Wall(App.canvas.width - 220, 300, App.canvas.width - 220, 500) );
		App.walls.push( new Wall(App.canvas.width - 220, 500, App.canvas.width - 200, 500) );
		App.walls.push( new Wall(App.canvas.width - 200, 500, App.canvas.width - 200, 300) );
		App.walls.push( new Wall(App.canvas.width - 200, 300, App.canvas.width - 220, 300) );

		App.walls.push( new Wall(300, App.canvas.height - 220, 500, App.canvas.height - 220) );
		App.walls.push( new Wall(500, App.canvas.height - 220, 500, App.canvas.height - 200) );
		App.walls.push( new Wall(500, App.canvas.height - 200, 300, App.canvas.height - 200) );
		App.walls.push( new Wall(300, App.canvas.height - 200, 300, App.canvas.height - 220) );

		App.walls.push( new Wall(220, 300, 220, 500) );
		App.walls.push( new Wall(220, 500, 200, 500) );
		App.walls.push( new Wall(200, 500, 200, 300) );
		App.walls.push( new Wall(200, 300, 220, 300) );

		// centre square
		App.walls.push( new Wall(400 - 10, 400 - 10, 400 + 10, 400 - 10) );
		App.walls.push( new Wall(400 + 10, 400 - 10, 400 + 10, 400 + 10) );
		App.walls.push( new Wall(400 + 10, 400 + 10, 400 - 10, 400 + 10) );
		App.walls.push( new Wall(400 - 10, 400 + 10, 400 - 10, 400 - 10) );

		// canvas bounds
		App.walls.push( new Wall(0, 0, App.canvas.width, 0) );
		App.walls.push( new Wall(App.canvas.width, 0, App.canvas.width, App.canvas.height) );
		App.walls.push( new Wall(App.canvas.width, App.canvas.height, 0, App.canvas.height) );
		App.walls.push( new Wall(0, App.canvas.height, 0, 0) );
	}
	else if(scene === 1) {

		const dimension = 40;
		const half_dimension = dimension / 2;
		let x = App.canvas.width / 2 - half_dimension;
		let y = dimension;
		while(y < App.canvas.height) {

			App.walls.push( new Wall(x, y, x, y + dimension) );
			App.walls.push( new Wall(x, y + dimension, x + dimension, y + dimension) );
			App.walls.push( new Wall(x + dimension, y + dimension, x + dimension, y) );
			App.walls.push( new Wall(x + dimension, y, x, y) );

			y += dimension * 2;
		}

		// canvas bounds
		App.walls.push( new Wall(0, 0, App.canvas.width, 0) );
		App.walls.push( new Wall(App.canvas.width, 0, App.canvas.width, App.canvas.height) );
		App.walls.push( new Wall(App.canvas.width, App.canvas.height, 0, App.canvas.height) );
		App.walls.push( new Wall(0, App.canvas.height, 0, 0) );
	}
	else if(scene === 2){

		const cw = App.canvas.width;
		const ch = App.canvas.height;
		let ww = 10;

		// canvas bounds
		App.walls.push( new Wall(0,		0,		cw,		0) );
		App.walls.push( new Wall(cw,	0,		cw,		ch) );
		App.walls.push( new Wall(cw,	ch,		0,		ch) );
		App.walls.push( new Wall(0,		ch,		0,		0) );

		// 4 walls
		ww = 200;
		const hx1 = cw / 2 - ww / 2;
		const hx2 = cw / 2 + ww / 2;
		const hy1 = ch / 4;
		const hy2 = ch / 4 * 3;

		const vx1 = cw / 4;
		const vx2 = cw / 4 * 3;
		const vy1 = ch / 2 - ww / 2;
		const vy2 = ch / 2 + ww / 2;

		App.walls.push( new Wall(hx1,	hy1,	hx2,	hy1) );		// top
		App.walls.push( new Wall(vx1,	vy1,	vx1,	vy2) );		// left
		App.walls.push( new Wall(hx1,	hy2,	hx2,	hy2) );		// bottom
		App.walls.push( new Wall(vx2,	vy1,	vx2,	vy2) );		// right

		// centre square
		ww = 20;
		App.walls.push( new Wall(cw / 2 - ww / 2, ch / 2, cw / 2 + ww / 2, ch / 2) );
		App.walls.push( new Wall(cw / 2, ch / 2 - ww / 2, cw / 2, ch / 2 + ww / 2) );
	}
	else if(scene === 3){

		const cw = App.canvas.width;
		const ch = App.canvas.height;
		let ww = 10;

		// canvas bounds
		App.walls.push( new Wall(0,		0,		cw,		0) );

		// 4 walls
		ww = 200;
		const hx1 = cw / 2 - ww / 2;
		const hx2 = cw / 2 + ww / 2;
		const hy1 = ch / 4;

		App.walls.push( new Wall(hx1,	hy1,	hx2,	hy1) );		// top
	}
	else if(scene === 4){

		const dimension = 50;
		const spacing = 70;
		let y = spacing;

		while(y < App.canvas.height - dimension - spacing) {

			let x = spacing;
			while(x < App.canvas.width - dimension - spacing) {

				App.walls.push( new Wall(x, y, x, y + dimension) );
				App.walls.push( new Wall(x, y + dimension, x + dimension, y + dimension) );
				App.walls.push( new Wall(x + dimension, y + dimension, x + dimension, y) );
				App.walls.push( new Wall(x + dimension, y, x, y) );
				x += dimension + spacing;
			}

			y += dimension + spacing;
		}

		// canvas bounds
		App.walls.push( new Wall(0, 0, App.canvas.width, 0) );
		App.walls.push( new Wall(App.canvas.width, 0, App.canvas.width, App.canvas.height) );
		App.walls.push( new Wall(App.canvas.width, App.canvas.height, 0, App.canvas.height) );
		App.walls.push( new Wall(0, App.canvas.height, 0, 0) );
	}
}