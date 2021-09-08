"use strict";

window.onload = ()=>{ setup(); };

const App = {
	canvas: null,
	ctx: null,
	lights: null,
	lights_angle: null,
	camera: null,
	walls: null,
	intersections_count: 0,
	timer: 0,
	frame_count: 0,
	frame_per_seconds: 0
};

function setup() {

	App.canvas = document.getElementById("display");
	App.canvas.onmousemove = mouse_move;
	App.ctx = App.canvas.getContext("2d", {alpha: false});

	App.lights = [];
	App.lights_angle = [];
	App.lights.push(new Light(0, 0, 1080, "rgba(255, 127, 0, 0.5)"));
	App.lights_angle.push(0);

	App.lights[0]._x = 300;
	App.lights[0]._y = 300;

	App.camera = new Camera({x: 200, y: 200, angle: Math.PI/4, fov: Math.PI / 180 * 90, near: 10, rays_count: 800});

	load_scene(0);

	requestAnimationFrame(loop);
}

function mouse_move(evt) {

	const rect = App.canvas.getBoundingClientRect();
	const x = evt.clientX - rect.left;
	const y = evt.clientY - rect.top;
	App.lights[0]._x = x;
	App.lights[0]._y = y;
}

function loop(timestamp) {

	//clear canvas
	App.ctx.clearRect(0, 0, App.canvas.width, App.canvas.height);
	draw_scene1(App.lights, App.walls, App.ctx);

	// display fps
	if( (App.frame_count % 10) === 0 ) {

		const time = performance.now();
		App.frame_per_seconds = Math.round( 1000 / (time - App.timer) * App.frame_count );
		App.timer = time;
		App.frame_count = 0;
	}
	document.getElementById('fps').innerHTML = `FPS: ${App.frame_per_seconds} Intersect: ${App.intersections_count}`;
	App.frame_count++;

	requestAnimationFrame(loop);
}


function draw_scene1(lights, walls, ctx) {

	App.intersections_count = 0;


	// update light casting
	walls.forEach(wall => { wall.reset(); });

	lights.forEach(light => {
		light.reset();
		light.cast(walls);
	});

	walls.forEach(wall => {
		wall.process_hits();
	});


	// draw light area
	lights.forEach(light => {

		ctx.fillStyle = light._color;
		ctx.beginPath();

		App.intersections_count += light._hits.length;
		light._hits.forEach((hit, index) => {
			if(index === 0) ctx.moveTo(Math.round(hit.x), Math.round(hit.y));
			ctx.lineTo(Math.round(hit.x), Math.round(hit.y));
		});

		ctx.closePath();
		ctx.fill();
	});


	// draw walls
	ctx.lineWidth = 3;
	walls.forEach((wall) => {

		ctx.strokeStyle = "#333";
		ctx.beginPath();
		ctx.moveTo(wall.ax, wall.ay);
		ctx.lineTo(wall.bx, wall.by);
		ctx.stroke();

		wall.segments.forEach(light_segments => {

			light_segments.forEach(segment => {

				// mix colors
				if(segment.is_lit)
					ctx.strokeStyle = "white";
				else
					ctx.strokeStyle = "#333";

				ctx.beginPath();
				ctx.moveTo(Math.round(segment.ax), Math.round(segment.ay));
				ctx.lineTo(Math.round(segment.bx), Math.round(segment.by));
				ctx.stroke();
			});
		});
	});


	// draw light source
	ctx.lineWidth = 1;
	lights.forEach(light => {

		ctx.strokeStyle = light.color;
		ctx.fillStyle = light.color;
		ctx.lineWidth = 1;

		ctx.beginPath();
		ctx.arc(light.x, light.y, 10, 0, 2 * Math.PI);
		ctx.closePath();
		ctx.fill();
	});
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
}