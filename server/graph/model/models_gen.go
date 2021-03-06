// Code generated by github.com/99designs/gqlgen, DO NOT EDIT.

package model

import (
	"time"
)

type Course struct {
	ID          string `json:"id"`
	Name        string `json:"name"`
	Description string `json:"description"`
	Semester    int    `json:"semester"`
	Year        int    `json:"year"`
	PloGroupID  string `json:"ploGroupID"`
	ProgramID   string `json:"programID"`
	TeacherID   string `json:"teacherID"`
}

type CreateCourseInput struct {
	Name        string `json:"name"`
	Description string `json:"description"`
	Semester    int    `json:"semester"`
	Year        int    `json:"year"`
	PloGroupID  string `json:"ploGroupID"`
}

type CreateLOInput struct {
	Title       string `json:"title"`
	Level       int    `json:"level"`
	Description string `json:"description"`
}

type CreateLOLevelInput struct {
	Level       int    `json:"level"`
	Description string `json:"description"`
}

type CreateLOLinkResult struct {
	LoID  string `json:"loID"`
	PloID string `json:"ploID"`
}

type CreateLOResult struct {
	ID string `json:"id"`
}

type CreateLOsInput struct {
	Title  string                `json:"title"`
	Levels []*CreateLOLevelInput `json:"levels"`
}

type CreatePLOInput struct {
	Title       string `json:"title"`
	Description string `json:"description"`
}

type CreatePLOsInput struct {
	Title       string `json:"title"`
	Description string `json:"description"`
}

type CreateProgramInput struct {
	Name        string `json:"name"`
	Description string `json:"description"`
}

type CreateQuestionInput struct {
	Title    string                       `json:"title"`
	MaxScore int                          `json:"maxScore"`
	Results  []*CreateQuestionResultInput `json:"results"`
}

type CreateQuestionLinkInput struct {
	QuestionID string `json:"questionID"`
	LoID       string `json:"loID"`
	Level      int    `json:"level"`
}

type CreateQuestionLinkResult struct {
	QuestionID string `json:"questionID"`
	LoID       string `json:"loID"`
}

type CreateQuestionResultInput struct {
	StudentID string `json:"studentID"`
	Score     int    `json:"score"`
}

type CreateQuizInput struct {
	Name      string                 `json:"name"`
	CreatedAt time.Time              `json:"createdAt"`
	Questions []*CreateQuestionInput `json:"questions"`
}

type CreateQuizResult struct {
	ID string `json:"id"`
}

type CreateStudentInput struct {
	ID      string `json:"id"`
	Email   string `json:"email"`
	Name    string `json:"name"`
	Surname string `json:"surname"`
}

type CreateStudentResult struct {
	ID string `json:"id"`
}

type DashboardFlat struct {
	Students  []*User                  `json:"students"`
	Plos      []*Plo                   `json:"plos"`
	Los       []*Lo                    `json:"los"`
	Questions []*DashboardFlatQuestion `json:"questions"`
}

type DashboardFlatQuestion struct {
	Title      string                         `json:"title"`
	MaxScore   int                            `json:"maxScore"`
	LinkedPLOs []string                       `json:"linkedPLOs"`
	LinkedLOs  []string                       `json:"linkedLOs"`
	Results    []*DashboardFlatQuestionResult `json:"results"`
}

type DashboardFlatQuestionResult struct {
	StudentID    string `json:"studentID"`
	StudentScore int    `json:"studentScore"`
}

type DashboardIndividual struct {
	PloGroups []*DashboardIndividualPLOGroup `json:"ploGroups"`
	Courses   []*DashboardIndividualCourse   `json:"courses"`
}

type DashboardIndividualCourse struct {
	Name     string                           `json:"name"`
	Semester int                              `json:"semester"`
	Year     int                              `json:"year"`
	Los      []*DashboardIndividualCourseLo   `json:"los"`
	Quizzes  []*DashboardIndividualCourseQuiz `json:"quizzes"`
}

type DashboardIndividualCourseLo struct {
	ID         string                              `json:"id"`
	Title      string                              `json:"title"`
	Levels     []*DashboardIndividualCourseLOLevel `json:"levels"`
	Percentage float64                             `json:"percentage"`
}

type DashboardIndividualCourseLOLevel struct {
	Level       int    `json:"level"`
	Description string `json:"description"`
}

type DashboardIndividualCourseQuiz struct {
	ID           string   `json:"id"`
	Name         string   `json:"name"`
	MaxScore     int      `json:"maxScore"`
	StudentScore int      `json:"studentScore"`
	Los          []string `json:"los"`
}

type DashboardIndividualPlo struct {
	Title       string  `json:"title"`
	Description string  `json:"description"`
	Percentage  float64 `json:"percentage"`
}

type DashboardIndividualPLOGroup struct {
	Name string                    `json:"name"`
	Plos []*DashboardIndividualPlo `json:"plos"`
}

type DashboardPLOGroup struct {
	Name     string                     `json:"name"`
	Plos     []*DashboardPLOGroupDetail `json:"plos"`
	Students []*User                    `json:"students"`
}

type DashboardPLOGroupDetail struct {
	Title       string                        `json:"title"`
	Description string                        `json:"description"`
	Stats       *DashboardPLOGroupDetailStats `json:"stats"`
}

type DashboardPLOGroupDetailStats struct {
	Min    float64 `json:"min"`
	Max    float64 `json:"max"`
	Mean   float64 `json:"mean"`
	Median float64 `json:"median"`
}

type DashboardPLOSummary struct {
	PloID string   `json:"ploID"`
	LoID  []string `json:"loID"`
}

type DashboardResult struct {
	QuizName string                `json:"quizName"`
	MaxScore int                   `json:"maxScore"`
	Results  []*DashboardResultSub `json:"results"`
}

type DashboardResultSub struct {
	StudentID    string `json:"studentID"`
	StudentName  string `json:"studentName"`
	StudentScore int    `json:"studentScore"`
}

type DeleteCourseResult struct {
	ID string `json:"id"`
}

type DeleteLOLevelResult struct {
	ID string `json:"id"`
}

type DeleteLOLinkResult struct {
	LoID  string `json:"loID"`
	PloID string `json:"ploID"`
}

type DeleteLOResult struct {
	ID string `json:"id"`
}

type DeleteQuestionLinkInput struct {
	QuestionID string `json:"questionID"`
	LoID       string `json:"loID"`
	Level      int    `json:"level"`
}

type DeleteQuestionLinkResult struct {
	QuestionID string `json:"questionID"`
	LoID       string `json:"loID"`
}

type DeleteQuizResult struct {
	ID string `json:"id"`
}

type EditLOLevelResult struct {
	ID    string `json:"id"`
	Level int    `json:"level"`
}

type EditLOResult struct {
	ID string `json:"id"`
}

type EditQuizResult struct {
	ID string `json:"id"`
}

type Lo struct {
	ID       string     `json:"id"`
	Title    string     `json:"title"`
	Levels   []*LOLevel `json:"levels"`
	PloLinks []*Plo     `json:"ploLinks"`
}

type LOLevel struct {
	Level       int    `json:"level"`
	Description string `json:"description"`
}

type Plo struct {
	ID          string `json:"id"`
	Title       string `json:"title"`
	Description string `json:"description"`
	PloGroupID  string `json:"ploGroupID"`
}

type PLOGroup struct {
	ID   string `json:"id"`
	Name string `json:"name"`
}

type Program struct {
	ID          string `json:"id"`
	Name        string `json:"name"`
	Description string `json:"description"`
	TeacherID   string `json:"teacherID"`
}

type Question struct {
	ID       string            `json:"id"`
	Title    string            `json:"title"`
	MaxScore int               `json:"maxScore"`
	Results  []*QuestionResult `json:"results"`
	LoLinks  []*QuestionLink   `json:"loLinks"`
}

type QuestionLink struct {
	LoID        string `json:"loID"`
	Level       int    `json:"level"`
	Description string `json:"description"`
}

type QuestionResult struct {
	StudentID string `json:"studentID"`
	Score     int    `json:"score"`
}

type Quiz struct {
	ID        string      `json:"id"`
	Name      string      `json:"name"`
	CreatedAt time.Time   `json:"createdAt"`
	Questions []*Question `json:"questions"`
}

type User struct {
	ID      string `json:"id"`
	Email   string `json:"email"`
	Name    string `json:"name"`
	Surname string `json:"surname"`
}

type AddPLOsResult struct {
	ID string `json:"id"`
}

type DeletePLOGroupResult struct {
	ID string `json:"id"`
}

type DeletePLOResult struct {
	ID string `json:"id"`
}
