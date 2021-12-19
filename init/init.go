package main

import (
	"api/server/db"
	"context"
	"log"
	"os"

	"github.com/spf13/viper"
)

type Teacher struct {
	ID        string
	Email     string
	Name      string
	Surname   string
	RoleLevel int
}

var teachers = []*Teacher{
	{
		ID:        "1234",
		Email:     "abc@example.com",
		Name:      "Ant",
		Surname:   "Bird",
		RoleLevel: 3,
	},
	{
		ID:        "1235",
		Email:     "def@example.com",
		Name:      "Cat",
		Surname:   "Dog",
		RoleLevel: 2,
	},
}

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

func main() {
	client := db.NewClient()
	if err := client.Prisma.Connect(); err != nil {
		panic(err)
	}
	defer func() {
		if err := client.Prisma.Disconnect(); err != nil {
			panic(err)
		}
	}()

	ctx := context.Background()
	for _, teacher := range teachers {
		if teacher.RoleLevel < 1 && teacher.RoleLevel > 3 {
			continue
		}
		_, _ = client.User.UpsertOne(
			db.User.ID.Equals(teacher.ID),
		).Create(
			db.User.ID.Set(teacher.ID),
			db.User.Email.Set(teacher.Email),
			db.User.Name.Set(teacher.Name),
			db.User.Surname.Set(teacher.Surname),
		).Update(
			db.User.Email.Set(teacher.Email),
			db.User.Name.Set(teacher.Name),
			db.User.Surname.Set(teacher.Surname),
		).Exec(ctx)
		_, _ = client.Teacher.UpsertOne(
			db.Teacher.ID.Equals(teacher.ID),
		).Create(
			db.Teacher.User.Link(
				db.User.ID.Equals(teacher.ID),
			),
			db.Teacher.Role.Set(teacher.RoleLevel),
		).Update(
			db.Teacher.Role.Set(teacher.RoleLevel),
		).Exec(ctx)
	}
}
