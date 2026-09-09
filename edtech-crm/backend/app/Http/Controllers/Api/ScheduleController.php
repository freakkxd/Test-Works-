<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Schedule;
use App\Models\Attendance;
use Illuminate\Http\Request;

class ScheduleController extends Controller
{
    public function index(Request $request)
    {
        $query = Schedule::with(['teacher', 'course']);

        // Фильтр по периоду (для календаря)
        if ($from = $request->get('from')) {
            $query->where('starts_at', '>=', $from);
        }
        if ($to = $request->get('to')) {
            $query->where('starts_at', '<=', $to);
        }

        if ($teacherId = $request->get('teacher_id')) {
            $query->where('teacher_id', $teacherId);
        }

        return $query->orderBy('starts_at')->get();
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'title' => 'required|string|max:255',
            'teacher_id' => 'required|exists:users,id',
            'group_name' => 'required|string|max:100',
            'room' => 'required|string|max:50',
            'starts_at' => 'required|date',
            'ends_at' => 'required|date|after:starts_at',
            'course_id' => 'nullable|exists:courses,id',
        ]);

        return Schedule::create($data)->load(['teacher', 'course']);
    }

    public function show(Schedule $schedule)
    {
        return $schedule->load(['teacher', 'course', 'attendances.student']);
    }

    public function update(Request $request, Schedule $schedule)
    {
        $data = $request->validate([
            'title' => 'sometimes|string|max:255',
            'teacher_id' => 'sometimes|exists:users,id',
            'group_name' => 'sometimes|string|max:100',
            'room' => 'sometimes|string|max:50',
            'starts_at' => 'sometimes|date',
            'ends_at' => 'sometimes|date|after:starts_at',
            'course_id' => 'nullable|exists:courses,id',
        ]);

        $schedule->update($data);

        return $schedule->load(['teacher', 'course']);
    }

    public function destroy(Schedule $schedule)
    {
        $schedule->delete();
        return response()->json(['message' => 'Занятие удалено']);
    }

    /** Отметка посещаемости */
    public function markAttendance(Request $request, Schedule $schedule)
    {
        $request->validate([
            'attendances' => 'required|array',
            'attendances.*.student_id' => 'required|exists:students,id',
            'attendances.*.present' => 'required|boolean',
            'attendances.*.note' => 'nullable|string',
        ]);

        foreach ($request->attendances as $item) {
            Attendance::updateOrCreate(
                ['schedule_id' => $schedule->id, 'student_id' => $item['student_id']],
                ['present' => $item['present'], 'note' => $item['note'] ?? null]
            );
        }

        return $schedule->load('attendances.student');
    }
}
