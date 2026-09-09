<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Student;
use Illuminate\Http\Request;

class StudentController extends Controller
{
    public function index(Request $request)
    {
        $query = Student::with(['course', 'payments', 'progress']);

        if ($search = $request->get('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%")
                  ->orWhere('phone', 'like', "%{$search}%");
            });
        }

        if ($courseId = $request->get('course_id')) {
            $query->where('course_id', $courseId);
        }

        return $query->orderBy('created_at', 'desc')->paginate(20);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:students',
            'phone' => 'nullable|string|max:20',
            'course_id' => 'required|exists:courses,id',
        ]);

        $data['enrolled_at'] = now();

        $student = Student::create($data);

        return response()->json($student->load('course'), 201);
    }

    public function show(Student $student)
    {
        return $student->load([
            'course.lessons',
            'payments' => fn($q) => $q->orderBy('due_date', 'desc'),
            'progress.lesson',
            'attendances.schedule',
        ])->append('completion_percent');
    }

    public function update(Request $request, Student $student)
    {
        $data = $request->validate([
            'name' => 'sometimes|string|max:255',
            'email' => 'sometimes|email|unique:students,email,' . $student->id,
            'phone' => 'nullable|string|max:20',
            'course_id' => 'sometimes|exists:courses,id',
        ]);

        $student->update($data);

        return $student->load('course');
    }

    public function destroy(Student $student)
    {
        $student->delete();
        return response()->json(['message' => 'Студент удалён']);
    }

    /** Экспорт студентов в CSV */
    public function exportCsv()
    {
        $students = Student::with('course')->get();

        $csv = "ID,Имя,Email,Телефон,Курс,Дата регистрации\n";
        foreach ($students as $s) {
            $csv .= implode(',', [
                $s->id,
                '"' . $s->name . '"',
                $s->email,
                $s->phone ?? '',
                '"' . ($s->course->name ?? '') . '"',
                $s->enrolled_at?->format('Y-m-d') ?? '',
            ]) . "\n";
        }

        return response($csv, 200, [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => 'attachment; filename="students.csv"',
        ]);
    }
}
