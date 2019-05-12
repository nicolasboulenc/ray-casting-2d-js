"use strict";

window.onload = ()=>{ setup(); };

const App = {
	canvas: null,
	ctx: null,
	lights: null,
	light_angle: 0,
	walls: null,
	intersections_count: 0,
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
	
	App.lights = [];
	App.lights.push(new Light(0, 0, 7200, "rgba(255, 127, 0, 0.5)"));
	App.lights.push(new Light(50, 100, 7200, "rgba(255, 127, 0, 0.5)"));

	load_scene2();

	requestAnimationFrame(loop);
}

function mouse_move(evt) {

    let rect = App.canvas.getBoundingClientRect();
	App.lights[0].x = evt.clientX - rect.left;
	App.lights[0].y = evt.clientY - rect.top;
}

function loop(timestamp) {

	//clear canvas
	App.ctx.clearRect(0, 0, App.canvas.width, App.canvas.height);

	if(App.lights.length > 0) {

		let x = App.canvas.width / 2 + Math.cos(App.light_angle) * App.canvas.width / 3;
		let y = App.canvas.height / 2 + Math.sin(App.light_angle) * App.canvas.height / 3;
		App.lights[1].x = x; 
		App.lights[1].y = y;
		App.light_angle += Math.PI * 2 / 200;
	}

	draw_scene(App.lights, App.walls, App.ctx);

	// display fps
	if( (App.frame_count % 10) === 0 ) {

		const time = performance.now();
		App.frame_per_seconds = Math.round( 1000 / (time - App.timer) * App.frame_count );
		App.timer = time;
		App.frame_count = 0;
	}
	App.ctx.fillText(`FPS: ${App.frame_per_seconds} Intersect: ${App.intersections_count}`, 1, 12);
	App.frame_count++;

	requestAnimationFrame(loop);
}

function draw_scene1(lights, walls, ctx) {

	App.walls.forEach(wall => { wall.is_lit = false; });

	// draw light rays
	ctx.strokeStyle = "rgba(255, 165, 0, 0.1)";
	ctx.lineWidth = 12;

	// draw light rays
	lights.forEach(light => {

		const intersections = light.cast(walls);
		intersections.forEach(point => {
			
			ctx.beginPath();
			ctx.moveTo(light.x, light.y);
			ctx.lineTo(point.x, point.y);
			ctx.closePath();
			ctx.stroke();
		});
	});

	// draw walls
	ctx.strokeStyle = "grey";
	ctx.lineWidth = 3;
	ctx.beginPath();
	
	walls.forEach(wall => {

		if(wall.is_lit === true) {
			ctx.moveTo(wall.ax, wall.ay);
			ctx.lineTo(wall.bx, wall.by);			
		}
	});

	ctx.closePath();
    ctx.stroke();


	// draw light source
	lights.forEach(light => {

		ctx.strokeStyle = "rgba(255, 0, 0, 0.5)";
		ctx.fillStyle = "rgba(255, 0, 0, 0.5)";
		ctx.lineWidth = 1;
		
		ctx.beginPath();
		ctx.arc(light.x, light.y, 10, 0, 2 * Math.PI);
		ctx.closePath();
		ctx.fill();

		ctx.stroke();
	});
}


function draw_scene(lights, walls, ctx) {

	App.intersections_count = 0;

	walls.forEach(wall => { 
		wall.is_lit = false; 
		wall.hits = [];
	});

	// draw light rays
	lights.forEach(light => {
		
		ctx.strokeStyle = "grey";
		ctx.fillStyle = light.color;
		ctx.beginPath();
		const intersections = light.cast(walls);
		App.intersections_count += intersections.length;
		intersections.forEach((point, index) => {
			if(index === 0) ctx.moveTo(point.x, point.y);
			ctx.lineTo(point.x, point.y);
		});
		ctx.closePath();
		ctx.fill();
	});

	// draw un-lit walls
	ctx.lineCap = "round";
	ctx.lineWidth = 3;
	ctx.strokeStyle = "rgba(32, 32, 32, 1)";
	ctx.beginPath();
	walls.forEach(wall => {
		ctx.moveTo(wall.ax, wall.ay);
		ctx.lineTo(wall.bx, wall.by);
	});
	ctx.closePath();
	ctx.stroke();


	// draw over lit parts
	ctx.strokeStyle = "grey";

	walls.forEach(wall => { 
		wall.sort_hits();
	});
	
	walls.forEach((wall, index) => {

		ctx.beginPath();

		let hits_index = 0;
		const hits_count = wall.hits.length;
		let prev_lit = null;
		while(hits_index < hits_count) {

			let point = wall.hits[hits_index];

			if(point.is_lit !== prev_lit) {
				ctx.moveTo(point.x, point.y);
				prev_lit = point.is_lit;
			}

			if(point.is_lit === false) 
				ctx.moveTo(point.x, point.y);
			else
				ctx.lineTo(point.x, point.y);

			hits_index++;
		}

		ctx.closePath();
		ctx.stroke();
	});

	// draw light source
	lights.forEach(light => {

		// var gradient = ctx.createRadialGradient(light.x, light.y, 0, light.x, light.y, 10);
		// gradient.addColorStop(0, "white");
		// gradient.addColorStop(1, "rgba(255, 165, 0, 1)");
		// ctx.fillStyle = gradient;
		ctx.strokeStyle = light.color;
		ctx.fillStyle = light.color;
		ctx.lineWidth = 1;

		ctx.beginPath();
		ctx.arc(light.x, light.y, 10, 0, 2 * Math.PI);
		ctx.closePath();
		ctx.fill();
	});
}

function load_scene1() {

	App.walls = [];

	// 4 walls
	App.walls.push( new Wall(300, 200, 500, 200) );
	App.walls.push( new Wall(500, 200, 500, 220) );
	App.walls.push( new Wall(500, 220, 300, 220) );
	App.walls.push( new Wall(300, 220, 300, 200) );

	App.walls.push( new Wall(App.canvas.width - 200, 300, App.canvas.width - 200, 500) );
	App.walls.push( new Wall(App.canvas.width - 200, 500, App.canvas.width - 180, 500) );
	App.walls.push( new Wall(App.canvas.width - 180, 500, App.canvas.width - 180, 300) );
	App.walls.push( new Wall(App.canvas.width - 180, 300, App.canvas.width - 200, 300) );

	App.walls.push( new Wall(300, App.canvas.height - 200, 500, App.canvas.height - 200) );
	App.walls.push( new Wall(500, App.canvas.height - 200, 500, App.canvas.height - 180) );
	App.walls.push( new Wall(500, App.canvas.height - 180, 300, App.canvas.height - 180) );
	App.walls.push( new Wall(300, App.canvas.height - 180, 300, App.canvas.height - 200) );

	App.walls.push( new Wall(200, 300, 200, 500) );
	App.walls.push( new Wall(200, 500, 180, 500) );
	App.walls.push( new Wall(180, 500, 180, 300) );
	App.walls.push( new Wall(180, 300, 200, 300) );

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



function load_scene2() {

	App.walls = [];

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