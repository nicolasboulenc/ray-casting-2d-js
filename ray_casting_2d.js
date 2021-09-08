
class Wall {

	constructor(ax, ay, bx, by) {

		this.ax = ax;
		this.ay = ay;
		this.bx = bx;
		this.by = by;
		this._orientation = "";

		if(Math.pow(bx - ax, 2) > Math.pow(by - ay, 2)) {
			// mostly horizontal
			this._orientation = "horizontal";
		}
		else {
			// mostly vertical
			this._orientation = "vertical";
		}

		this.is_lit = false;
		this.lights = null;		// [light1, light2, ...]
		this.hits = null;		// [[hit1, hit2, ...], [hit1, hit2, ...], ...]
		this.segments = null;	// [[segments1, segments2, ...], [segments1, segments2, ...], ...]
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

		// simplify hits into segments
		for(const light_hits of this.hits) {

			if(this._orientation === "horizontal") {
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

			let hit_index = 0;
			const hit_count = light_hits.length;

			let a_dist = Math.pow(light_hits[0].x - this.ax, 2) + Math.pow(light_hits[0].y - this.ay, 2);
			let b_dist = Math.pow(light_hits[0].x - this.bx, 2) + Math.pow(light_hits[0].y - this.by, 2);
			let s = { x: this.ax, y: this.ay };
			let e = { x: this.bx, y: this.by };
			if(a_dist > b_dist) {
				s = { x: this.bx, y: this.by };
				e = { x: this.ax, y: this.ay };
			}

			const segments = [];
			let start = { x: s.x, y: s.y, is_lit: light_hits[0].is_lit };

			while(hit_index < hit_count) {

				while(hit_index < hit_count && start.is_lit === light_hits[hit_index].is_lit) {
					hit_index++;
				}

				let end = light_hits[hit_index - 1];
				if(hit_index === hit_count) {
					end = { x: e.x, y: e.y, is_lit: light_hits[hit_index - 1].is_lit };
				}

				// add segment
				segments.push({ ax: start.x, ay: start.y, bx: end.x, by: end.y, is_lit: start.is_lit });

				if(hit_index < hit_count) {
					if(light_hits[hit_index].is_lit === true) {
						start = { x: light_hits[hit_index].x, y: light_hits[hit_index].y, is_lit: light_hits[hit_index].is_lit };
					}
					else {
						start = { x: light_hits[hit_index - 1].x, y: light_hits[hit_index - 1].y, is_lit: light_hits[hit_index].is_lit };
					}
				}
			}
			this.segments.push(segments);
		}
	}

	unify_hits() {

		// simplify segments into a single list
		const single_list = [];
		let light_index = 0;

		for(const light_segments of this.segments) {

			for(const segment of light_segments) {

				// check if point a intersect with any segments
				let list_index = 0;
				let list_count = single_list.length;
				let does_intersect = false;
				// todo check x coords > current x
				while(list_index < list_count && does_intersect === false) {

					const list_segment = single_list[list_index];
					if(segment.ax > list_segment.ax && segment.ax < list_segment.bx) {

						const segment1 = {ax: list_segment.ax, ay: list_segment.ay, bx: segment.ax, by: segment.ay, lights: list_segment.lights};
						const segment2 = {ax: segment.ax, ay: segment.ay, bx: list_segment.bx, by: list_segment.by, lights: list_segment.lights.concat([this.lights[light_index]])};
						single_list.splice(list_index, 1, segment1, segment2);
						does_intersect = true;
					}
					list_index++;
				}
				// if no intersect need to add a segment at the beginning
				// if() {}

				// check overlap
				list_index--;
				does_intersect = false;
				while(list_index < list_count && does_intersect === false) {

					const list_segment = single_list[list_index];
					if(segment.bx > list_segment.ax && segment.bx < list_segment.bx) {
						does_intersect = true;
					}
					else {
						list_segment.lights.push(this.lights[light_index]);
					}
					list_index++;
				}

				// check if point b intersect with any segments
				list_index--;
				does_intersect = false;
				while(list_index < list_count && does_intersect === false) {

					const list_segment = single_list[list_index];
					if(segment.bx > list_segment.ax && segment.bx < list_segment.bx) {

						const segment1 = {ax: list_segment.ax, ay: list_segment.ay, bx: segment.bx, by: segment.by, lights: list_segment.lights.concat([this.lights[light_index]])};
						const segment2 = {ax: segment.bx, ay: segment.by, bx: list_segment.bx, by: list_segment.by, lights: list_segment.lights};
						single_list.splice(list_index, 1, segment1, segment2);
						does_intersect = true;
					}
					list_index++;
				}
			}
			list_index++;
		}

		this.segments = single_list;
	}
}


class Ray {

	constructor(angle) {

		this._angle = 0;
		this._direction_x = 0;
		this._direction_y = 0;
		this.set_angle(angle);
	}


	set_angle(angle) {

		this._angle = angle;
		this._direction_x = Math.cos(angle);
		this._direction_y = Math.sin(angle);
	}


	cast(origin, walls) {
		// return an array of points intersecting walls sorted by distance asc
		let hits = [];
		for(const wall of walls) {

			const x1 = origin.x;
			const y1 = origin.y;
			const x2 = this._direction_x + origin.x;
			const y2 = this._direction_y + origin.y;

			const x3 = wall.ax;
			const y3 = wall.ay;
			const x4 = wall.bx;
			const y4 = wall.by;

			const d = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);
			if(d === 0) continue;

			const t = ( (x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4) ) / d;
			const u = -( (x1 - x2) * (y1 - y3) - (y1 - y2) * (x1 - x3) ) / d;

			if(t >= 0 && u >= 0 && u <= 1) {
				const point = { x: x1 + t * (x2 - x1), y: y1 + t * (y2 - y1) };
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

		this._x = x;
		this._y = y;
		this._rays = [];
		this._color = color;
		this._hits = null;

		const step = Math.PI * 2 / rays_count;

		let rays_index = 0;
		while(rays_index < rays_count) {
			this._rays.push(new Ray(step * rays_index));
			rays_index++;
		}
	}

	get x() { return this._x; }
	get y() { return this._y; }

	reset() {
		this._hits = [];
	}

	cast(walls) {

		for(const ray of this._rays) {

			const hits = ray.cast(this, walls);
			if(hits.length > 0) {
				const hit = hits[0];
				this._hits.push(hit);
				hit.wall.hit(hit.x, hit.y, this, true);
			}

			// add hits to intersections array and to walls
			let hits_index = 1;
			const hits_count = hits.length;
			while(hits_index < hits_count) {

				const hit = hits[hits_index];
				hit.wall.hit(hit.x, hit.y, this, false);
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

		let index = 0;
		for(const ray of this.rays) {

			const w = -width + (width * 2) * index / (this.rays.length - 1);
			const ray_angle = this.angle + Math.atan(w / this.near);
			ray.set_angle(ray_angle);
			index++;
		}
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
