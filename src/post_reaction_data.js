class Post_Reaction_Data {

	constructor(post_id = 0, data = []){
		this.post_id = post_id;
		this.data = this.parse_data(data);
	}

	parse_data(data = []){
		let parsed = [];

		if(data.constructor == Array && data.length){
			for(let value of data){
				if(yootil.is_json(value)){
					parsed.push(JSON.parse(value));
				}
			}
		}

		return parsed;
	}

	contains(user_id){
		for(let reactors of this.data){
			if(reactors.u == yootil.user.id()){
				return true;
			}
		}

		return false;
	}

	add(user_id, reaction_id){
		let current_data = yootil.key.value(Post_Reactions.KEY, this.post_id);
		let entry = {

			u: user_id,
			r: reaction_id

		};

		let d = JSON.stringify(entry);

		if(!current_data || !current_data.constructor == Array){
			yootil.key.set(Post_Reactions.KEY, [d], this.post_id);
		} else {
			yootil.key.push(Post_Reactions.KEY, d, this.post_id);
		}

		this.data.push(entry);
	}

	remove(user_id){
		let new_data = [];
		let stringed_data = [];

		for(let value of this.data){
			if(value.u != yootil.user.id()){
				new_data.push(value);
				stringed_data.push(JSON.stringify(value));
			}
		}

		this.data = new_data;
		yootil.key.set(Post_Reactions.KEY, stringed_data, this.post_id);
	}

}