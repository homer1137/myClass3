export interface LessonViewModel {
  id: number;
  date: Date;
  title: string;
  status?: number;
  visitCount?: number;
  students?: { id: number; name: string; visit: boolean }[];
  teachers?: { id: number; name: string }[];
}
