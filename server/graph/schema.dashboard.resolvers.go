package graph

// This file will be automatically regenerated based on the schema, any resolver implementations
// will be copied through when generating and any unknown code will be moved to the end.

import (
	"api/server/db"
	"api/server/graph/model"
	"context"
	"sort"
	"strconv"
)

func (r *queryResolver) QuizResults(ctx context.Context, courseID string) ([]*model.DashboardResult, error) {
	allQuizzes, err := r.Client.Quiz.FindMany(
		db.Quiz.CourseID.Equals(courseID),
	).With(
		db.Quiz.Questions.Fetch().With(
			db.Question.Results.Fetch().With(
				db.QuestionResult.Student.Fetch().With(
					db.Student.User.Fetch(),
				),
			),
		),
	).Exec(ctx)
	if err != nil {
		return []*model.DashboardResult{}, err
	}
	response := []*model.DashboardResult{}
	for _, quiz := range allQuizzes {
		maxScore := 0
		studentScore := map[string]*model.DashboardResultSub{}
		for _, question := range quiz.Questions() {
			maxScore += question.MaxScore
			for _, result := range question.Results() {
				if _, added := studentScore[result.StudentID]; !added {
					studentScore[result.StudentID] = &model.DashboardResultSub{
						StudentID:    result.StudentID,
						StudentName:  result.Student().User().Name,
						StudentScore: 0,
					}
				}
				studentScore[result.StudentID].StudentScore += result.Score
			}
		}
		results := []*model.DashboardResultSub{}
		for _, result := range studentScore {
			results = append(results, result)
		}
		response = append(response, &model.DashboardResult{
			QuizName: quiz.Name,
			MaxScore: maxScore,
			Results:  results,
		})
	}
	return response, nil
}

func (r *queryResolver) PloSummary(ctx context.Context, courseID string) ([]*model.DashboardPLOSummary, error) {
	allRelatedLOs, err := r.Client.LO.FindMany(
		db.LO.CourseID.Equals(courseID),
	).With(
		db.LO.Links.Fetch().With(db.LOlink.Plo.Fetch()),
	).Exec(ctx)
	if err != nil {
		return []*model.DashboardPLOSummary{}, err
	}
	plos := map[string][]string{}
	for _, lo := range allRelatedLOs {
		for _, link := range lo.Links() {
			if _, added := plos[link.PloID]; !added {
				plos[link.PloID] = make([]string, 0)
			}
			plos[link.PloID] = append(plos[link.PloID], link.LoID)
		}
	}
	response := []*model.DashboardPLOSummary{}
	for ploID, los := range plos {
		response = append(response, &model.DashboardPLOSummary{
			PloID: ploID,
			LoID:  los,
		})
	}
	return response, nil
}

func (r *queryResolver) FlatSummary(ctx context.Context, courseID string) (*model.DashboardFlat, error) {
	students, err := r.StudentsInCourse(ctx, courseID)
	if err != nil {
		return &model.DashboardFlat{}, nil
	}
	allQuestions, err := r.Client.Question.FindMany(
		db.Question.Quiz.Where(
			db.Quiz.CourseID.Equals(courseID),
		),
	).With(
		db.Question.Links.Fetch().With(
			db.QuestionLink.LoLevel.Fetch().With(
				db.LOlevel.Lo.Fetch().With(
					db.LO.Links.Fetch().With(db.LOlink.Plo.Fetch()),
				),
			),
		),
		db.Question.Results.Fetch(),
	).Exec(ctx)
	if err != nil {
		return &model.DashboardFlat{}, nil
	}
	response := &model.DashboardFlat{
		Students:  students,
		Plos:      []*model.Plo{},
		Los:       []*model.Lo{},
		Questions: []*model.DashboardFlatQuestion{},
	}
	includedPLOsGlobal := map[string]bool{}
	includedLOsGlobal := map[string]*model.Lo{}
	for _, question := range allQuestions {
		results := []*model.DashboardFlatQuestionResult{}
		includedPLOsLocal := map[string]bool{}
		includedLOsLocal := map[string]bool{}
		for _, result := range question.Results() {
			results = append(results, &model.DashboardFlatQuestionResult{
				StudentID:    result.StudentID,
				StudentScore: result.Score,
			})
		}
		for _, lo := range question.Links() {
			for _, link := range lo.LoLevel().Lo().Links() {
				ploID := link.Plo().ID
				if _, addedLocal := includedPLOsLocal[ploID]; !addedLocal {
					includedPLOsLocal[link.Plo().ID] = true
					if _, addedGlobal := includedPLOsGlobal[ploID]; !addedGlobal {
						response.Plos = append(response.Plos, &model.Plo{
							ID:          link.PloID,
							Title:       link.Plo().Title,
							Description: link.Plo().Description,
							PloGroupID:  link.Plo().PloGroupID,
						})
					}
				}
			}
			loID := lo.LoLevel().LoID
			loLevel := strconv.Itoa(lo.LoLevel().Level)
			if _, addedLocal := includedLOsLocal[loID+","+loLevel]; !addedLocal {
				includedLOsLocal[loID+","+loLevel] = true
				if _, addedGlobal := includedLOsGlobal[loID]; !addedGlobal {
					includedLOsGlobal[loID] = &model.Lo{
						ID:     lo.LoLevel().LoID,
						Title:  lo.LoLevel().Lo().Title,
						Levels: []*model.LOLevel{{Level: lo.LoLevel().Level, Description: lo.LoLevel().Description}},
					}
				} else {
					found := false
					for _, loLevel := range includedLOsGlobal[loID].Levels {
						if loLevel.Level == lo.LoLevel().Level {
							found = true
							break
						}
					}
					if !found {
						temp := includedLOsGlobal[lo.LoLevel().LoID]
						temp.Levels = append(temp.Levels, &model.LOLevel{Level: lo.LoLevel().Level, Description: lo.LoLevel().Description})
						includedLOsGlobal[lo.LoLevel().LoID] = temp
					}
				}
			}
		}
		linkedPLOs := []string{}
		linkedLOs := []string{}
		for ploID := range includedPLOsLocal {
			linkedPLOs = append(linkedPLOs, ploID)
		}
		for loIDLevel := range includedLOsLocal {
			linkedLOs = append(linkedLOs, loIDLevel)
		}
		response.Questions = append(response.Questions, &model.DashboardFlatQuestion{
			Title:      question.Title,
			MaxScore:   question.MaxScore,
			LinkedPLOs: linkedPLOs,
			LinkedLOs:  linkedLOs,
			Results:    results,
		})
	}
	for _, lo := range includedLOsGlobal {
		response.Los = append(response.Los, lo)
	}
	return response, nil
}

func (r *queryResolver) IndividualSummary(ctx context.Context, studentID string) (*model.DashboardIndividual, error) {
	allQuestionResults, err := r.Client.QuestionResult.FindMany(
		db.QuestionResult.Student.Where(
			db.Student.ID.Equals(studentID),
		),
	).With(
		db.QuestionResult.Question.Fetch().With(
			db.Question.Quiz.Fetch().With(
				db.Quiz.Course.Fetch(),
			),
			db.Question.Links.Fetch().With(
				db.QuestionLink.LoLevel.Fetch().With(
					db.LOlevel.Lo.Fetch().With(
						db.LO.Links.Fetch().With(
							db.LOlink.Plo.Fetch().With(
								db.PLO.PloGroup.Fetch(),
							),
						),
					),
				),
			),
		),
	).Exec(ctx)
	if err != nil {
		return &model.DashboardIndividual{}, err
	}
	type CustomPLOGroup struct {
		Name string
		Plos map[string]*model.DashboardIndividualPlo
	}
	courseMap := map[string]*model.DashboardIndividualCourse{}
	ploGroupMap := map[string]*CustomPLOGroup{}
	loCount := map[string]int{}
	ploCount := map[string]int{}

	for _, result := range allQuestionResults {
		var idvCourse *model.DashboardIndividualCourse
		question := result.Question()
		quiz := question.Quiz()
		thisPercent := float64(result.Score) / float64(question.MaxScore)

		course := quiz.Course()
		if val, ok := courseMap[course.ID]; ok {
			idvCourse = val
		} else {
			idvCourse = &model.DashboardIndividualCourse{
				Name:     course.Name,
				Semester: course.Semester,
				Year:     course.Year,
				Los:      []*model.DashboardIndividualCourseLo{},
				Quizzes:  []*model.DashboardIndividualCourseQuiz{},
			}
		}
		idvLos := idvCourse.Los
		idvQuizzes := idvCourse.Quizzes
		var idvQuiz *model.DashboardIndividualCourseQuiz
		quizFound := false
		for _, val := range idvQuizzes {
			if val.ID == quiz.ID {
				idvQuiz = val
				idvQuiz.MaxScore += question.MaxScore
				idvQuiz.StudentScore += result.Score
				quizFound = true
				break
			}
		}
		if !quizFound {
			idvQuiz = &model.DashboardIndividualCourseQuiz{
				ID:           quiz.ID,
				Name:         quiz.Name,
				MaxScore:     question.MaxScore,
				StudentScore: result.Score,
				Los:          []string{},
			}
		}

		for _, qlink := range question.Links() {
			loLevel := qlink.LoLevel().Level
			loDescription := qlink.LoLevel().Description
			loTitle := qlink.LoLevel().Lo().Title
			loID := qlink.LoLevel().Lo().ID
			// begin: Course_LO update
			var idvLo *model.DashboardIndividualCourseLo
			loFound := false
			for _, val := range idvLos {
				// check if this course already has the LO
				if val.ID == loID {
					// if found, update the value
					idvLo = val
					lolevelFound := false
					for _, val := range idvLo.Levels {
						if val.Level == loLevel {
							lolevelFound = true
							break
						}
					}
					if !lolevelFound {
						idvLo.Levels = append(idvLo.Levels, &model.DashboardIndividualCourseLOLevel{
							Level:       loLevel,
							Description: loDescription,
						})
					}
					n := loCount[loID]
					idvLo.Percentage = (idvLo.Percentage*float64(n) + thisPercent) / float64(n+1)
					loFound = true
					break
				}
			}
			if !loFound {
				// if this course doesn't have this LO yet
				idvLos = append(idvLos, &model.DashboardIndividualCourseLo{
					ID:         loID,
					Title:      loTitle,
					Percentage: thisPercent,
					Levels: []*model.DashboardIndividualCourseLOLevel{
						{Level: loLevel, Description: loDescription},
					},
				})
			}
			loCount[loID] += 1
			// end: Course_LO update
			// begin: Course_Quiz_Link update
			found := false
			for _, lostring := range idvQuiz.Los {
				if lostring == loID+","+strconv.Itoa(loLevel) {
					found = true
					break
				}
			}
			if !found {
				idvQuiz.Los = append(idvQuiz.Los, loID+","+strconv.Itoa(loLevel))
			}
			// end: Course_Quiz_Link update

			for _, llink := range qlink.LoLevel().Lo().Links() {
				ploID := llink.Plo().ID
				ploTitle := llink.Plo().Title
				ploDescription := llink.Plo().Description
				ploGroupName := llink.Plo().PloGroup().Name
				ploGroupID := llink.Plo().PloGroup().ID
				// begin: PLO update
				if _, created := ploGroupMap[ploGroupID]; !created {
					// create base ploGroup if this ploGroup hasn't been created
					ploGroupMap[ploGroupID] = &CustomPLOGroup{
						Name: ploGroupName,
						Plos: map[string]*model.DashboardIndividualPlo{},
					}
				}
				if _, has := ploGroupMap[ploGroupID].Plos[ploID]; !has {
					// add base PLO to this ploGroup if not exist yet
					ploGroupMap[ploGroupID].Plos[ploID] = &model.DashboardIndividualPlo{
						Title:       ploTitle,
						Description: ploDescription,
						Percentage:  thisPercent,
					}
				} else {
					// if this PLO already exist, update the percentage
					n := ploCount[ploID]
					oldPercent := ploGroupMap[ploGroupID].Plos[ploID].Percentage
					ploGroupMap[ploGroupID].Plos[ploID].Percentage = (oldPercent*float64(n) + thisPercent) / float64(n+1)
				}
				ploCount[ploID] += 1
				// end: PLO update
			}
		}
		if !quizFound {
			idvQuizzes = append(idvQuizzes, idvQuiz)
		}
		idvCourse.Los = idvLos
		idvCourse.Quizzes = idvQuizzes
		courseMap[course.ID] = idvCourse
	}

	ploGroups := []*model.DashboardIndividualPLOGroup{}
	for _, ploGroup := range ploGroupMap {
		plos := []*model.DashboardIndividualPlo{}
		for _, plo := range ploGroup.Plos {
			plos = append(plos, plo)
		}
		ploGroups = append(ploGroups, &model.DashboardIndividualPLOGroup{
			Name: ploGroup.Name,
			Plos: plos,
		})
	}
	courses := []*model.DashboardIndividualCourse{}
	for _, course := range courseMap {
		courses = append(courses, course)
	}
	return &model.DashboardIndividual{
		PloGroups: ploGroups,
		Courses:   courses,
	}, nil
}

func (r *queryResolver) IndividualPLOGroupSummary(ctx context.Context, ploGroupID string) (*model.DashboardPLOGroup, error) {
	ploGroup, err := r.Client.PLOgroup.FindUnique(
		db.PLOgroup.ID.Equals(ploGroupID),
	).Exec(ctx)
	if err != nil {
		return &model.DashboardPLOGroup{}, err
	}
	allQuestionResults, err := r.Client.QuestionResult.FindMany(
		db.QuestionResult.Question.Where(
			db.Question.Quiz.Where(
				db.Quiz.Course.Where(
					db.Course.PloGroup.Where(
						db.PLOgroup.ID.Equals(ploGroupID),
					),
				),
			),
		),
	).With(
		db.QuestionResult.Question.Fetch().With(
			db.Question.Quiz.Fetch().With(
				db.Quiz.Course.Fetch(),
			),
			db.Question.Links.Fetch().With(
				db.QuestionLink.LoLevel.Fetch().With(
					db.LOlevel.Lo.Fetch().With(
						db.LO.Links.Fetch().With(
							db.LOlink.Plo.Fetch(),
						),
					),
				),
			),
		),
		db.QuestionResult.Student.Fetch().With(
			db.Student.User.Fetch(),
		),
	).Exec(ctx)
	if err != nil {
		return &model.DashboardPLOGroup{}, err
	}
	type StudentRecord struct {
		percentage float64
		count      float64
	}
	students := map[string]*model.User{}
	ploRecords := map[string]map[string]*StudentRecord{}
	plos := map[string]*model.DashboardPLOGroupDetail{}
	for _, questionResult := range allQuestionResults {
		studentID := questionResult.Student().User().ID
		if _, ok := students[studentID]; !ok {
			students[studentID] = &model.User{
				ID:      studentID,
				Email:   questionResult.Student().User().Email,
				Name:    questionResult.Student().User().Name,
				Surname: questionResult.Student().User().Surname,
			}
		}
		thisPercent := float64(questionResult.Score) / float64(questionResult.Question().MaxScore)
		for _, qlink := range questionResult.Question().Links() {
			for _, llink := range qlink.LoLevel().Lo().Links() {
				ploID := llink.Plo().ID
				ploTitle := llink.Plo().Title
				ploDescription := llink.Plo().Description
				if _, ok := plos[ploID]; !ok {
					plos[ploID] = &model.DashboardPLOGroupDetail{
						Title:       ploTitle,
						Description: ploDescription,
						Stats:       &model.DashboardPLOGroupDetailStats{},
					}
				}
				if _, ok := ploRecords[ploID]; !ok {
					ploRecords[ploID] = map[string]*StudentRecord{}
				}
				if _, ok := ploRecords[ploID][studentID]; !ok {
					ploRecords[ploID][studentID] = &StudentRecord{
						percentage: 0,
						count:      0,
					}
				}
				studentRecord := ploRecords[ploID][studentID]
				studentRecord.percentage = (studentRecord.percentage*studentRecord.count + thisPercent) / (studentRecord.count + 1)
				studentRecord.count += 1
				ploRecords[ploID][studentID] = studentRecord
			}
		}
	}
	st := []*model.User{}
	for _, student := range students {
		st = append(st, student)
	}
	pl := []*model.DashboardPLOGroupDetail{}
	for ploID, plo := range plos {
		var sum float64
		allStudentRecord := []float64{}
		for _, student := range ploRecords[ploID] {
			sum += student.percentage
			allStudentRecord = append(allStudentRecord, student.percentage)
		}
		sort.Float64s(allStudentRecord)
		size := len(allStudentRecord)
		plo.Stats.Min = allStudentRecord[0]
		plo.Stats.Max = allStudentRecord[size-1]
		plo.Stats.Mean = sum / float64(size)
		plo.Stats.Median = (allStudentRecord[size/2] + allStudentRecord[(size-1)/2]) / 2
		pl = append(pl, plo)
	}
	return &model.DashboardPLOGroup{
		Name:     ploGroup.Name,
		Plos:     pl,
		Students: st,
	}, nil
}
