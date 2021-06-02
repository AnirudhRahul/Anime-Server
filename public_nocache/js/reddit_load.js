// Queries reddit for the link to the discussion post
const official_name = document.getElementById("reddit_load").getAttribute("official_name");
const episode_number = document.getElementById("reddit_load").getAttribute("episode_number");
const query = official_name + ' - Episode ' + episode_number + ' discussion'

reddit.search(query).sort("relevance").fetch(function(res) {
	console.log(res);
	for(post of res.data.children){
		const cur = post.data
		if(cur.link_flair_text == 'Episode' && cur.subreddit == 'anime'){
      red.embed(cur.url+'about.json', document.getElementById("embed-div"),
			{show_post_body:false, ignore_sticky_comments:true, show_comments_section_header:false,
				post_author: 'r/anime',
				post_title: official_name + ' Episode ' + episode_number
			})
			console.log(cur.url+'about.json');
      break;
		}
	}
});
