<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\StudentController;
use App\Http\Controllers\Api\ScheduleController;
use App\Http\Controllers\Api\PaymentController;
use App\Http\Controllers\Api\ProgressController;
use App\Http\Controllers\Api\CourseController;

Route::post('/login', [AuthController::class, 'login']);
Route::post('/register', [AuthController::class, 'register']);

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/me', [AuthController::class, 'me']);
    Route::post('/logout', [AuthController::class, 'logout']);

    // Студенты — admin, manager
    Route::apiResource('students', StudentController::class);
    Route::get('students/{student}/export', [StudentController::class, 'exportCsv']);

    // Расписание — admin, manager, teacher
    Route::apiResource('schedules', ScheduleController::class);
    Route::post('schedules/{schedule}/attendance', [ScheduleController::class, 'markAttendance']);

    // Оплаты
    Route::apiResource('payments', PaymentController::class);
    Route::get('payments/export/csv', [PaymentController::class, 'exportCsv']);

    // Прогресс
    Route::get('students/{student}/progress', [ProgressController::class, 'show']);
    Route::post('students/{student}/progress/{lesson}', [ProgressController::class, 'toggle']);
    Route::get('students/{student}/certificate', [ProgressController::class, 'certificate']);

    // Курсы
    Route::get('courses', [CourseController::class, 'index']);
    Route::get('courses/{course}', [CourseController::class, 'show']);
});
