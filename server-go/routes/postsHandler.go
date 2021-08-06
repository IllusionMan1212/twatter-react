package routes

import (
	"context"
	"fmt"
	"illusionman1212/twatter-go/db"
	"illusionman1212/twatter-go/models"
	"illusionman1212/twatter-go/utils"
	"net/http"

	"github.com/gorilla/mux"
)

func DeletePost(w http.ResponseWriter, req *http.Request) {

}

func LikePost(w http.ResponseWriter, req *http.Request) {

}

func GetPostsCount(w http.ResponseWriter, req *http.Request) {
	utils.OkWithJSON(w, `{
		"message": "Successfully fetched posts count",
		"status": "200",
		"success": true,
		"count": 0
	}`)
}

func GetPosts(w http.ResponseWriter, req *http.Request) {
	// TODO: fetch posts from the db
	params := mux.Vars(req)

	page := params["page"]
	userId := params["userId"]

	fmt.Printf("page %v\n", page)
	fmt.Printf("userid %v\n", userId)

	selectQuery := `SELECT post.id as post_id,
	author.id as author_id, author.username as author_username, author.display_name as author_display_name, author.avatar_url as author_avatar_url,
	post.content as post_content, post.created_at as post_created_at,
	parent.id as parent_id, parent.content as parent_content,
	parent_author.username as parent_author_username, parent_author.avatar_url as parent_author_avatar_url,
	count(likes) as likes,
	count(comments) as comments
		FROM posts post
		LEFT JOIN posts parent
		ON post.parent_id = parent.id
		INNER JOIN users author
		ON post.user_id = author.id
		LEFT JOIN likes
		ON likes.post_id = post.id
		LEFT JOIN users parent_author
		ON parent.user_id = parent_author.id
		LEFT JOIN posts comments
		ON comments.parent_id = post.id
		GROUP BY post.id, parent.id, author.id, parent_author.username, parent_author.avatar_url;`

	rows, err := db.DBPool.Query(context.Background(), selectQuery)
	if err != nil {
		// TODO: somtehing
		panic(err)
	}

	posts := make([]models.DBPost, 0)

	defer rows.Close()
	for rows.Next() {
		post := &models.DBPost{}
		parent := &models.ParentPost{}
		err = rows.Scan(&post.ID, &post.Author.ID,
			&post.Author.Username, &post.Author.DisplayName, &post.Author.AvatarURL,
			&post.Content, &post.CreatedAt,
			&parent.ID, &parent.Content, &parent.Author.Username, &parent.Author.AvatarURL,
			&post.Likes, &post.Comments)
		if err != nil {
			// TODO: return 500 ?
			panic(err)
		}
		post.ReplyingTo = *parent
		posts = append(posts, *post)
	}

	err = rows.Err()
	if err != nil {
		// TODO: return 500
		panic(err)
	}

	utils.OkWithJSON(w, fmt.Sprintf(`{
		"message": "Successfully fetched posts",
		"status": "200",
		"success": true,
		"posts": %v
	}`, utils.MarshalJSON(posts)))
}

func GetPost(w http.ResponseWriter, req *http.Request) {

}

func GetComments(w http.ResponseWriter, req *http.Request) {

}
