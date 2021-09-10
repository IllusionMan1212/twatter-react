package routes

import (
	"context"
	"encoding/json"
	"fmt"
	"illusionman1212/twatter-go/db"
	"illusionman1212/twatter-go/logger"
	"illusionman1212/twatter-go/models"
	"illusionman1212/twatter-go/redissession"
	"illusionman1212/twatter-go/utils"
	"net/http"
	"os"
	"strconv"

	"github.com/gorilla/mux"
	"github.com/jackc/pgx/v4"
)

func DeletePost(w http.ResponseWriter, req *http.Request) {
	sessionUser, err := utils.ValidateSession(req, w)
	if err != nil {
		logger.Error(err)
		return
	}

	body := &models.DeletePostBody{}
	err = json.NewDecoder(req.Body).Decode(&body)
	if err != nil {
		utils.InternalServerErrorWithJSON(w, "")
		logger.Errorf("Error while decoding route body: %v", err)
		return
	}

	if sessionUser.ID != fmt.Sprintf("%v", body.PostAuthorId) {
		utils.UnauthorizedWithJSON(w, `{
			"message": "Unauthorized user, please log in",
			"status": "401",
			"success": false
		}`)
		logger.Info("Unauthorized action: different session user id and id sent in body")
		return
	}

	deleteQuery := `DELETE FROM posts WHERE id = $1 AND user_id = $2;`

	_, err = db.DBPool.Exec(context.Background(), deleteQuery, body.PostId, body.PostAuthorId)
	if err != nil {
		utils.InternalServerErrorWithJSON(w, "")
		logger.Errorf("Error while deleting post: %v", err)
		return
	}

	// remove attachment if any
	err = os.RemoveAll(fmt.Sprintf("../cdn/posts/%v/", body.PostId))
	if err != nil {
		utils.InternalServerErrorWithJSON(w, "")
		logger.Errorf("Error while removing attachment(s) directory: %v", err)
		return
	}

	utils.OkWithJSON(w, `{
		"message": "Successfully deleted post",
		"status": 200,
		"success": true
	}`)
}

func LikePost(w http.ResponseWriter, req *http.Request) {
	sessionUser, err := utils.ValidateSession(req, w)
	if err != nil {
		logger.Error(err)
		return
	}

	body := &models.LikePostBody{}

	err = json.NewDecoder(req.Body).Decode(&body)
	if err != nil {
		logger.Errorf("Error while decoding route body: %v", err)
		return
	}

	var query string

	if body.LikeType == "LIKE" {
		query = `INSERT INTO likes(post_id, user_id) VALUES($1, $2)`
	} else if body.LikeType == "UNLIKE" {
		query = `DELETE FROM likes WHERE post_id = $1 AND user_id = $2`
	}

	_, err = db.DBPool.Exec(context.Background(), query, body.PostId, sessionUser.ID)
	if err != nil {
		utils.InternalServerErrorWithJSON(w, "")
		logger.Errorf("Error while liking/disliking post: %v", err)
		return
	}

	utils.OkWithJSON(w, `{
		"message": "Success",
		"status": 200,
		"success": true
	}`)
}

func GetPostsCount(w http.ResponseWriter, req *http.Request) {
	params := mux.Vars(req)

	userId := params["userId"]
	query := `SELECT count(posts) FROM posts WHERE user_id = $1;`

	var count int
	err := db.DBPool.QueryRow(context.Background(), query, userId).Scan(&count)
	if err != nil {
		utils.InternalServerErrorWithJSON(w, "")
		logger.Errorf("Error while fetching posts count: %v", err)
		return
	}

	utils.OkWithJSON(w, fmt.Sprintf(`{
		"message": "Successfully fetched posts count",
		"status": 200,
		"success": true,
		"count": %v
	}`, count))
}

func GetPosts(w http.ResponseWriter, req *http.Request) {
	params := mux.Vars(req)

	pageParam := params["page"]
	page, err := strconv.Atoi(pageParam)
	if err != nil {
		utils.BadRequestWithJSON(w, `{
			"message": "Invalid or incomplete request",
			"status": 400,
			"success": false
		}`)
		logger.Errorf("Error while converting page param to string: %v", err)
		return
	}
	authorId := params["userId"]
	postType := req.URL.Query().Get("type")

	if authorId != "" && postType == "" {
		utils.BadRequestWithJSON(w, `{
			"message": "Invalid or incomplete request",
			"status": 400,
			"success": false
		}`)
		logger.Info("Attempt to get posts with no post type and no author id")
		return
	}

	var selectQuery string
	var rows pgx.Rows
	var userId uint64

	session := redissession.GetSession(req)

	sessionUser, ok := session.Values["user"].(*models.User)
	if ok {
		id, err := strconv.Atoi(sessionUser.ID)
		if err != nil {
			utils.InternalServerErrorWithJSON(w, "")
			logger.Errorf("Error while converting string to int: %v", err)
			return
		}
		userId = uint64(id)
	} else {
		userId = 0
	}

	if authorId != "" {
		switch postType {
		case "posts":
			selectQuery = `SELECT post.id as post_id,
      author.id as author_id, author.username as author_username, author.display_name as author_display_name, author.avatar_url as author_avatar_url,
      post.content as post_content, post.created_at as post_created_at,
			parent.id as parent_id, parent.content as parent_content,
			parent_author.username as parent_author_username, parent_author.display_name as parent_author_display_name, parent_author.avatar_url as parent_author_avatar_url, 
			ARRAY_AGG(DISTINCT attachments.url) as attachments_urls, ARRAY_AGG(attachments.type) as attachments_types,
			(SELECT count(likes) FROM likes WHERE likes.post_id = post.id) as likes,
			count(comments) as comments,
			EXISTS (SELECT user_id FROM likes WHERE likes.post_id = post.id AND likes.user_id = $3) as liked
				FROM posts post
				LEFT JOIN posts parent
				ON post.parent_id = parent.id
				INNER JOIN users author
				ON post.user_id = author.id
				LEFT JOIN users parent_author
				ON parent.user_id = parent_author.id
				LEFT JOIN posts comments
				ON comments.parent_id = post.id
				LEFT JOIN attachments
				ON attachments.post_id = post.id
				WHERE author.id = $1
				AND post.parent_id IS NULL
				GROUP BY post.id, parent.id, author.id, parent_author.username, parent_author.display_name, parent_author.avatar_url
				ORDER BY post.created_at DESC
				LIMIT 50 OFFSET $2;`
		case "comments":
			selectQuery = `SELECT post.id as post_id,
			author.id as author_id, author.username as author_username, author.display_name as author_display_name, author.avatar_url as author_avatar_url,
			post.content as post_content, post.created_at as post_created_at,
			parent.id as parent_id, parent.content as parent_content,
			parent_author.username as parent_author_username, parent_author.display_name as parent_author_display_name, parent_author.avatar_url as parent_author_avatar_url,
			ARRAY_AGG(DISTINCT attachments.url) as attachments_urls, ARRAY_AGG(attachments.type) as attachments_types,
			(SELECT count(likes) FROM likes WHERE likes.post_id = post.id) as likes,
			count(comments) as comments,
			EXISTS (SELECT user_id FROM likes WHERE likes.post_id = post.id AND likes.user_id = $3)
				FROM posts post
				LEFT JOIN posts parent
				ON post.parent_id = parent.id
				INNER JOIN users author
				ON post.user_id = author.id
				LEFT JOIN users parent_author
				ON parent.user_id = parent_author.id
				LEFT JOIN posts comments
				ON comments.parent_id = post.id
				LEFT JOIN attachments
				ON attachments.post_id = post.id
				WHERE author.id = $1
				GROUP BY post.id, parent.id, author.id, parent_author.username, parent_author.display_name, parent_author.avatar_url
				ORDER BY post.created_at DESC
				LIMIT 50 OFFSET $2;`
		case "media":
			selectQuery = `SELECT post.id as post_id,
			author.id as author_id, author.username as author_username, author.display_name as author_display_name, author.avatar_url as author_avatar_url,
			post.content as post_content, post.created_at as post_created_at,
			parent.id as parent_id, parent.content as parent_content,
			parent_author.username as parent_author_username, parent_author.display_name as parent_author_display_name, parent_author.avatar_url as parent_author_avatar_url,
			ARRAY_AGG(DISTINCT attachments.url) as attachments_urls, ARRAY_AGG(attachments.type) as attachments_types,
			(SELECT count(likes) FROM likes WHERE likes.post_id = post.id) as likes,
			count(comments) as comments,
			EXISTS (SELECT user_id FROM likes WHERE likes.post_id = post.id AND likes.user_id = $3) as liked
				FROM posts post
				LEFT JOIN posts parent
				ON post.parent_id = parent.id
				INNER JOIN users author
				ON post.user_id = author.id
				LEFT JOIN users parent_author
				ON parent.user_id = parent_author.id
				LEFT JOIN posts comments
				ON comments.parent_id = post.id
				INNER JOIN attachments
				ON attachments.post_id = post.id
				WHERE author.id = $1
				GROUP BY post.id, parent.id, author.id, parent_author.username, parent_author.display_name, parent_author.avatar_url
				ORDER BY post.created_at DESC
				LIMIT 50 OFFSET $2;`
		}

		rows, err = db.DBPool.Query(context.Background(), selectQuery, authorId, page*50, userId)
		if err != nil {
			utils.InternalServerErrorWithJSON(w, "")
			logger.Errorf("Error while fetching posts: %v", err)
			return
		}
	} else {
		selectQuery = `SELECT post.id as post_id,
	author.id as author_id, author.username as author_username, author.display_name as author_display_name, author.avatar_url as author_avatar_url,
	post.content as post_content, post.created_at as post_created_at,
	parent.id as parent_id, parent.content as parent_content,
	parent_author.username as parent_author_username, parent_author.display_name as parent_author_display_name, parent_author.avatar_url as parent_author_avatar_url,
	ARRAY_AGG(DISTINCT attachments.url) as attachments_urls, ARRAY_AGG(attachments.type) as attachment_types,
	(SELECT count(likes) FROM likes WHERE likes.post_id = post.id) as likes,
	count(comments) as comments,
	EXISTS (SELECT user_id FROM likes WHERE likes.post_id = post.id AND likes.user_id = $2) as liked
		FROM posts post
		LEFT JOIN posts parent
		ON post.parent_id = parent.id
		INNER JOIN users author
		ON post.user_id = author.id
		LEFT JOIN users parent_author
		ON parent.user_id = parent_author.id
		LEFT JOIN posts comments
		ON comments.parent_id = post.id
		LEFT JOIN attachments
		ON attachments.post_id = post.id
		GROUP BY post.id, parent.id, author.id, parent_author.username, parent_author.display_name, parent_author.avatar_url
		ORDER BY post.created_at DESC
		LIMIT 50 OFFSET $1;`

		rows, err = db.DBPool.Query(context.Background(), selectQuery, page*50, userId)
		if err != nil {
			utils.InternalServerErrorWithJSON(w, "")
			logger.Errorf("Error while fetching posts: %v", err)
			return
		}
	}

	posts := make([]models.DBPost, 0)

	defer rows.Close()
	for rows.Next() {
		post := &models.DBPost{}
		parent := &models.ParentPost{}
		attachments := &models.DBAttachment{}
		var postId uint64
		var authorId uint64

		err = rows.Scan(&postId, &authorId,
			&post.Author.Username, &post.Author.DisplayName, &post.Author.AvatarURL,
			&post.Content, &post.CreatedAt,
			&parent.ID, &parent.Content, &parent.Author.Username, &parent.Author.DisplayName, &parent.Author.AvatarURL,
			&attachments.Urls, &attachments.Types,
			&post.Likes, &post.Comments, &post.Liked)
		if err != nil {
			utils.InternalServerErrorWithJSON(w, "")
			logger.Errorf("Error while scanning fetched posts into structs: %v", err)
			return
		}
		postAttachments := make([]models.Attachment, 0)
		for i := range attachments.Urls.Elements {
			// if returned attachments is an array of null
			if attachments.Urls.Elements[i].String == "" {
				break
			}
			postAttachment := &models.Attachment{}
			postAttachment.Url = attachments.Urls.Elements[i].String
			postAttachment.Type = attachments.Types.Elements[i].String
			postAttachments = append(postAttachments, *postAttachment)
		}

		post.ID = fmt.Sprintf("%v", postId)
		post.Author.ID = fmt.Sprintf("%v", authorId)
		post.ReplyingTo = *parent
		post.Attachments = postAttachments
		posts = append(posts, *post)
	}

	err = rows.Err()
	if err != nil {
		utils.InternalServerErrorWithJSON(w, "")
		logger.Errorf("Rows error: %v", err)
		return
	}

	utils.OkWithJSON(w, fmt.Sprintf(`{
		"message": "Successfully fetched posts",
		"status": "200",
		"success": true,
		"posts": %v
	}`, utils.MarshalJSON(posts)))
}

func GetPost(w http.ResponseWriter, req *http.Request) {
	postIdIn := req.URL.Query().Get("postId")
	var userId uint64

	session := redissession.GetSession(req)

	sessionUser, ok := session.Values["user"].(*models.User)
	if ok {
		id, err := strconv.Atoi(sessionUser.ID)
		if err != nil {
			utils.InternalServerErrorWithJSON(w, "")
			logger.Errorf("Error while converting string to int: %v", err)
			return
		}
		userId = uint64(id)
	} else {
		userId = 0
	}

	query := `SELECT post.id as post_id,
author.id as author_id, author.username as author_username, author.display_name as author_display_name, author.avatar_url as author_avatar_url,
post.content as post_content, post.created_at as post_created_at,
parent.id as parent_id, parent.content as parent_content,
parent_author.username as parent_author_username, parent_author.display_name as parent_author_display_name, parent_author.avatar_url as parent_author_avatar_url,
ARRAY_AGG(DISTINCT attachments.url) as attachments_urls, ARRAY_AGG(attachments.type) as attachments_types,
(SELECT count(likes) FROM likes WHERE likes.post_id = $1) as likes,
count(comments) as comments,
EXISTS (SELECT user_id FROM likes WHERE likes.post_id = $1 AND likes.user_id = $2) as liked
FROM posts post
INNER JOIN users author
ON post.user_id = author.id
LEFT JOIN posts parent
ON post.parent_id = parent.id
LEFT JOIN users parent_author
ON parent.user_id = parent_author.id
LEFT JOIN posts comments
ON comments.parent_id = post.id
LEFT JOIN attachments
ON attachments.post_id = post.id
WHERE post.id = $1
GROUP BY post.id, author.id, parent.id, parent_author.username, parent_author.display_name, parent_author.avatar_url;`
	post := &models.DBPost{}
	parent := &models.ParentPost{}
	attachments := &models.DBAttachment{}
	var postIdOut uint64
	var authorId uint64

	err := db.DBPool.QueryRow(context.Background(), query, postIdIn, userId).Scan(&postIdOut,
		&authorId, &post.Author.Username, &post.Author.DisplayName, &post.Author.AvatarURL,
		&post.Content, &post.CreatedAt,
		&parent.ID, &parent.Content, &parent.Author.Username, &parent.Author.DisplayName, &parent.Author.AvatarURL,
		&attachments.Urls, &attachments.Types,
		&post.Likes,
		&post.Comments,
		&post.Liked)

	postAttachments := make([]models.Attachment, 0)
	for i := range attachments.Urls.Elements {
		// if returned attachments is an array of null
		if attachments.Urls.Elements[i].String == "" {
			break
		}
		postAttachment := &models.Attachment{}
		postAttachment.Url = attachments.Urls.Elements[i].String
		postAttachment.Type = attachments.Types.Elements[i].String
		postAttachments = append(postAttachments, *postAttachment)
	}

	post.ID = fmt.Sprintf("%v", postIdOut)
	post.Author.ID = fmt.Sprintf("%v", authorId)
	post.Attachments = postAttachments
	post.ReplyingTo = *parent
	if err != nil {
		if err == pgx.ErrNoRows {
			utils.NotFoundWithJSON(w, `{
				"message": "Post not found",
				"status": 404,
				"success": false
			}`)
			logger.Infof("Post with id: %v not found", postIdIn)
			return
		}
		utils.InternalServerErrorWithJSON(w, "")
		logger.Errorf("Error while scanning post data into struct: %v", err)
		return
	}

	utils.OkWithJSON(w, fmt.Sprintf(`{
		"message": "Successfully fetched post",
		"status": 200,
		"success": true,
		"post": %v
	}`, utils.MarshalJSON(post)))
}

func GetComments(w http.ResponseWriter, req *http.Request) {
	params := mux.Vars(req)

	postId := params["postId"]
	var userId uint64

	session := redissession.GetSession(req)

	sessionUser, ok := session.Values["user"].(*models.User)
	if ok {
		id, err := strconv.Atoi(sessionUser.ID)
		if err != nil {
			utils.InternalServerErrorWithJSON(w, "")
			logger.Errorf("Error while converting string to int: %v", err)
			return
		}
		userId = uint64(id)
	} else {
		userId = 0
	}

	query := `SELECT comment.id as comment_id,
author.id as author_id, author.username as author_username, author.display_name as author_display_name, author.avatar_url as author_avatar_url,
comment.content as comment_content, comment.created_at as comment_created_at,
ARRAY_AGG(DISTINCT attachments.url) as attachments_urls, ARRAY_AGG(attachments.type) as attachments_types,
(SELECT count(likes) FROM likes WHERE likes.post_id = comment.id) as likes,
count(comments) as comments,
EXISTS (SELECT user_id FROM likes WHERE likes.post_id = comment.id AND likes.user_id = $2)
FROM posts comment
INNER JOIN users author
ON comment.user_id = author.id
LEFT JOIN posts comments
ON comments.parent_id = comment.id
LEFT JOIN attachments
ON attachments.post_id = comment.id
WHERE comment.parent_id = $1
GROUP BY comment.id, author.id;`

	rows, err := db.DBPool.Query(context.Background(), query, postId, userId)
	if err != nil {
		if err == pgx.ErrNoRows {
			utils.NotFoundWithJSON(w, `{
				"message": "No comments were found",
				"status": 404,
				"success": true
			}`)
		} else {
			utils.InternalServerErrorWithJSON(w, "")
			logger.Errorf("Error while fetching comments: %v", err)
		}
		return
	}

	comments := make([]models.DBPost, 0)

	defer rows.Close()
	for rows.Next() {
		comment := &models.DBPost{}
		attachments := &models.DBAttachment{}
		var commentId uint64

		err = rows.Scan(&commentId,
			&comment.Author.ID, &comment.Author.Username, &comment.Author.DisplayName, &comment.Author.AvatarURL,
			&comment.Content, &comment.CreatedAt,
			&attachments.Urls, &attachments.Types,
			&comment.Likes, &comment.Comments, &comment.Liked)
		if err != nil {
			utils.InternalServerErrorWithJSON(w, "")
			logger.Errorf("Error while scanning comments data into structs: %v", err)
			return
		}

		commentAttachments := make([]models.Attachment, 0)
		for i := range attachments.Urls.Elements {
			// if returned attachments is an array of null
			if attachments.Urls.Elements[i].String == "" {
				break
			}
			commentAttachment := &models.Attachment{}
			commentAttachment.Url = attachments.Urls.Elements[i].String
			commentAttachment.Type = attachments.Types.Elements[i].String
			commentAttachments = append(commentAttachments, *commentAttachment)
		}

		comment.ID = fmt.Sprintf("%v", commentId)
		comment.Attachments = commentAttachments
		comments = append(comments, *comment)
	}

	err = rows.Err()
	if err != nil {
		utils.InternalServerErrorWithJSON(w, "")
		logger.Errorf("Rows error: %v", err)
		return
	}

	utils.OkWithJSON(w, fmt.Sprintf(`{
		"message": "Successfully fetched comments",
		"status": 200,
		"success": true,
		"comments": %v
	}`, utils.MarshalJSON(comments)))
}
