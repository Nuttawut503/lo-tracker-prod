//go:generate go run github.com/prisma/prisma-client-go generate

package main

import (
	"api/server/auth"
	"api/server/db"
	"api/server/graph"
	"api/server/graph/generated"
	"context"
	"log"
	"os"
	"time"

	"github.com/99designs/gqlgen/graphql"
	"github.com/99designs/gqlgen/graphql/handler"
	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/go-redis/redis/v8"
	"github.com/spf13/viper"
)

func init() {
	viper.SetConfigFile(".env")
	if err := viper.ReadInConfig(); err != nil {
		panic(err)
	}
	if !viper.IsSet("API_PORT") {
		log.Fatal("API_PORT isn't set in .env file")
	}
	os.Setenv("DATABASE_URL", viper.GetString("DATABASE_URL"))
}

var (
	client *db.PrismaClient
	rdb    *redis.Client
)

func init() {
	client = db.NewClient()
	rdb = redis.NewClient(&redis.Options{
		Addr: viper.GetString("REDIS_URL"),
	})
}

func main() {
	i := 0
	for {
		err := client.Prisma.Connect()
		if err == nil {
			break
		} else if i > 2 {
			panic(err)
		}
		time.Sleep(5 * time.Second)
		i++
	}
	defer func() {
		if err := client.Prisma.Disconnect(); err != nil {
			panic(err)
		}
	}()

	ctx := context.Background()
	if _, err := rdb.Ping(ctx).Result(); err != nil {
		rdb = nil
		log.Println(err)
	}

	gin.SetMode(gin.ReleaseMode)
	r := gin.New()
	r.Use(func(c *gin.Context) {
		start := time.Now()
		path := c.Request.URL.Path
		raw := c.Request.URL.RawQuery
		if raw != "" {
			path += "?" + raw
		}

		// Process request
		c.Next()

		// Stop timer
		timeStamp := time.Now()
		latency := timeStamp.Sub(start)
		bodySize := c.Writer.Size()
		statusCode := c.Writer.Status()
		errorMessage := c.Errors.ByType(1).String()
		if val, ok := c.Value("operation_context").(*graphql.OperationContext); ok {
			log.Println(val.OperationName, statusCode, latency, bodySize, errorMessage)
		} else {
			log.Println(statusCode, latency, bodySize, errorMessage)
		}
	})
	r.Use(gin.Recovery())
	config := cors.DefaultConfig()
	config.AllowOrigins = []string{"http://localhost:3000", "http://nextjs:3000"}
	config.AllowOriginFunc = func(origin string) bool {
		log.Println(origin)
		return true
	}
	config.AllowCredentials = true
	config.AllowHeaders = append(config.AllowHeaders, "Authorization")
	r.Use(cors.New(config))

	auth.SetAuthRouter(r.Group("/auth"), client, rdb, ctx)
	r.POST("/query", auth.GetMiddleware(rdb, ctx), func(c *gin.Context) {
		handler.NewDefaultServer(
			generated.NewExecutableSchema(
				generated.Config{Resolvers: &graph.Resolver{Client: client}},
			),
		).ServeHTTP(c.Writer, c.Request)
	})
	r.Run(":" + viper.GetString("API_PORT"))
}
