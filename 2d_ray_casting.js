
class Wall {

	constructor(ax, ay, bx, by) {

		this.ax = ax;
		this.ay = ay;
		this.bx = bx;
		this.by = by;
		this.is_lit = false;
		this.lights = null;
		this.hits = null;
		this.segments = null;
	}

	reset() {
		this.is_lit = false;
		this.lights = [];
		this.hits = [];
		this.segments = [];
	}

	hit(x, y, light, is_lit) {

		let light_index = this.lights.findIndex(elem => {
			return elem === light;
		});	

		if(light_index === -1) {
			this.lights.push(light);
			light_index = this.lights.length - 1;
			this.hits.push([]);
		}

		this.hits[light_index].push({x: x, y: y, is_lit: is_lit});
	}

	process_hits() {

		// sort hits
		// determine whether wall is mostly horizontal or vertical
		if(this.bx / this.ax > this.by / this.ay) {
			// if mostly horizontal sort by x
			this.hits.forEach(light_hits => {
				light_hits.sort((a, b) => a.x - b.x);
			});
		} 
		else {
			// if mostly vertical sort by y
			this.hits.forEach(light_hits => {
				light_hits.sort((a, b) => a.y - b.y);
			});
		}

		// simplify hits into segments
		this.hits.forEach((light_hits) => {

			this.segments.push([]);
			let hit_index = 0;
			const hit_count = light_hits.length;
			while(hit_index < hit_count) {

				const start = light_hits[hit_index];
				while(hit_index < hit_count && start.is_lit === light_hits[hit_index].is_lit) {
					hit_index++;
				}
				hit_index--;
				const end = light_hits[hit_index];
				// add segment
				this.segments[this.segments.length - 1].push({ ax: start.x, ay: start.y, bx: end.x, by: end.y, is_lit: start.is_lit });
				hit_index++;
			}
		});

	}
}


class Ray {

	constructor(angle, light) {

		this.light = light;
		this.angle = angle;
		this.direction_x = Math.cos(angle);
		this.direction_y = Math.sin(angle);
	}


	set_angle(angle) {

		this.angle = angle;
		this.direction_x = Math.cos(angle);
		this.direction_y = Math.sin(angle);
	}


	cast(origin, walls) {

		let hits = [];
		for(const wall of walls) {

			const x1 = origin.x;
			const y1 = origin.y;
			const x2 = this.direction_x + origin.x;
			const y2 = this.direction_y + origin.y;

			const x3 = wall.ax;
			const y3 = wall.ay;
			const x4 = wall.bx;
			const y4 = wall.by;

			const d = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);
			if(d === 0) continue;

			const t = ( (x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4) ) / d;
			const u = -( (x1 - x2) * (y1 - y3) - (y1 - y2) * (x1 - x3) ) / d;

			let point = null;
			if(t >= 0 && u >= 0 && u <= 1) {
				point = { x: x1 + t * (x2 - x1), y: y1 + t * (y2 - y1) };
			}

			if(point !== null) {
				const distance = (point.x - origin.x) * (point.x - origin.x) + (point.y - origin.y) * (point.y - origin.y);
				hits.push({ x: point.x, y: point.y, distance: distance, wall: wall });
			}
		}

		// sort hits based on distance
		hits.sort((a, b) => a.distance - b.distance);

		return hits;
	}
}


class Light {

	constructor(x, y, rays_count, color) {

		this.x = x;
		this.y = y;
		this.rays = [];
		this.color = color;
		this.hits = null;

		let rays_index = 0;
		let angle = 0;
		while(rays_index < rays_count) {
			angle = Math.PI * 2 / rays_count * rays_index;
			this.rays.push(new Ray(angle, this));
			rays_index++;
		}
	}

	reset() {
		this.hits = [];
	}

	// returns an array of segments
	cast(walls) {

		for(const ray of this.rays) {

			const hits = ray.cast({x: this.x, y: this.y}, walls);

			// add hits to intersections array and to walls
			let hits_index = 0;
			const hits_count = this.length;
			while(hits_index < hits_count) {

				if(hits_index === 0) {
					ray_hit.wall.hit(ray_hit.x, ray_hit.y, this, true);
					this.hits.push({ x: ray_hit.x, y: ray_hit.y });
				}
				else {
					ray_hit.wall.hit(ray_hit.x, ray_hit.y, this, false);
				}
				hits_index++;
			}
		}
	}
}


class Camera {

	constructor(options) {

		this.x = options.x;
		this.y = options.y;
		this.angle = options.angle;
		this.fov = options.fov;
		this.near = options.near;
		this.rays = [];
		this.step = 3;

		// use fov and rays_count to calculate angle for flat projection as opposed to even angles
		const width = this.near / Math.tan(this.fov/2);
		let rays_index = 0;
		while(rays_index < options.rays_count) {
			const w = -width + (width * 2) * rays_index / (options.rays_count - 1);
			const ray_angle = this.angle + Math.atan(w / this.near);
			this.rays.push(new Ray(ray_angle, this));
			// console.log(ray_angle);
			rays_index++;
		}

		// let rays_index = 0;
		// const start_angle = this.angle - this.fov / 2;
		// while(rays_index < options.rays_count) {
		// 	const ray_angle = start_angle + this.fov / options.rays_count * rays_index;
		// 	this.rays.push(new Ray(ray_angle, this));
		// 	rays_index++;
		// }
	}

	cast(walls) {

		const intersections = [];

		for(const ray of this.rays) {

			const point = ray.cast({x: this.x, y: this.y}, walls);
			if(point !== null) intersections.push(point);
		}

		return intersections;
	}

	set_angle(angle) {

		this.angle = angle;

		const width = this.near / Math.tan(this.fov/2);
		this.rays.forEach((ray, index) => {
			const w = -width + (width * 2) * index / (this.rays.length - 1);
			const ray_angle = this.angle + Math.atan(w / this.near);
			ray.set_angle(ray_angle);
		});
	}

	look_at(x, y) {

		this.angle = Math.atan2(y - this.y, x - this.x);

		const width = this.near / Math.tan(this.fov/2);
		this.rays.forEach((ray, index) => {
			const w = -width + (width * 2) * index / (this.rays.length - 1);
			const ray_angle = this.angle + Math.atan(w / this.near);
			ray.set_angle(ray_angle);
		});

		// const start_angle = this.angle - this.fov / 2;
		// this.rays.forEach((ray, index) => {
			
		// 	ray.set_angle(start_angle + this.fov / this.rays.length * index);
		// }, this);	
	}

	move_forward(delta_time) {
		this.x += Math.cos(this.angle) * this.step;
		this.y += Math.sin(this.angle) * this.step;
	}

	move_left(delta_time) {
		this.x += Math.cos(this.angle - Math.PI / 2) * this.step;
		this.y += Math.sin(this.angle - Math.PI / 2) * this.step;
	}

	move_backward(delta_time) {
		this.x += Math.cos(this.angle + Math.PI) * this.step;
		this.y += Math.sin(this.angle + Math.PI) * this.step;
	}

	move_right(delta_time) {
		this.x += Math.cos(this.angle + Math.PI / 2) * this.step;
		this.y += Math.sin(this.angle + Math.PI / 2) * this.step;
	}
}
