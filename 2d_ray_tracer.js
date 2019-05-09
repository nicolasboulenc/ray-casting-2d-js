class Ray {

	constructor(pos_x, pos_y, dir_x, dir_y) {

		this.position_x = pos_x;
		this.position_y = pos_y;
		this.direction_x = dir_x;
		this.direction_y = dir_y;
	}

	// returns an xy or null
	cast(walls) {

		let min_distance = Infinity;
		const result = walls.forEach( wall => {

			const x1 = this.position_x;
			const y1 = this.position_y;
			const x2 = this.direction_x - this.position_x;
			const y2 = this.direction_y - this.position_y;
			const x3 = wall.ax;
			const y3 = wall.ay;
			const x4 = wall.bx;
			const y4 = wall.by;

			const d = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);
			if(d === 0) return null;

			const t = ( (x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4) ) / d;
			const u = -( (x1 - x2) * (y1 - y3) - (y1 - y2) * (x1 - x3) ) / d;

			if(t >= 0 && t <= 1) {
				return { ax: this.position_x, ay: this.position_y, bx: x1 + t * (x2 - x1), by: y1 + t * (y2 - y1) };
			}

			if(u >= 0 && u <= 1) {
				return { ax: this.position_x, ay: this.position_y, bx: x1 + u * (x2 - x1), by: y1 + u * (y2 - y1) };
			}

			return null;
		});

		return result;
	}
}

class Light {

	constructor(x, y) {

		this.x = x;
		this.y = y;
		this.rays = [];

		let rays_index = 0;
		const rays_count = 10;
		let angle = 0;
		while(rays_index < rays_count) {
			angle = Math.PI * 2 / rays_count * rays_index;
			const x = Math.cos(angle) * 10;
			const y = Math.sin(angle) * 10;
			this.rays.push(new Ray(this.x, this.y, x, y));
			rays_index++;
		}
	}

	// returns an array of segments
	cast(walls) {

		let rays = this.rays.map(ray => {
			ray.cast(walls);
		});

		return rays;
	}
}

function segment(ax, ay, bx, by) { return {ax: ax, ay: ay, bx: bx, by: by }; }
