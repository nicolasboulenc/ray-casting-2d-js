"use strict";

window.onload = ()=>{ setup(); };

const App = {
	canvas: null,
	canvas2: null,
	ctx: null,
	ctx2: null,
	lights: null,
	light_angle: 0,
	camera: null,
	walls: null,
	intersections_count: 0,
	controls: null,
	timer: 0,
	frame_count: 0,
	frame_per_seconds: 0
};


function setup() {

	App.canvas = document.getElementById("Canvas");
	App.canvas2 = document.getElementById("Canvas2");

	App.canvas.onmousemove = mouse_move;
	App.canvas2.onmousemove = mouse_move2;

	App.ctx = App.canvas.getContext("2d", {alpha: false});
	App.ctx.fillStyle = "rgb(192, 192, 192)";
	App.ctx.font = "12px Lucida Console";

	App.ctx2 = App.canvas2.getContext("2d", {alpha: false});
	App.ctx2.fillStyle = "rgb(64, 64, 64)";
	App.ctx2.font = "12px Lucida Console";


	App.lights = [];
	App.lights.push(new Light(0, 0, 720, "rgba(255, 127, 0, 0.5)"));
	// App.lights.push(new Light(50, 100, 720, "rgba(255, 127, 0, 0.5)"));
	App.camera = new Camera({x: 200, y: 200, angle: Math.PI/4, fov: Math.PI / 180 * 90, near: 10, rays_count: 800});

	App.draw_func = draw_scene2b;

	document.getElementById("Draw1").onclick = (evt) => { App.draw_func = draw_scene1 };
	document.getElementById("Draw2").onclick = (evt) => { App.draw_func = draw_scene2 };
	document.getElementById("Draw3").onclick = (evt) => { App.draw_func = draw_scene3 };

	App.controls = { "w": false, "a": false, "s": false, "d": false, prev_x: App.canvas2.width/2, prev_y: 0 };
	document.onkeydown = key_down;
	document.onkeyup = key_up;

	load_scene(0);

	requestAnimationFrame(loop);
}


function mouse_move(evt) {

	const rect = App.canvas.getBoundingClientRect();
	const x = evt.clientX - rect.left;
	const y = evt.clientY - rect.top;
	// App.camera.look_at(x, y);
	App.lights[0].x = x;
	App.lights[0].y = y;
}

function mouse_move2(evt) {

	const rect = App.canvas2.getBoundingClientRect();
	const x = evt.clientX - rect.left;
	const y = evt.clientY - rect.top;
	const dx = x - App.controls.prev_x;
	const angle = dx / App.canvas2.width * 180;
	App.camera.set_angle(angle);
	// App.camera.look_at(x, y);
	App.controls.prev_x = x;
	App.controls.prev_y = y;
}

function key_down(evt) {

	if(evt.key === "w" || evt.key === "a" || evt.key === "s" || evt.key === "d") {
		App.controls[evt.key] = true;
	}
}

function key_up(evt) {

	if(evt.key === "w" || evt.key === "a" || evt.key === "s" || evt.key === "d") {
		App.controls[evt.key] = false;
	}
}

function loop(timestamp) {

	//update
	if(App.controls.w === true) { App.camera.move_forward(); }
	if(App.controls.a === true) { App.camera.move_left(); }
	if(App.controls.s === true) { App.camera.move_backward(); }
	if(App.controls.d === true) { App.camera.move_right(); }

	// if(App.lights.length > 1) {
	// 	let x = App.canvas.width / 2 + Math.cos(App.light_angle) * App.canvas.width / 3;
	// 	let y = App.canvas.height / 2 + Math.sin(App.light_angle) * App.canvas.height / 3;
	// 	App.lights[1].x = x; 
	// 	App.lights[1].y = y;
	// 	App.light_angle += Math.PI * 2 / 200;
	// }


	//clear canvas
	App.ctx.clearRect(0, 0, App.canvas.width, App.canvas.height);
	App.draw_func(App.lights, App.walls, App.camera, App.ctx);

	App.ctx2.clearRect(0, 0, App.canvas2.width, App.canvas2.height);
	draw3d(App.lights, App.walls, App.camera, App.ctx2);

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



/*
	Draw the scene using individual lines par ray with alpha which gives a soft effect
*/
function draw_scene1(lights, walls, camera, ctx) {

	App.walls.forEach(wall => { wall.is_lit = false; });

	// draw light rays
	lights.forEach(light => {
		
		ctx.strokeStyle = light.color;
		ctx.lineWidth = 12;
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


function draw_scene2(lights, walls, camera, ctx) {

	App.intersections_count = 0;

	walls.forEach(wall => { 
		wall.is_lit = false; 
		wall.hits = [];
		wall.lights = [];
	});

	// draw light rays
	lights.forEach(light => {
		
		ctx.fillStyle = light.color;
		ctx.beginPath();

		const intersections = light.cast(walls);
		App.intersections_count += intersections.length;
		intersections.forEach((point, index) => {
			if(index === 0) ctx.moveTo(Math.round(point.x), Math.round(point.y));
			ctx.lineTo(Math.round(point.x), Math.round(point.y));
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
		ctx.moveTo(Math.round(wall.ax), Math.round(wall.ay));
		ctx.lineTo(Math.round(wall.bx), Math.round(wall.by));
	});
	ctx.closePath();
	ctx.stroke();


	// draw over lit parts
	ctx.strokeStyle = "grey";

	walls.forEach(wall => { 
		wall.process_hits();
	});
	
	walls.forEach((wall, index) => {

		ctx.beginPath();
		wall.hits.forEach(light_hits => {

			let hits_index = 0;
			const hits_count = light_hits.length;
			let prev_lit = null;
			while(hits_index < hits_count) {
	
				let point = light_hits[hits_index];
	
				if(point.is_lit !== prev_lit) {
					ctx.moveTo(Math.round(point.x), Math.round(point.y));
					prev_lit = point.is_lit;
				}
	
				if(point.is_lit === false) 
					ctx.moveTo(Math.round(point.x), Math.round(point.y));
				else
					ctx.lineTo(Math.round(point.x), Math.round(point.y));
	
				hits_index++;
			}
		});
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

	// draw camera
	// ctx.strokeStyle = "white";
	// ctx.fillStyle = "white";
	// ctx.lineWidth = 1;

	// ctx.beginPath();
	// ctx.arc(camera.x, camera.y, 10, 0, 2 * Math.PI);
	// ctx.fill();

	// let mag = camera.near / Math.cos(camera.fov / 2);
	// mag = 200;
	// let ax = camera.x + Math.cos(camera.angle - camera.fov / 2) * mag;
	// let ay = camera.y + Math.sin(camera.angle - camera.fov / 2) * mag;
	// let bx = camera.x + Math.cos(camera.angle + camera.fov / 2) * mag;
	// let by = camera.y + Math.sin(camera.angle + camera.fov / 2) * mag;
	// ctx.moveTo(camera.x, camera.y);
	// ctx.lineTo(ax, ay);
	// ctx.lineTo(bx, by);
	// ctx.lineTo(camera.x, camera.y);
	// ctx.stroke();

	// ctx.strokeStyle = "grey";
	// ctx.beginPath();
	// // draw camera rays
	// camera.rays.forEach(ray => {
	// 	ctx.moveTo(camera.x, camera.y);
	// 	ctx.lineTo(camera.x + ray.direction_x * 500, camera.y + ray.direction_y * 500);
	// });
	// ctx.stroke();
}


function draw_scene2b(lights, walls, camera, ctx) {

	App.intersections_count = 0;

	walls.forEach(wall => { wall.reset(); });

	lights.forEach(light => { 
		light.reset(); 
		light.cast();
	});

	// draw light rays
	lights.forEach(light => {
		
		ctx.fillStyle = light.color;
		ctx.beginPath();

		
		const intersections = light.cast(walls);
		App.intersections_count += intersections.length;
		intersections.forEach((point, index) => {
			if(index === 0) ctx.moveTo(Math.round(point.x), Math.round(point.y));
			ctx.lineTo(Math.round(point.x), Math.round(point.y));
		});
		
		ctx.closePath();
		ctx.fill();
	});
	
	// draw over lit parts
	ctx.strokeStyle = "grey";

	walls.forEach(wall => { 
		wall.process_hits();
	});
	
	walls.forEach((wall, index) => {

		ctx.beginPath();
		wall.hits.forEach(light_hits => {

			let hits_index = 0;
			const hits_count = light_hits.length;
			let prev_lit = null;
			while(hits_index < hits_count) {
	
				let point = light_hits[hits_index];
	
				if(point.is_lit !== prev_lit) {
					ctx.moveTo(Math.round(point.x), Math.round(point.y));
					prev_lit = point.is_lit;
				}
	
				if(point.is_lit === false) 
					ctx.moveTo(Math.round(point.x), Math.round(point.y));
				else
					ctx.lineTo(Math.round(point.x), Math.round(point.y));
	
				hits_index++;
			}
		});
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

	// draw camera
	// ctx.strokeStyle = "white";
	// ctx.fillStyle = "white";
	// ctx.lineWidth = 1;

	// ctx.beginPath();
	// ctx.arc(camera.x, camera.y, 10, 0, 2 * Math.PI);
	// ctx.fill();

	// let mag = camera.near / Math.cos(camera.fov / 2);
	// mag = 200;
	// let ax = camera.x + Math.cos(camera.angle - camera.fov / 2) * mag;
	// let ay = camera.y + Math.sin(camera.angle - camera.fov / 2) * mag;
	// let bx = camera.x + Math.cos(camera.angle + camera.fov / 2) * mag;
	// let by = camera.y + Math.sin(camera.angle + camera.fov / 2) * mag;
	// ctx.moveTo(camera.x, camera.y);
	// ctx.lineTo(ax, ay);
	// ctx.lineTo(bx, by);
	// ctx.lineTo(camera.x, camera.y);
	// ctx.stroke();

	// ctx.strokeStyle = "grey";
	// ctx.beginPath();
	// // draw camera rays
	// camera.rays.forEach(ray => {
	// 	ctx.moveTo(camera.x, camera.y);
	// 	ctx.lineTo(camera.x + ray.direction_x * 500, camera.y + ray.direction_y * 500);
	// });
	// ctx.stroke();
}


function draw_scene3(lights, walls, camera, ctx) {

	App.intersections_count = 0;

	// clip
	ctx.save();
	const path = new Path2D();
	lights.forEach(light => {

		const intersections = light.cast(walls);
		App.intersections_count += intersections.length;
		intersections.forEach((point, index) => {
			if(index === 0) path.moveTo(point.x, point.y);
			path.lineTo(point.x, point.y);
		});
	});
	ctx.clip(path);

	
	// draw light rays
	lights.forEach(light => {
		
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


	// draw walls
	ctx.lineCap = "round";
	ctx.lineWidth = 3;
	ctx.strokeStyle = "grey";
	ctx.beginPath();
	walls.forEach(wall => {
		ctx.moveTo(wall.ax, wall.ay);
		ctx.lineTo(wall.bx, wall.by);
	});
	ctx.closePath();
	ctx.stroke();


	// draw light source
	lights.forEach(light => {

		ctx.strokeStyle = light.color;
		ctx.fillStyle = light.color;
		ctx.lineWidth = 1;

		ctx.beginPath();
		ctx.arc(light.x, light.y, 10, 0, 2 * Math.PI);
		ctx.closePath();
		ctx.fill();
	});
	ctx.restore();
}


function draw3d(lights, walls, camera, ctx) {

	const intersections = camera.cast(walls);

	ctx.strokeStyle = "white";
	ctx.fillStyle = "white";

	const width = App.canvas2.width / camera.rays.length;
	const distance_max = App.canvas2.width;
	intersections.forEach((point, index) => {

		const total_distance = Math.sqrt((point.x - camera.x) * (point.x - camera.x) + (point.y - camera.y) * (point.y - camera.y));
		const angle = camera.rays[index].angle - camera.angle;
		const v_dist = total_distance * Math.cos(angle);
		const distance = v_dist - camera.near;

		const x = Math.round(index * width);
		const height = 80000 / Math.round(distance);
		const y = (App.canvas2.height - height) / 2;
		const color = 255 - distance / distance_max * 255;
		ctx.fillStyle = `rgba(${color}, ${color}, ${color}, 1)`;
		// const height = App.canvas2.height - y * 2;
		ctx.fillRect(x, y, width, height);
	});
}

function debug() {

	const camera = App.camera;
	console.log(camera.angle);
	camera.rays.forEach(ray => {
		console.log(ray.angle);
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