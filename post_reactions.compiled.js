"use strict";

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

//(function(){

var Post_Reaction_Data = function () {
	function Post_Reaction_Data() {
		var post_id = arguments.length <= 0 || arguments[0] === undefined ? 0 : arguments[0];
		var data = arguments.length <= 1 || arguments[1] === undefined ? [] : arguments[1];

		_classCallCheck(this, Post_Reaction_Data);

		this.post_id = post_id;
		this.data = this.parse_data(data);
	}

	_createClass(Post_Reaction_Data, [{
		key: "parse_data",
		value: function parse_data() {
			var data = arguments.length <= 0 || arguments[0] === undefined ? [] : arguments[0];

			var parsed = [];

			if (data.constructor == Array && data.length) {
				var _iteratorNormalCompletion = true;
				var _didIteratorError = false;
				var _iteratorError = undefined;

				try {
					for (var _iterator = data[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
						var value = _step.value;

						if (yootil.is_json(value)) {
							parsed.push(JSON.parse(value));
						}
					}
				} catch (err) {
					_didIteratorError = true;
					_iteratorError = err;
				} finally {
					try {
						if (!_iteratorNormalCompletion && _iterator.return) {
							_iterator.return();
						}
					} finally {
						if (_didIteratorError) {
							throw _iteratorError;
						}
					}
				}
			}

			return parsed;
		}
	}, {
		key: "contains",
		value: function contains(user_id) {
			var _iteratorNormalCompletion2 = true;
			var _didIteratorError2 = false;
			var _iteratorError2 = undefined;

			try {
				for (var _iterator2 = this.data[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
					var reactors = _step2.value;

					if (reactors.u == yootil.user.id()) {
						return true;
					}
				}
			} catch (err) {
				_didIteratorError2 = true;
				_iteratorError2 = err;
			} finally {
				try {
					if (!_iteratorNormalCompletion2 && _iterator2.return) {
						_iterator2.return();
					}
				} finally {
					if (_didIteratorError2) {
						throw _iteratorError2;
					}
				}
			}

			return false;
		}
	}, {
		key: "add",
		value: function add(user_id, reaction_id) {
			var current_data = yootil.key.value(Post_Reactions.KEY, this.post_id);
			var entry = {

				u: user_id,
				r: reaction_id

			};

			var d = JSON.stringify(entry);

			if (!current_data || !current_data.constructor == Array) {
				yootil.key.set(Post_Reactions.KEY, [d], this.post_id);
			} else {
				yootil.key.push(Post_Reactions.KEY, d, this.post_id);
			}

			this.data.push(entry);
		}
	}, {
		key: "remove",
		value: function remove(user_id) {
			var new_data = [];
			var stringed_data = [];

			var _iteratorNormalCompletion3 = true;
			var _didIteratorError3 = false;
			var _iteratorError3 = undefined;

			try {
				for (var _iterator3 = this.data[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
					var value = _step3.value;

					if (value.u != yootil.user.id()) {
						new_data.push(value);
						stringed_data.push(JSON.stringify(value));
					}
				}
			} catch (err) {
				_didIteratorError3 = true;
				_iteratorError3 = err;
			} finally {
				try {
					if (!_iteratorNormalCompletion3 && _iterator3.return) {
						_iterator3.return();
					}
				} finally {
					if (_didIteratorError3) {
						throw _iteratorError3;
					}
				}
			}

			this.data = new_data;
			yootil.key.set(Post_Reactions.KEY, stringed_data, this.post_id);
		}
	}]);

	return Post_Reaction_Data;
}();

var Post_Reactions = function () {
	function Post_Reactions() {
		_classCallCheck(this, Post_Reactions);
	}

	_createClass(Post_Reactions, null, [{
		key: "init",
		value: function init() {
			if (typeof yootil == "undefined") {
				return;
			}

			var location_check = yootil.location.recent_posts() || yootil.location.search_results() || yootil.location.thread();

			if (!location_check) {
				return;
			}

			this.setup();

			if (yootil.user.logged_in()) {
				this.create_reaction_button();
			}
		}
	}, {
		key: "setup",
		value: function setup() {
			this.KEY = "pixeldepth_post_reactions";
			this.plugin = proboards.plugin.get(this.KEY);

			if (this.plugin && this.plugin.settings) {
				this.settings = this.plugin.settings || {};
				this.settings.images = this.plugin.images;
			}

			// Create post lookup table for data

			this.lookup = new Map();
			var post_data = proboards.plugin.keys.data["pd_post_reactions"];

			for (var key in post_data) {
				this.lookup.set(key, new Post_Reaction_Data(key, post_data[key]));
			}
		}
	}, {
		key: "get_data",
		value: function get_data(post_id) {
			if (!this.lookup.has(post_id.toString())) {
				this.lookup.set(post_id.toString(), new Post_Reaction_Data(post_id));
			}

			return this.lookup.get(post_id.toString());
		}

		/**
   * TODO: use plugin settings for the text on button.
   */

	}, {
		key: "create_reaction_button",
		value: function create_reaction_button() {
			var $controls = yootil.get.post_controls();

			$controls.each(function () {
				var post_id = Post_Reactions.fetch_post_id(this);
				var word = "Add";

				if (post_id) {
					var user_id = yootil.user.id();
					var reaction_data = Post_Reactions.get_data(post_id);
					var has_reacted = reaction_data && reaction_data.contains(user_id) ? true : false;

					if (has_reacted) {
						word = "Remove";
					}

					var $button = $("<a href='#' data-reaction='" + post_id + "' role='button' class='button'>" + word + " Reaction</a>");

					$button.on("click", Post_Reactions.button_handler.bind($button, post_id, user_id));

					$(this).prepend($button);
				}
			});
		}
	}, {
		key: "button_handler",
		value: function button_handler(post_id, user_id) {
			if (!yootil.key.write(Post_Reactions.KEY, post_id)) {
				pb.window.alert("Permission Denied", "You do not have the permission to write to the key for the Post Reactions plugin.");
				return false;
			} else if (yootil.key.space_left(Post_Reactions.KEY) <= 30) {
				pb.window.alert("Post Key Full", "Unfortunately your reaction cannot be saved for this post, as it is out of space.");
				return false;
			}

			var reaction_data = Post_Reactions.get_data(post_id);
			var has_reacted = reaction_data && reaction_data.contains(user_id) ? true : false;

			if (!has_reacted) {
				Post_Reactions.add(reaction_data, post_id, user_id);
			} else {
				Post_Reactions.remove(reaction_data, post_id, user_id);
			}

			return false;
		}
	}, {
		key: "add",
		value: function add(reaction_data, post_id, user_id) {
			pb.window.dialog("pd-post-reactions-dialog", {
				modal: true,
				height: Post_Reactions.settings.dialog_height,
				width: Post_Reactions.settings.dialog_width,
				title: Post_Reactions.settings.dialog_title,
				html: Post_Reactions.possible_reactions(),
				resizable: false,
				draggable: false,
				dialogClass: "pd-post-reactions-dialog",

				open: function open() {
					var $reaction_dialog = $(this);
					var $btn = $("div.pd-post-reactions-dialog").find("button#btn-add-reaction");
					var $items = $reaction_dialog.find("span.pd-post-reactions-dialog-item");

					$btn.css("opacity", 0.6);

					$items.click(function () {
						$items.css("opacity", 0.5).removeAttr("data-selected");
						$(this).css("opacity", 1).attr("data-selected", "selected");

						$btn.css("opacity", 1);
					});
				},

				buttons: [{

					text: "Close",
					click: function click() {
						$(this).dialog("close");
					}

				}, {

					id: "btn-add-reaction",
					text: "Add Reaction",
					click: function click() {
						var $reaction_dialog = $(this);
						var $selected_item = $reaction_dialog.find("span.pd-post-reactions-dialog-item[data-selected]");

						if ($selected_item.length == 1) {
							var id = ~ ~$selected_item.attr("data-reaction");

							reaction_data.add(user_id, id);
							$("a.button[data-reaction='" + post_id + "']").text("Remove Reaction");

							Post_Reactions.update_post(post_id);

							$reaction_dialog.dialog("close");
						}
					}

				}]

			});

			return false;
		}
	}, {
		key: "remove",
		value: function remove(reaction_data, post_id, user_id) {
			reaction_data.remove(user_id);
			$("a.button[data-reaction='" + post_id + "']").text("Add Reaction");
		}
	}, {
		key: "fetch_post_id",
		value: function fetch_post_id(control) {
			var $post_row = $(control).closest("tr.item.post");
			var post_id_parts = ($post_row.attr("id") || "").split("-");

			if (post_id_parts && post_id_parts.length == 2) {
				return ~ ~post_id_parts[1];
			}

			return 0;
		}
	}, {
		key: "update_post",
		value: function update_post() {
			var post_id = arguments.length <= 0 || arguments[0] === undefined ? 0 : arguments[0];

			if (post_id) {
				var $post_row = $("tr.item.post#post-" + post_id);

				console.log($post_row);
			}
		}
	}, {
		key: "possible_reactions",
		get: function get() {
			var html = "";

			html += "<div class='pd-post-reactions-table'>";
			html += "<div class='pd-post-reactions-row'>";

			var counter = 0;
			var iterator = this.settings.possible_reactions[Symbol.iterator]();
			var item = iterator.next();

			while (!item.done) {
				html += "<div class='pd-post-reactions-cell'>";
				html += "<span class='pd-post-reactions-dialog-item' data-reaction='" + item.value.unique_id + "'>";
				html += "<img src='" + item.value.image_url + "' title='" + item.value.title + "' />";
				html += "</span>";
				html += "</div>";

				item = iterator.next();
				counter++;

				if (counter == Post_Reactions.settings.reactions_per_row) {
					html += "</div><div class='pd-post-reactions-row'>";
					counter = 0;
				}
			}

			html += "</div>";
			html += "</div>";

			return html;
		}
	}]);

	return Post_Reactions;
}();

$(function () {
	Post_Reactions.init();
});

//})();
