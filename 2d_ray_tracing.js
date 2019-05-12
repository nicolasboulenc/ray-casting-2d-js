class Wall {

	constructor(ax, ay, bx, by) {

		this.ax = ax;
		this.ay = ay;
		this.bx = bx;
		this.by = by;
		this.is_lit = false;
		this.lights = null;
		this.hits = null;
	}

	hit(light, point, is_lit) {
		if(is_lit === true) this.is_lit = true;
		if(this.hits === null) return;

		let light_index = this.lights.findIndex(elem => {
			return elem.id === light.id;
		});	

		if(light_index === -1) {
			this.lights.push(light);
			light_index = this.lights.length - 1;
			this.hits.push([]);
		}

		this.hits[light_index].push({x: point.x, y: point.y, is_lit: is_lit});
	}

	sort_hits() {

		// determine whether wall is mostly horizontal or vertical
		if(this.bx / this.ax > this.by / this.ay) {
			// if mostly horizontal sort by x
			this.hits.forEach(light_hits => {
				light_hits.sort((a, b) => a.x - b.x);
			})
		} 
		else {
			// if mostly vertical sort by y
			this.hits.forEach(light_hits => {
				light_hits.sort((a, b) => a.y - b.y);
			})
		}
	}
}

class Ray {

	constructor(angle, light) {

		this.light = light;
		this.angle = angle;
		this.direction_x = Math.cos(angle);
		this.direction_y = Math.sin(angle);
	}

	// returns an xy or null
	cast(origin, walls) {

		let intersects = [];
		// let closest_wall = null;
		let closest_intersect = null;
		let closest_distance = Infinity;
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
				let distance = (point.x - origin.x) * (point.x - origin.x) + (point.y - origin.y) * (point.y - origin.y);
				point.x = point.x;
				point.y = point.y;
				intersects.push({wall: wall, point: point, distance: distance});

				if(distance < closest_distance) {
					// closest_wall = wall;
					closest_intersect = { x: point.x, y: point.y };
					closest_distance = distance;
				}
			}
		}

		if(closest_intersect === null) return null;

		// add hits to walls
		intersects.forEach((intersect) => {
			if(intersect.distance === closest_distance) {
				intersect.wall.is_lit = true;
				intersect.wall.hit(this.light, intersect.point, true);
			}
			else {
				intersect.wall.hit(this.light, intersect.point, false);				
			}
		}, this);
		
		const intersection = { x: closest_intersect.x, y: closest_intersect.y };
		return intersection;
	}
}

class Light {

	constructor(x, y, rays_count, color) {

		this.id = Light.ID();
		this.x = x;
		this.y = y;
		this.rays = [];
		this.color = color;

		let rays_index = 0;
		let angle = 0;
		while(rays_index < rays_count) {
			angle = Math.PI * 2 / rays_count * rays_index;
			this.rays.push(new Ray(angle, this));
			rays_index++;
		}
	}

	static ID() {
		return Light.id++;
	}

	// returns an array of segments
	cast(walls) {

		const intersections = [];

		for(const ray of this.rays) {

			const point = ray.cast({x: this.x, y: this.y}, walls);
			if(point !== null) intersections.push(point);
		}

		return intersections;
	}
}

Light.id = 0;

// function wall(ax, ay, bx, by) { return {ax: ax, ay: ay, bx: bx, by: by, is_lit: false }; }
