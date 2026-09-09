<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Student;
use App\Models\Lesson;
use App\Models\Progress;
use Illuminate\Http\Request;

class ProgressController extends Controller
{
    public function show(Student $student)
    {
        $student->load(['course.lessons', 'progress.lesson']);

        $lessons = $student->course?->lessons ?? collect();
        $completedIds = $student->progress->where('completed', true)->pluck('lesson_id');

        $modules = $lessons->map(function ($lesson) use ($completedIds, $student) {
            $progress = $student->progress->firstWhere('lesson_id', $lesson->id);
            return [
                'lesson' => $lesson,
                'completed' => $completedIds->contains($lesson->id),
                'completed_at' => $progress?->completed_at,
            ];
        });

        return [
            'student' => $student,
            'completion_percent' => $student->completion_percent,
            'modules' => $modules,
            'certificate_available' => $student->completion_percent >= 100,
        ];
    }

    /** Переключить статус урока (завершён / не завершён) */
    public function toggle(Student $student, Lesson $lesson)
    {
        $progress = Progress::firstOrNew([
            'student_id' => $student->id,
            'lesson_id' => $lesson->id,
        ]);

        $progress->completed = !$progress->completed;
        $progress->completed_at = $progress->completed ? now() : null;
        $progress->save();

        return [
            'lesson_id' => $lesson->id,
            'completed' => $progress->completed,
            'completion_percent' => $student->fresh()->completion_percent,
        ];
    }

    /** Сертификат при 100% завершении */
    public function certificate(Student $student)
    {
        if ($student->completion_percent < 100) {
            return response()->json([
                'message' => 'Сертификат доступен при 100% завершении курса',
                'completion_percent' => $student->completion_percent,
            ], 403);
        }

        return [
            'certificate' => [
                'student_name' => $student->name,
                'course_name' => $student->course->name,
                'issued_at' => now()->toISOString(),
                'certificate_id' => 'CERT-' . strtoupper(substr(md5($student->id . $student->course_id), 0, 8)),
            ],
        ];
    }
}
