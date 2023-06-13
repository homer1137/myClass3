export interface LessonCreateModel {
    title: string
    teacherIds: number[]
    days: number[]
    firstDate: Date,
    lastDate?: Date,
    lessonsCount?: number
  }
  