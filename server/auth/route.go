package auth

import (
	"api/server/db"
	"context"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/go-redis/redis/v8"
	"github.com/golang-jwt/jwt/v4"
	"github.com/google/uuid"
	"github.com/spf13/viper"
)

func GetMiddleware(rdb *redis.Client, ctx context.Context) gin.HandlerFunc {
	return func(c *gin.Context) {
		var claims jwt.MapClaims
		if accessToken, err := extractToken(c.Request.Header); err != nil {
			c.AbortWithStatus(http.StatusUnauthorized)
			return
		} else if t, err := verifyToken(accessToken, viper.GetString("ACCESS_SECRET")); err != nil || !isValid(t) {
			c.AbortWithStatus(http.StatusBadRequest)
			return
		} else {
			claims = t.Claims.(jwt.MapClaims)
		}
		id := ""
		if rdb != nil {
			accessUUID, ok := claims["access_uuid"].(string)
			if !ok {
				c.AbortWithStatus(http.StatusBadRequest)
				return
			}
			userID, err := rdb.Get(ctx, accessUUID).Result()
			if err != nil || userID != claims["user_id"].(string) {
				c.AbortWithStatus(http.StatusUnauthorized)
				return
			}
			id = userID
		} else {
			id = claims["user_id"].(string)
		}
		c.Request = c.Request.WithContext(context.WithValue(c.Request.Context(), "user_id", id))
		c.Next()
	}
}

func SetAuthRouter(r *gin.RouterGroup, client *db.PrismaClient, rdb *redis.Client, ctx context.Context) {
	r.POST("/login", func(c *gin.Context) {
		loginForm := struct {
			UserID   string `json:"userid"`
			Password string `json:"password"`
		}{}
		if err := c.ShouldBindJSON(&loginForm); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "wrong format"})
			return
		}
		userID := loginForm.UserID
		teacher, _ := client.Teacher.FindUnique(
			db.Teacher.ID.Equals(userID),
		).With(db.Teacher.User.Fetch()).Exec(ctx)
		student, _ := client.Student.FindUnique(
			db.Student.ID.Equals(userID),
		).With(db.Student.User.Fetch()).Exec(ctx)
		var username, email string
		isTeacher := false
		level := 0
		if teacher == nil && student == nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "user not found"})
			return
		} else if teacher != nil {
			isTeacher = true
			level = teacher.Role
			username = teacher.User().Name
			email = teacher.User().Email
		} else {
			username = student.User().Name
			email = student.User().Email
		}
		accessUUID := uuid.New().String()
		refreshUUID := uuid.New().String()
		now := time.Now()
		accessToken, err := createAccessToken(accessUUID, loginForm.UserID, now.Add(access_lifetime).Unix())
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "to create access failed"})
			return
		}
		refreshToken, err := createRefreshToken(refreshUUID, loginForm.UserID, now.Add(refresh_lifetime).Unix())
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "to create refresh failed"})
		}
		if rdb != nil {
			if err := rdb.Set(ctx, accessUUID, loginForm.UserID, access_lifetime).Err(); err != nil {
				c.JSON(http.StatusUnprocessableEntity, gin.H{"error": "to save access failed"})
				return
			}
			if err := rdb.Set(ctx, refreshUUID, loginForm.UserID, refresh_lifetime).Err(); err != nil {
				c.JSON(http.StatusUnprocessableEntity, gin.H{"error": "to save refresh failed"})
				return
			}
		}
		c.JSON(http.StatusOK, map[string]interface{}{
			"access_token":  accessToken,
			"refresh_token": refreshToken,
			"access_exp":    now.Add(access_lifetime).Unix(),
			"refresh_exp":   now.Add(refresh_lifetime).Unix(),
			"is_teacher":    isTeacher,
			"role_level":    level,
			"username":      username,
			"email":         email,
		})
	})
}
