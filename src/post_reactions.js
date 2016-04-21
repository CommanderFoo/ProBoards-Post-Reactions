class Post_Reactions {

	static init(){
		if(typeof yootil == "undefined"){
			return;
		}

		let location_check = (
			yootil.location.recent_posts() ||
			yootil.location.search_results() ||
			yootil.location.thread()
		);

		if(!location_check){
			return;
		}

		this.setup();

		if(yootil.user.logged_in()){
			this.create_reaction_button();
		}

		yootil.event.after_search(() => {
			this.create_post_reactions.bind(this)();
			this.create_reaction_button();
		});

		this.create_post_reactions();
	}

	static setup(){
		this.KEY = "pixeldepth_post_reactions";
		this.plugin = proboards.plugin.get(this.KEY);

		if(this.plugin && this.plugin.settings){
			this.settings = this.plugin.settings || {};
			this.settings.images = this.plugin.images;
		}

		// Create post lookup table for data

		this.lookup = new Map();
		let post_data = proboards.plugin.keys.data[this.KEY];

		for(var key in post_data){
			this.lookup.set(key, new Post_Reaction_Data(key, post_data[key]));
		}
	}

	static get_data(post_id){
		if(!this.lookup.has(post_id.toString())){
			this.lookup.set(post_id.toString(), new Post_Reaction_Data(post_id));
		}

		return this.lookup.get(post_id.toString());
	}

	static create_reaction_button(){
		let $controls = yootil.get.post_controls();

		$controls.each(function(){
			let post_id = Post_Reactions.fetch_post_id(this);
			let btn_txt = Post_Reactions.settings.add_reaction;

			if(post_id){
				let user_id = yootil.user.id();
				let reaction_data = Post_Reactions.get_data(post_id);
				let has_reacted = (reaction_data && reaction_data.contains(user_id))? true : false;

				if(has_reacted){
					btn_txt = Post_Reactions.settings.remove_reaction;;
				}

				let $button = $("<a href='#' data-reaction='" + post_id + "' role='button' class='button'>" + btn_txt + "</a>");

				$button.on("click", Post_Reactions.button_handler.bind($button, post_id, user_id));

				$(this).prepend($button);
			}
		});
	}

	static button_handler(post_id, user_id){
		if(!yootil.key.write(Post_Reactions.KEY, post_id)){
			pb.window.alert("Permission Denied", "You do not have the permission to write to the key for the Post Reactions plugin.");
			return false;
		} else if(yootil.key.space_left(Post_Reactions.KEY) <= 30){
			pb.window.alert("Post Key Full", "Unfortunately your reaction cannot be saved for this post, as it is out of space.");
			return false;
		}

		let reaction_data = Post_Reactions.get_data(post_id);
		let has_reacted = (reaction_data && reaction_data.contains(user_id))? true : false;

		if(!has_reacted){
			Post_Reactions.add(reaction_data, post_id, user_id);
		} else {
			Post_Reactions.remove(reaction_data, post_id, user_id);
		}

		return false;
	}

	static add(reaction_data, post_id, user_id){
		pb.window.dialog("pd-post-reactions-dialog", {
			modal: true,
			height: Post_Reactions.settings.dialog_height,
			width: Post_Reactions.settings.dialog_width,
			title: Post_Reactions.settings.dialog_title,
			html: Post_Reactions.possible_reactions(),
			resizable: false,
			draggable: false,
			dialogClass: "pd-post-reactions-dialog",

			open: function(){
				let $reaction_dialog = $(this);
				let $btn = $("div.pd-post-reactions-dialog").find("button#btn-add-reaction");
				let $items = $reaction_dialog.find("span.pd-post-reactions-dialog-item");

				$btn.css("opacity", 0.6);

				$items.click(function(){
					$items.css("opacity", 0.5).removeAttr("data-selected");
					$(this).css("opacity", 1).attr("data-selected", "selected");

					$btn.css("opacity", 1);
				});
			},

			buttons: [

				{

					text: "Close",
					click: function(){
						$(this).dialog("close");
					}

				},

				{

					id: "btn-add-reaction",
					text: Post_Reactions.settings.add_reaction,
					click: function(){
						let $reaction_dialog = $(this);
						let $selected_item = $reaction_dialog.find("span.pd-post-reactions-dialog-item[data-selected]");

						if($selected_item.length == 1){
							let id = ~~ $selected_item.attr("data-reaction");

							reaction_data.add(user_id, id);
							$("a.button[data-reaction='" + post_id + "']").text("Remove Reaction");

							Post_Reactions.update_post(reaction_data);

							$reaction_dialog.dialog("close");

						}
					}

				}

			]

		});

		return false;
	}

	static remove(reaction_data, post_id, user_id){
		reaction_data.remove(user_id);
		this.update_post(reaction_data);
		$("a.button[data-reaction='" + post_id + "']").text(this.settings.add_reaction);
	}

	static possible_reactions(){
		let html = "";

		html += "<div class='pd-post-reactions-table'>";
			html += "<div class='pd-post-reactions-row'>";

			let counter = 0;

			for(let item of this.settings.possible_reactions){
				if(item.staff_only == 1 && !yootil.user.is_staff()){
					continue;
				}

				html += "<div class='pd-post-reactions-cell'>";
					html += "<span class='pd-post-reactions-dialog-item' data-reaction='" + item.unique_id + "'>";
						html += "<img src='" + item.image_url + "' title='" + item.title + "' />";
					html += "</span>";
				html += "</div>";

				counter ++;

				if(counter == this.settings.reactions_per_row){
					html += "</div><div class='pd-post-reactions-row'>";
					counter = 0;
				}
			}

			html += "</div>";
		html += "</div>";

		return html;
	}

	static fetch_post_id(control){
		let $post_row = $(control).closest("tr.item.post");
		let post_id_parts = ($post_row.attr("id") || "").split("-");

		if(post_id_parts && post_id_parts.length == 2){
			return ~~ post_id_parts[1];
		}

		return 0;
	}

	static update_post(reaction_data){
		if(reaction_data && reaction_data.post_id){
			let data = reaction_data.data;
			let post_id = reaction_data.post_id;
			let $post_row = $("tr.item.post#post-" + post_id);
			let $foot = $post_row.find("td.foot");
			let $reactions_div = $foot.find("div.pd-post-reactions-container");

			if(data.constructor == Array && data.length > 0){
				if(!$reactions_div.length){
					$reactions_div = $("<div class='pd-post-reactions-container'></div>");

					if($foot.has("div.signature").length){
						$foot.find("div.signature").before($reactions_div);
					} else {
						$foot.append($reactions_div);
					}
				}

				$reactions_div.html(Post_Reactions.fetch_post_reactions(reaction_data.data));
			} else if($reactions_div.length == 1){
				$reactions_div.remove();
			}
		}
	}

	static create_post_reactions(){
		for(let reaction_data of this.lookup.values()){
			this.update_post(reaction_data);
		}
	}

	static fetch_post_reactions(reaction_data){
		let data_iterator = reaction_data[Symbol.iterator]();
		let counts = new Map();
		let data_item = data_iterator.next();

		while(!data_item.done){
			if(!counts.has(data_item.value.r)){
				counts.set(data_item.value.r, 0);
			}

			counts.set(data_item.value.r, (counts.get(data_item.value.r) + 1));
			data_item = data_iterator.next();
		}

		let html = "";

		for(let [id, count] of counts){
			let reaction = this.settings.possible_reactions.find((obj) => {
				return (~~ obj.unique_id) === id;
			});

			if(reaction){
				let total = "";

				if(this.settings.show_counts == 1){
					total = " x " + count;
				}

				let title = "";

				if(this.settings.show_titles == 1){
					title = "<span class='pd-post-reactions-item-title'>" + reaction.title;

					if(total.length){
						title += "<br />" + total;
					}

					title += "</span>";
				}

				html += "<span class='pd-post-reactions-item' data-reaction='" + reaction.unique_id + "'>";
					html += "<img src='" + reaction.image_url + "' title='" + reaction.title + total + "' />";
					html += title;
				html += "</span>";
			}
		}

		return html;
	}

}

$(function(){
	Post_Reactions.init();
});

