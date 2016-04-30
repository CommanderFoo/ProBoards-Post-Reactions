class Post_Reaction_Data {

	constructor(post_id = 0, data = []){
		this._post_id = post_id;
		this._data = this.parse_data(data);
	}

	get post_id(){
		return this._post_id;
	}

	get data(){
		return this._data;
	}

	parse_data(data = []){
		let parsed = [];

		if(data.constructor == Array && data.length){
			for(let i = 0, l = data.length; i < l; i ++){
//			for(let value of data){
				if(yootil.is_json(data[i])){
					parsed.push(JSON.parse(data[i]));
				}
			}
		}

		return parsed;
	}

	contains(user_id){
		for(let reactor in this._data){
		//for(let reactors of this._data){
			if(this._data[reactor].u == yootil.user.id()){
				return true;
			}
		}

		return false;
	}

	add(user_id, reaction_id){
		let current_data = yootil.key.value(Post_Reactions.KEY, this._post_id);
		let entry = {

			u: user_id,
			r: reaction_id

		};

		let d = JSON.stringify(entry);

		if(!current_data || !current_data.constructor == Array){
			yootil.key.set(Post_Reactions.KEY, [d], this._post_id);
		} else {
			yootil.key.push(Post_Reactions.KEY, d, this._post_id);
		}

		this._data.push(entry);
	}

	remove(user_id){
		let new_data = [];
		let stringed_data = [];

		for(let reactor in this._data){
		//for(let value of this._data){
			if(this._data[reactor].u != yootil.user.id()){
				new_data.push(this._data[reactor]);
				stringed_data.push(JSON.stringify(this._data[reactor]));
			}
		}

		this._data = new_data;
		yootil.key.set(Post_Reactions.KEY, stringed_data, this._post_id);
	}

}