package graph

// This file will be automatically regenerated based on the schema, any resolver implementations
// will be copied through when generating and any unknown code will be moved to the end.

import (
	"api/server/db"
	"api/server/graph/model"
	"context"
)

func (r *mutationResolver) CreateStudents(ctx context.Context, input []*model.CreateStudentInput) ([]*model.CreateStudentResult, error) {
	createdStudents := []*model.CreateStudentResult{}
	for _, student := range input {
		created, err := r.Client.User.UpsertOne(
			db.User.ID.Equals(student.ID),
		).Create(
			db.User.ID.Set(student.ID),
			db.User.Email.Set(student.Email),
			db.User.Name.Set(student.Name),
			db.User.Surname.Set(student.Surname),
		).Update(
			db.User.Email.Set(student.Email),
			db.User.Name.Set(student.Name),
			db.User.Surname.Set(student.Surname),
		).Exec(ctx)
		if err != nil {
			return []*model.CreateStudentResult{}, err
		}
		r.Client.Student.CreateOne(
			db.Student.User.Link(
				db.User.ID.Equals(created.ID),
			),
		).Exec(ctx)
		createdStudents = append(createdStudents, &model.CreateStudentResult{
			ID: created.ID,
		})
	}
	return createdStudents, nil
}
