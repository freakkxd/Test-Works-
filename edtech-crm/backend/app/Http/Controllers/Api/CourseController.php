<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Course;

class CourseController extends Controller
{
    public function index()
    {
        return Course::withCount('students', 'lessons')->get();
    }

    public function show(Course $course)
    {
        return $course->load('lessons');
    }
}
