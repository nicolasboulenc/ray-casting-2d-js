"use strict";

window.onload = ()=>{ setup(); };

const App = {
	canvas: null,
	ctx: null,
	light: null,
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

	App.light = new Light(0, 0, 16000);
	App.walls = [];

	// 4 walls
	App.walls.push( new Wall(300, 200, 500, 200) );
	App.walls.push( new Wall(App.canvas.width - 200, 300, App.canvas.width - 200, 500) );
	App.walls.push( new Wall(300, App.canvas.height - 200, 500, App.canvas.height - 200) );
	App.walls.push( new Wall(200, 300, 200, 500) );

	// centre square
	App.walls.push( new Wall(App.canvas.width / 2 - 10, App.canvas.height / 2 - 10, App.canvas.width / 2 + 10, App.canvas.height / 2 - 10) );
	App.walls.push( new Wall(App.canvas.width / 2 + 10, App.canvas.height / 2 - 10, App.canvas.width / 2 + 10, App.canvas.height / 2 + 10) );
	App.walls.push( new Wall(App.canvas.width / 2 + 10, App.canvas.height / 2 + 10, App.canvas.width / 2 - 10, App.canvas.height / 2 + 10) );
	App.walls.push( new Wall(App.canvas.width / 2 - 10, App.canvas.height / 2 + 10, App.canvas.width / 2 - 10, App.canvas.height / 2 - 10) );

	// canvas bounds
	App.walls.push( new Wall(0, 0, App.canvas.width, 0) );
	App.walls.push( new Wall(App.canvas.width, 0, App.canvas.width, App.canvas.height) );
	App.walls.push( new Wall(App.canvas.width, App.canvas.height, 0, App.canvas.height) );
	App.walls.push( new Wall(0, App.canvas.height, 0, 0) );

	requestAnimationFrame(loop);
}

function mouse_move(evt) {

    let rect = App.canvas.getBoundingClientRect();
	App.light.x = evt.clientX - rect.left;
	App.light.y = evt.clientY - rect.top;
}

function loop(timestamp) {

	//clear canvas
	App.ctx.clearRect(0, 0, App.canvas.width, App.canvas.height);

	draw_scene(App.light, App.walls, App.ctx);

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

function draw_scene1(light, walls, ctx) {

	App.walls.forEach(wall => { wall.is_lit = false; });

	// draw light rays
	ctx.strokeStyle = "rgba(255, 165, 0, 0.1)";
	ctx.lineWidth = 12;

	const intersections = light.cast(walls);
	intersections.forEach(point => {
		
		ctx.beginPath();
		ctx.moveTo(light.x, light.y);
		ctx.lineTo(point.x, point.y);
		ctx.closePath();
		ctx.stroke();
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
	ctx.strokeStyle = "rgba(255, 0, 0, 0.5)";
	ctx.fillStyle = "rgba(255, 0, 0, 0.5)";
	ctx.lineWidth = 1;
	
	ctx.beginPath();
	ctx.arc(light.x, light.y, 10, 0, 2 * Math.PI);
	ctx.closePath();
    ctx.fill();

    ctx.stroke();
}


function draw_scene(light, walls, ctx) {

	App.walls.forEach(wall => { 
		wall.is_lit = false; 
		wall.hits = []; 
	});

	// draw light rays
	ctx.fillStyle = "rgba(255, 165, 0, 6.0)";

	ctx.beginPath();

	const intersections = light.cast(walls);
	App.intersections_count = intersections.length;
	intersections.forEach((point, index) => {
		if(index === 0) ctx.moveTo(point.x, point.y);
		ctx.lineTo(point.x, point.y);
	});

	ctx.closePath();
	ctx.fill();


	// draw walls
	ctx.strokeStyle = "grey";
	ctx.lineWidth = 3;
	ctx.beginPath();
	
	walls.forEach(wall => {
		wall.hits.forEach((point, index) => {
			if(index === 0) ctx.moveTo(point.x, point.y);
			if(point.is_lit === false) 
				ctx.moveTo(point.x, point.y);
			else
				ctx.lineTo(point.x, point.y);
		});
	});

	ctx.closePath();
	ctx.stroke();


	// draw light source
	ctx.strokeStyle = "rgba(255, 0, 0, 0.5)";
	ctx.fillStyle = "rgba(255, 0, 0, 0.5)";
	ctx.lineWidth = 1;
	
	ctx.beginPath();
	ctx.arc(light.x, light.y, 10, 0, 2 * Math.PI);
	ctx.closePath();
    ctx.fill();

    ctx.stroke();
}